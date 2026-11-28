import { readFile } from 'node:fs/promises';
import { expect, test as baseTest, type BrowserContext, type Page } from '@playwright/test';
import type { BookWithStatus } from '../src/store/useBookStore';

const storageKey = 'bookshelf-storage';
const sourceBooks: BookWithStatus[] = [
  {
    id: 'source-favorite',
    title: 'Книга в избранном',
    authors: ['Первый автор', 'Второй автор'],
    description: 'Описание тестовой книги',
    imageUrl: 'https://example.test/cover.jpg',
    publishedDate: '2017-03-20',
    publisher: 'Тестовое издательство',
    pageCount: 256,
    categories: ['Фантастика', 'Роман'],
    averageRating: 4.5,
    ratingsCount: 32,
    previewLink: 'https://example.test/preview',
    infoLink: 'https://example.test/books/source-favorite',
    status: 'favorite',
    addedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'source-read',
    title: 'Прочитанная книга',
    status: 'read',
    addedAt: '2026-02-02T11:01:00.000Z',
  },
  {
    id: 'source-want',
    title: 'Книга в списке желаний',
    status: 'want-to-read',
    addedAt: '2026-03-03T12:02:00.000Z',
  },
  {
    id: 'source-no-status',
    title: 'Книга без статуса',
    status: null,
    addedAt: '2026-04-04T13:03:00.000Z',
  },
];
const recipientBook: BookWithStatus = {
  id: 'recipient-book',
  title: 'Своя книга',
  authors: ['Локальный автор'],
  status: 'favorite',
  addedAt: '2025-01-05T08:20:00.000Z',
};

const test = baseTest.extend<{
  openLibrary: (books: BookWithStatus[], hostname?: string) => Promise<Page>;
}>({
  openLibrary: async ({ browser, baseURL }, run) => {
    if (!baseURL) throw new Error('Library transfer tests require use.baseURL');
    const contexts: BrowserContext[] = [];
    try {
      await run(async (books, hostname) => {
        const address = new URL(baseURL);
        if (hostname) address.hostname = hostname;
        const origin = address.origin;
        const context = await browser.newContext({
          acceptDownloads: true,
          serviceWorkers: 'block',
          storageState: {
            cookies: [],
            origins: [{
              origin,
              localStorage: [{ name: storageKey, value: JSON.stringify({ state: { books }, version: 0 }) }],
            }],
          },
        });
        contexts.push(context);
        await context.route('**/*', (route) =>
          new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        const page = await context.newPage();
        await page.goto(address.href);
        await page.getByRole('link', { name: 'Перенос библиотеки', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Перенос библиотеки', exact: true })).toBeVisible();
        return page;
      });
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  },
});

function sortedById(books: BookWithStatus[]) {
  return [...books].sort((first, second) => first.id.localeCompare(second.id));
}

async function savedBooks(page: Page): Promise<BookWithStatus[]> {
  return page.evaluate((key) => {
    const storage = localStorage.getItem(key);
    if (storage === null) throw new Error('Missing local library storage');
    return JSON.parse(storage).state.books;
  }, storageKey);
}

async function downloadLibrary(page: Page, destination: string) {
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Экспортировать библиотеку', exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.json$/i);
  await download.saveAs(destination);
  return JSON.parse(await readFile(destination, 'utf8'));
}

function fileInput(page: Page) {
  return page.getByLabel('Выбрать файл библиотеки', { exact: true });
}

const jsonUpload = (content: string) => ({
  name: 'library.json',
  mimeType: 'application/json',
  buffer: Buffer.from(content, 'utf8'),
});

async function importFile(page: Page, file: string | ReturnType<typeof jsonUpload>) {
  await fileInput(page).setInputFiles(file);
  await page.getByRole('button', { name: 'Импортировать библиотеку', exact: true }).click();
}

async function expectImport(page: Page, added: number, skipped: number) {
  const status = page.getByRole('status');
  await expect(status).toHaveText(new RegExp('добавлено\\D*' + added + '\\b', 'i'));
  await expect(status).toHaveText(new RegExp('совпало\\D*' + skipped + '\\b', 'i'));
  await expect(page.getByRole('alert')).toBeHidden();
}

function librarySize(page: Page, count: number) {
  return page.getByText('В библиотеке: ' + count, { exact: true });
}

test('exports and restores a complete library across browser origins without duplicating books', async ({ openLibrary }, testInfo) => {
  const source = await openLibrary(sourceBooks);
  const sourceOrigin = new URL(source.url()).origin;
  const targetAddress = new URL(sourceOrigin);
  targetAddress.hostname = targetAddress.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
  const target = await openLibrary([recipientBook], targetAddress.hostname);
  expect(new URL(target.url()).origin).not.toBe(sourceOrigin);

  const file = testInfo.outputPath('exported-library.json');
  const exported = await downloadLibrary(source, file);
  expect(exported).toEqual({ version: 1, books: sourceBooks });
  await expect.poll(() => savedBooks(source)).toEqual(sourceBooks);

  const expected = sortedById([recipientBook, ...sourceBooks]);
  await importFile(target, file);
  await expectImport(target, 4, 0);
  await expect.poll(async () => sortedById(await savedBooks(target))).toEqual(expected);

  await importFile(target, file);
  await expectImport(target, 0, 4);
  await expect.poll(async () => sortedById(await savedBooks(target))).toEqual(expected);

  await target.reload();
  await expect(target.getByRole('heading', { name: 'Перенос библиотеки', exact: true })).toBeVisible();
  await expect.poll(async () => sortedById(await savedBooks(target))).toEqual(expected);
  const reexported = await downloadLibrary(target, testInfo.outputPath('restored-library.json'));
  expect(reexported).toEqual({ version: 1, books: expect.any(Array) });
  expect(sortedById(reexported.books)).toEqual(expected);
});

const invalidFiles = [
  {
    description: 'malformed JSON',
    contents: '{"version": 1, "books": [',
  },
  {
    description: 'an invalid book after a valid book',
    contents: JSON.stringify({ version: 1, books: [sourceBooks[0], { ...sourceBooks[1], status: 'invalid' }] }),
  },
  {
    description: 'an unsupported file version',
    contents: JSON.stringify({ version: 2, books: [sourceBooks[0]] }),
  },
];

for (const { description, contents } of invalidFiles) {
  test('rejects ' + description + ' without changing the current library', async ({ openLibrary }) => {
    const page = await openLibrary([recipientBook]);
    await importFile(page, jsonUpload(contents));
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('status')).toBeHidden();
    await expect.poll(() => savedBooks(page)).toEqual([recipientBook]);
  });
}

test('a duplicate id with a different status rejects the whole import', async ({ openLibrary }) => {
  const page = await openLibrary([recipientBook]);
  const conflictingBook = { ...recipientBook, status: 'read' };
  await importFile(page, jsonUpload(JSON.stringify({ version: 1, books: [sourceBooks[0], conflictingBook] })));
  await expect(page.getByRole('alert')).toHaveText(/конфликт|статус/i);
  await expect(page.getByRole('status')).toBeHidden();
  await expect.poll(() => savedBooks(page)).toEqual([recipientBook]);
});

test('a failed localStorage write leaves the open and persisted library intact', async ({ openLibrary }, testInfo) => {
  const page = await openLibrary([recipientBook]);
  await page.evaluate((libraryKey) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === libraryKey) {
        throw new DOMException('Test quota exhausted', 'QuotaExceededError');
      }
      return original.call(this, name, value);
    };
  }, storageKey);

  await importFile(page, jsonUpload(JSON.stringify({ version: 1, books: [sourceBooks[0]] })));
  await expect(page.getByRole('alert')).toHaveText(/не удалось сохранить библиотеку/i);
  await expect(page.getByRole('status')).toBeHidden();
  await expect(librarySize(page, 1)).toBeVisible();
  await expect.poll(() => savedBooks(page)).toEqual([recipientBook]);
  const exported = await downloadLibrary(page, testInfo.outputPath('library-after-quota-error.json'));
  expect(exported).toEqual({ version: 1, books: [recipientBook] });

  await page.reload();
  await expect(librarySize(page, 1)).toBeVisible();
  await expect.poll(() => savedBooks(page)).toEqual([recipientBook]);
});

test('a stale tab refuses to import until reloading the shared library', async ({ openLibrary }) => {
  const first = await openLibrary([recipientBook]);
  const second = await first.context().newPage();
  await second.goto(first.url());
  await expect(librarySize(second, 1)).toBeVisible();

  const savedInFirstTab = sourceBooks[1];
  const transferredInSecondTab = sourceBooks[2];
  await importFile(first, jsonUpload(JSON.stringify({ version: 1, books: [savedInFirstTab] })));
  await expectImport(first, 1, 0);
  const unchanged = sortedById([recipientBook, savedInFirstTab]);
  await expect.poll(async () => sortedById(await savedBooks(second))).toEqual(unchanged);
  await expect(librarySize(second, 1)).toBeVisible();

  const transfer = jsonUpload(JSON.stringify({ version: 1, books: [transferredInSecondTab] }));
  await importFile(second, transfer);
  await expect(second.getByRole('alert')).toHaveText(
    'Библиотека изменилась в другой вкладке. Обновите страницу и повторите импорт.',
  );
  await expect(second.getByRole('status')).toBeHidden();
  await expect.poll(async () => sortedById(await savedBooks(second))).toEqual(unchanged);

  await second.reload();
  await expect(librarySize(second, 2)).toBeVisible();
  await importFile(second, transfer);
  await expectImport(second, 1, 0);
  await expect(librarySize(second, 3)).toBeVisible();
  await expect.poll(async () => sortedById(await savedBooks(second)))
    .toEqual(sortedById([recipientBook, savedInFirstTab, transferredInSecondTab]));
});

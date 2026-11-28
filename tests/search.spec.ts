import { expect, test, type Page, type Route } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const googleEndpoint = 'https://www.googleapis.com/books/v1/volumes';
const openLibraryEndpoint = 'https://openlibrary.org/search.json';
const replyReadMarker = 'bookshelf-test:response-read';
const unavailable = { status: 503, json: { error: { message: 'Service unavailable' } } };

type MockReply = { status: number; json: object };
type SearchTestWindow = Window & {
  readonly __bookshelfSearchRequests?: { google: number; openLibrary: number };
};

function found(id: string, title: string, totalItems: number): MockReply {
  return { status: 200, json: { totalItems, items: [{ id, volumeInfo: { title } }] } };
}

async function openSearch(page: Page, baseURL: string | undefined) {
  if (!baseURL) throw new Error('Search tests require use.baseURL');
  const localOrigin = new URL(baseURL).origin;
  const googleRequests: Route[] = [];
  const openLibraryRequests: Route[] = [];

  await page.context().route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const endpoint = url.origin + url.pathname;
    const get = request.method() === 'GET';
    if (url.origin === localOrigin) {
      await route.continue();
    } else if (get && endpoint === googleEndpoint) {
      googleRequests.push(route);
    } else if (get && endpoint === openLibraryEndpoint) {
      openLibraryRequests.push(route);
    } else {
      await route.abort();
    }
  });

  // Wait for the application to receive HTTP failures or parse successful bodies
  // before checking that a late reply had no effect. Arrival at the route is too early.
  await page.addInitScript(({ google, openLibrary, replyRead }) => {
    const requestCounts = { google: 0, openLibrary: 0 };
    Object.defineProperty(window, '__bookshelfSearchRequests', { get: () => requestCounts });
    const fetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);
      if (url.startsWith(google + '?')) {
        requestCounts.google++;
      } else if (url.startsWith(openLibrary + '?')) {
        requestCounts.openLibrary++;
      } else {
        return fetch(...args);
      }
      const response = await fetch(...args);

      const reportRead = () => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = () => {
          port1.close();
          port2.close();
          console.debug(replyRead, response.url);
        };
        port2.postMessage(null);
      };

      if (!response.ok) {
        reportRead();
      } else {
        const read = response.json.bind(response);
        response.json = async () => {
          const body: unknown = await read();
          reportRead();
          return body;
        };
      }
      return response;
    };
  }, { google: googleEndpoint, openLibrary: openLibraryEndpoint, replyRead: replyReadMarker });

  await page.clock.install({ time: new Date('2026-01-01T08:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T10:00:00Z'));
  await page.goto('/');

  const field = page.getByRole('textbox');
  const loading = page.getByRole('button', { name: 'Поиск...', exact: true });
  const empty = page.getByRole('heading', { name: 'Книги не найдены' });
  const error = page.getByRole('alert').filter({ hasText: 'Не удалось выполнить поиск' });
  const retry = page.getByRole('button', { name: 'Повторить поиск' });

  async function requestAt(index: number, query: string, offset = 0) {
    await expect.poll(() => googleRequests[index]?.request().url()).toBeDefined();
    const route = googleRequests[index];
    const parameters = new URL(route.request().url()).searchParams;
    expect(parameters.get('q')).toBe(query);
    expect(parameters.get('startIndex')).toBe(String(offset));
    expect(parameters.get('maxResults')).toBe('20');
    return route;
  }

  async function submit(query: string) {
    const index = googleRequests.length;
    await field.fill(query);
    await field.press('Enter');
    return requestAt(index, query);
  }

  async function reply(route: Route, response: MockReply) {
    const request = route.request();
    const [received] = await Promise.all([
      page.waitForResponse((response) => response.request() === request),
      page.waitForEvent('console', { predicate: (message) =>
        message.type() === 'debug' && message.text() === replyReadMarker + ' ' + request.url(),
      }),
      route.fulfill(response),
    ]);
    expect(received.status()).toBe(response.status);
    expect(await received.finished()).toBeNull();
    await page.clock.runFor(32);
  }

  async function fallbackFor(googleRequest: Route) {
    const index = openLibraryRequests.length;
    await reply(googleRequest, unavailable);
    await expect.poll(() => openLibraryRequests[index]?.request().url()).toBeDefined();
    const route = openLibraryRequests[index];
    const googleParameters = new URL(googleRequest.request().url()).searchParams;
    const recorded = new URL(route.request().url()).searchParams;
    const limit = Number(googleParameters.get('maxResults'));
    const pageNumber = Number(googleParameters.get('startIndex')) / limit + 1;
    expect(recorded.get('q')).toBe(googleParameters.get('q'));
    expect(recorded.get('page')).toBe(String(pageNumber));
    expect(recorded.get('limit')).toBe(String(limit));
    return route;
  }

  async function fail(googleRequest: Route) {
    await reply(await fallbackFor(googleRequest), unavailable);
  }

  const requestCounts = () => page.evaluate(() => (window as SearchTestWindow).__bookshelfSearchRequests);

  return { requestCounts, field, loading, empty, error, retry, submit, requestAt, reply, fallbackFor, fail };
}

const lateReplies = [
  { description: 'successful result', response: found('old', 'Старая книга', 7) },
  { description: 'failure from both providers' },
];

for (const { description, response } of lateReplies) {
  test('new search survives a late ' + description, async ({ page, baseURL }) => {
    const search = await openSearch(page, baseURL);
    const earlier = await search.submit('Старый запрос');
    const latest = await search.submit('Новый запрос');

    await search.reply(latest, found('new', 'Новая книга', 42));
    await expect(page.getByRole('heading', { name: 'Новая книга' })).toBeVisible();
    if (response) {
      await search.reply(earlier, response);
    } else {
      await search.fail(earlier);
    }

    await expect(page.getByRole('heading', { name: 'Новая книга' })).toBeVisible();
    await expect(page.getByText(/Найдено\s+42\s+книг/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Старая книга' })).toBeHidden();
    await expect(search.error).toBeHidden();
  });
}

test('a stale error cannot stop loading for the current search', async ({ page, baseURL }) => {
  const search = await openSearch(page, baseURL);
  const earlier = await search.submit('Старый запрос');
  const latest = await search.submit('Новый запрос');

  await search.fail(earlier);
  await expect(search.loading).toBeVisible();
  await expect(search.error).toBeHidden();

  await search.reply(latest, found('new', 'Новая книга', 1));
  await expect(page.getByRole('heading', { name: 'Новая книга' })).toBeVisible();
  await expect(search.loading).toBeHidden();
});

test('a successful empty response shows the empty screen', async ({ page, baseURL }) => {
  const search = await openSearch(page, baseURL);
  const request = await search.submit('Без совпадений');
  await search.reply(request, { status: 200, json: { totalItems: 0 } });

  await expect(search.empty).toBeVisible();
  await expect(search.error).toBeHidden();
  await expect(search.retry).toBeHidden();
  expect(await search.requestCounts()).toEqual({ google: 1, openLibrary: 0 });
});

test('failure from both providers on page two shows an error and retry repeats that request once', async ({ page, baseURL }) => {
  const search = await openSearch(page, baseURL);
  const query = 'Лев Толстой';
  const first = await search.submit(query);
  await search.reply(first, found('tolstoy-one', 'Анна Каренина', 42));
  await expect(page.getByRole('heading', { name: 'Анна Каренина' })).toBeVisible();
  await page.getByRole('button', { name: 'Вперед →' }).press('Enter');
  const second = await search.requestAt(1, query, 20);
  await search.fail(second);

  await expect(search.error).toBeVisible();
  await expect(search.empty).toBeHidden();
  await expect(search.field).toHaveValue(query);
  await expect(search.retry).toBeEnabled();
  await search.retry.press('Enter');
  const repeated = await search.requestAt(2, query, 20);
  expect(repeated.request().url()).toBe(second.request().url());
  await expect(search.field).toBeFocused();
  await expect(search.loading).toBeVisible();
  await expect(search.error).toBeHidden();

  await search.reply(repeated, found('tolstoy-two', 'Война и мир', 42));
  await expect(page.getByRole('heading', { name: 'Война и мир' })).toBeVisible();
  await expect(page.getByText('Страница 2 из 3', { exact: true })).toBeVisible();
  await expect(search.field).toHaveValue(query);
  await expect(search.loading).toBeHidden();
  await page.clock.runFor(500);
  expect(await search.requestCounts()).toEqual({ google: 3, openLibrary: 1 });
});

test('Open Library supplies results when Google Books returns HTTP 503', async ({ page, baseURL }) => {
  const search = await openSearch(page, baseURL);
  const primary = await search.submit('Иван Тургенев');
  const fallback = await search.fallbackFor(primary);
  await expect(search.loading).toBeVisible();
  await expect(search.error).toBeHidden();

  await search.reply(fallback, {
    status: 200,
    json: {
      numFound: 12,
      docs: [{ key: '/works/OL123W', title: 'Дворянское гнездо', author_name: ['Иван Тургенев'] }],
    },
  });
  await expect(page.getByRole('heading', { name: 'Дворянское гнездо' })).toBeVisible();
  await expect(page.getByText(/Найдено\s+12\s+книг/)).toBeVisible();
  await expect(search.loading).toBeHidden();
  await expect(search.error).toBeHidden();
  await expect(search.retry).toBeHidden();
  expect(await search.requestCounts()).toEqual({ google: 1, openLibrary: 1 });
});

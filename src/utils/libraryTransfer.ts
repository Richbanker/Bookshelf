import type { BookWithStatus } from '../store/useBookStore';

export const LIBRARY_TRANSFER_VERSION = 1;

const textFields = ['description', 'publishedDate', 'publisher'] as const;
const listFields = ['authors', 'categories'] as const;
const countFields = ['pageCount', 'ratingsCount'] as const;
const linkFields = ['imageUrl', 'previewLink', 'infoLink'] as const;
const metadataFields = [...textFields, ...listFields, ...countFields, ...linkFields, 'averageRating'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLibraryLink(value: unknown): value is string {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || value.trim() !== value || value.includes('\\')) {
    return false;
  }

  try {
    const url = new URL(value);
    return !url.username && !url.password;
  } catch {
    return false;
  }
}

function parseBook(value: unknown, index: number): BookWithStatus {
  const invalidField = (field: string) => new Error(`Запись №${index + 1}: недопустимое поле «${field}».`);
  if (!isRecord(value)) throw new Error(`Запись №${index + 1} должна быть объектом.`);

  const { id, title, status, addedAt } = value;
  if (typeof id !== 'string' || !/^(?:[a-z0-9_-]+|openlibrary:OL[0-9]+W)$/i.test(id)) throw invalidField('id');
  if (typeof title !== 'string' || !title.trim()) throw invalidField('title');
  if (status !== 'favorite' && status !== 'read' && status !== 'want-to-read' && status !== null) throw invalidField('status');
  if (typeof addedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(addedAt) || !Number.isFinite(Date.parse(addedAt))) {
    throw invalidField('addedAt');
  }

  const book: BookWithStatus = { id, title, status, addedAt };

  for (const field of textFields) {
    const entry = value[field];
    if (entry === undefined) continue;
    if (typeof entry !== 'string') throw invalidField(field);
    book[field] = entry;
  }
  for (const field of listFields) {
    const entry = value[field];
    if (entry === undefined) continue;
    if (!Array.isArray(entry) || !entry.every((item): item is string => typeof item === 'string')) throw invalidField(field);
    book[field] = entry;
  }
  for (const field of countFields) {
    const entry = value[field];
    if (entry === undefined) continue;
    if (typeof entry !== 'number' || !Number.isSafeInteger(entry) || entry < 0) throw invalidField(field);
    book[field] = entry;
  }
  for (const field of linkFields) {
    const entry = value[field];
    if (entry === undefined) continue;
    if (!isLibraryLink(entry)) throw invalidField(field);
    book[field] = entry;
  }
  const { averageRating } = value;
  if (averageRating !== undefined) {
    if (typeof averageRating !== 'number' || !Number.isFinite(averageRating) || averageRating < 0 || averageRating > 5) {
      throw invalidField('averageRating');
    }
    book.averageRating = averageRating;
  }
  return book;
}

export function parseLibraryTransfer(contents: string): BookWithStatus[] {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error('Файл не содержит корректный JSON.');
  }
  if (!isRecord(value) || value.version !== LIBRARY_TRANSFER_VERSION || !Array.isArray(value.books)) {
    throw new Error('Нужен файл библиотеки Bookshelf в формате JSON версии 1.');
  }

  const ids = new Set<string>();
  return value.books.map((entry, index) => {
    const book = parseBook(entry, index);
    if (ids.has(book.id)) throw new Error(`Повторяющийся идентификатор книги в записи №${index + 1}.`);
    ids.add(book.id);
    return book;
  });
}

export function mergeLibraryBooks(currentBooks: BookWithStatus[], importedBooks: BookWithStatus[]) {
  const booksById = new Map(currentBooks.map((book) => [book.id, book]));
  let added = 0;
  let matched = 0;
  let enriched = 0;

  for (const book of importedBooks) {
    const current = booksById.get(book.id);
    if (!current) {
      booksById.set(book.id, book);
      added++;
      continue;
    }
    if (current.status !== book.status) {
      throw new Error(`Конфликт статусов у книги «${current.title}». Согласуйте её статус в двух библиотеках и повторите импорт.`);
    }
    matched++;

    const missingFields = metadataFields.filter((field) => current[field] === undefined && book[field] !== undefined);
    if (missingFields.length > 0) {
      const additions = Object.fromEntries(missingFields.map((field) => [field, book[field]]));
      booksById.set(book.id, { ...current, ...additions });
      enriched++;
    }
  }

  return { books: [...booksById.values()], added, matched, enriched };
}

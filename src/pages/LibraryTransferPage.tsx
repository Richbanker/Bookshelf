import { useState } from 'react';
import type { FormEvent } from 'react';
import { useBookStore } from '../store/useBookStore';
import { LIBRARY_TRANSFER_VERSION } from '../utils/libraryTransfer';

const buttonClass = 'rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50';
const maxFileBytes = 16 * 1024 * 1024;

export default function LibraryTransferPage() {
  const books = useBookStore((state) => state.books);
  const importLibrary = useBookStore((state) => state.importLibrary);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);

  const exportLibrary = () => {
    const data = JSON.stringify({ version: LIBRARY_TRANSFER_VERSION, books });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bookshelf-library.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || isImporting) return;

    const form = event.currentTarget;
    setFeedback(null);
    setIsImporting(true);
    try {
      if (file.size > maxFileBytes) throw new Error('Файл слишком большой. Максимальный размер — 16 МБ.');
      const contents = await file.text().catch(() => {
        throw new Error('Не удалось прочитать файл библиотеки.');
      });
      const { added, matched, enriched } = importLibrary(contents);
      setFeedback({
        message: `Добавлено: ${added}. Совпало: ${matched}. Дополнено метаданными: ${enriched}.`,
        error: false,
      });
      form.reset();
      setFile(null);
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Не удалось импортировать библиотеку.', error: true });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Перенос библиотеки</h1>
      <p className="mt-3 text-slate-600">
        Скачайте файл на старом сайте и импортируйте его на новом, чтобы перенести книги и их статусы.
      </p>
      <p className="mt-2 font-medium text-slate-700">В библиотеке: {books.length.toLocaleString('ru-RU')}</p>

      <div className="mt-8 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">Экспорт</h2>
          <button type="button" onClick={exportLibrary} className={`mt-4 ${buttonClass}`}>
            Экспортировать библиотеку
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">Импорт</h2>
          <form onSubmit={handleImport} className="mt-4 flex flex-col items-start gap-4">
            <label htmlFor="library-file" className="font-medium text-slate-700">Выбрать файл библиотеки</label>
            <input
              id="library-file"
              type="file"
              accept=".json,application/json"
              disabled={isImporting}
              onChange={(event) => {
                setFile(event.currentTarget.files?.[0] ?? null);
                setFeedback(null);
              }}
              className="w-full min-w-0 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-medium"
            />
            <button type="submit" disabled={!file || isImporting} className={buttonClass}>
              Импортировать библиотеку
            </button>
          </form>
          {isImporting && <p role="status" className="mt-4 text-slate-700">Импортируем библиотеку…</p>}
          {feedback && (
            <p role={feedback.error ? 'alert' : 'status'} className={`mt-4 ${feedback.error ? 'text-red-800' : 'text-slate-700'}`}>
              {feedback.message}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

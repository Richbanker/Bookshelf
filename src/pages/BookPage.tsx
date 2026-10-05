import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getBookDetails } from '../api/googleBooks';
import type { Book } from '../store/useBookStore';
import { useBookStore } from '../store/useBookStore';
import { BookOpen, User, Calendar } from 'lucide-react';

export default function BookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchResults = useBookStore((s) => s.searchResults);
  const getFavoriteBooks = useBookStore((s) => s.getFavoriteBooks);
  const getReadBooks = useBookStore((s) => s.getReadBooks);
  const getWantToReadBooks = useBookStore((s) => s.getWantToReadBooks);

  // Ищем книгу по id во всех списках
  const cachedBook =
    searchResults.find((b) => b.id === id) ||
    getFavoriteBooks().find((b) => b.id === id) ||
    getWantToReadBooks().find((b) => b.id === id) ||
    getReadBooks().find((b) => b.id === id);

  const [loadedBook, setLoadedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setLoadedBook(null);
    setFailed(false);
    if (!id || cachedBook) return;
    setLoading(true);
    getBookDetails(id).then((result) => { if (active) setLoadedBook(result); })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, cachedBook]);
  const book = cachedBook || (loadedBook?.id === id ? loadedBook : null);

  if (!book && (loading || !failed)) return <p role="status" className="text-center py-16">Загрузка книги...</p>;

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BookOpen size={48} className="text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Не удалось загрузить книгу</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">Назад</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <button onClick={() => navigate(-1)} className="mb-6 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">← Назад</button>
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/3 flex-shrink-0">
          {book.imageUrl ? (
            <img src={book.imageUrl} alt={book.title} className="w-full rounded-2xl shadow-lg" />
          ) : (
            <div className="w-full aspect-[3/4] bg-slate-100 flex items-center justify-center rounded-2xl">
              <BookOpen size={64} className="text-slate-300" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4 text-slate-900">{book.title}</h1>
          {book.authors && (
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <User size={18} />
              <span>{book.authors.join(', ')}</span>
            </div>
          )}
          {book.publishedDate && (
            <div className="flex items-center gap-2 mb-4 text-slate-500">
              <Calendar size={16} />
              <span>{new Date(book.publishedDate).toLocaleDateString()}</span>
            </div>
          )}
          {book.description && (
            <p className="whitespace-pre-line text-slate-800 mb-6">{book.description}</p>
          )}
          {book.previewLink && (
            <a
              href={book.previewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-2 bg-blue-500 !text-white rounded-xl hover:bg-blue-600 transition"
            >
              Читать фрагмент
            </a>
          )}
          {/* Можно добавить больше информации по желанию */}
        </div>
      </div>
    </div>
  );
} 

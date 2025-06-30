import { useParams, useNavigate } from 'react-router-dom';
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
  const book =
    searchResults.find((b) => b.id === id) ||
    getFavoriteBooks().find((b) => b.id === id) ||
    getWantToReadBooks().find((b) => b.id === id) ||
    getReadBooks().find((b) => b.id === id);

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BookOpen size={48} className="text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Книга не найдена</h2>
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
            <div className="prose max-w-none text-slate-800 mb-6" dangerouslySetInnerHTML={{ __html: book.description }} />
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
import { Heart, BookOpen, Bookmark, Star, Calendar, User } from 'lucide-react';
import type { Book } from '../store/useBookStore';
import { useBookStore } from '../store/useBookStore';
import { Link } from 'react-router-dom';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const {
    isBookFavorite,
    isBookRead,
    isBookWantToRead,
    addToFavorites,
    removeFromFavorites,
    markAsRead,
    removeFromRead,
    addToWantToRead,
    removeFromWantToRead,
  } = useBookStore();

  const isFavorite = isBookFavorite(book.id);
  const isRead = isBookRead(book.id);
  const isWantToRead = isBookWantToRead(book.id);

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(book.id);
    } else {
      addToFavorites(book);
    }
  };

  const handleReadToggle = () => {
    if (isRead) {
      removeFromRead(book.id);
    } else {
      markAsRead(book);
    }
  };

  const handleWantToReadToggle = () => {
    if (isWantToRead) {
      removeFromWantToRead(book.id);
    } else {
      addToWantToRead(book);
    }
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 hover:border-slate-200 transform hover:-translate-y-1">
      {/* Обложка книги */}
      <Link to={`/book/${book.id}`} className="block aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500">
        {book.imageUrl ? (
          <img
            src={book.imageUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <BookOpen size={48} />
          </div>
        )}
        
        {/* Градиентный оверлей */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Кнопки действий */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={handleFavoriteToggle}
            className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 ${
              isFavorite 
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-md hover:shadow-lg'
            }`}
            title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          
          <button
            onClick={handleReadToggle}
            className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 ${
              isRead 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-md hover:shadow-lg'
            }`}
            title={isRead ? 'Отметить как непрочитанную' : 'Отметить как прочитанную'}
          >
            <BookOpen size={16} fill={isRead ? 'currentColor' : 'none'} />
          </button>
          
          <button
            onClick={handleWantToReadToggle}
            className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 ${
              isWantToRead 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-md hover:shadow-lg'
            }`}
            title={isWantToRead ? 'Убрать из списка желаний' : 'Добавить в список желаний'}
          >
            <Bookmark size={16} fill={isWantToRead ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Статусные индикаторы */}
        <div className="absolute top-3 left-3 flex gap-1">
          {isFavorite && (
            <div className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium shadow-md">
              ❤️
            </div>
          )}
          {isRead && (
            <div className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium shadow-md">
              ✓
            </div>
          )}
          {isWantToRead && (
            <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium shadow-md">
              🔖
            </div>
          )}
        </div>
      </Link>
      
      {/* Информация о книге */}
      <div className="p-4">
        <Link to={`/book/${book.id}`} className="block focus:outline-none focus:ring-2 focus:ring-blue-500">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors duration-200">
            {book.title}
          </h3>
        </Link>
        
        {book.authors && book.authors.length > 0 && (
          <div className="flex items-center gap-1 mb-3 text-slate-600 text-xs">
            <User size={12} />
            <span className="line-clamp-1">{book.authors.join(', ')}</span>
          </div>
        )}
        
        {/* Рейтинг */}
        {book.averageRating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    fill={i < Math.floor(book.averageRating!) ? 'currentColor' : 'none'} 
                  />
                ))}
              </div>
              <span className="text-slate-500 text-xs font-medium">
                {book.averageRating.toFixed(1)}
              </span>
            </div>
            {book.ratingsCount && (
              <span className="text-slate-400 text-xs">
                ({book.ratingsCount.toLocaleString()})
              </span>
            )}
          </div>
        )}
        
        {/* Метаданные */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          {book.publishedDate && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{new Date(book.publishedDate).getFullYear()}</span>
            </div>
          )}
          
          {book.pageCount && (
            <span className="font-medium">
              {book.pageCount} стр.
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 
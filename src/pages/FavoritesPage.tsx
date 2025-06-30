import { Heart } from 'lucide-react';
import { useBookStore } from '../store/useBookStore';
import BookCard from '../components/BookCard';

export default function FavoritesPage() {
  const { getFavoriteBooks } = useBookStore();
  const favoriteBooks = getFavoriteBooks();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Heart size={24} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Избранные книги
          </h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Ваши любимые книги, которые вы добавили в избранное.
        </p>
      </div>
      
      {favoriteBooks.length > 0 ? (
        <>
          {/* Статистика */}
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/50 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Heart size={20} className="text-red-500" />
                <h2 className="text-xl font-semibold text-slate-800">Ваша библиотека</h2>
              </div>
              <p className="text-slate-600">
                {favoriteBooks.length} {favoriteBooks.length === 1 ? 'книга' : 
                  favoriteBooks.length < 5 ? 'книги' : 'книг'} в избранном
              </p>
            </div>
          </div>
          
          {/* Сетка книг */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {favoriteBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Heart size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Избранных книг пока нет</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Найдите интересные книги на главной странице и добавьте их в избранное, нажав на сердечко ❤️
          </p>
        </div>
      )}
    </div>
  );
} 
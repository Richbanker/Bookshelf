import { CheckCircle } from 'lucide-react';
import { useBookStore } from '../store/useBookStore';
import BookCard from '../components/BookCard';

export default function ReadPage() {
  const { getReadBooks } = useBookStore();
  const readBooks = getReadBooks();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
            <CheckCircle size={24} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Прочитанные книги
          </h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Ваша библиотека уже прочитанных книг с возможностью оставить отзывы и оценки.
        </p>
      </div>
      
      {readBooks.length > 0 ? (
        <>
          {/* Статистика */}
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/50 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={20} className="text-green-500" />
                <h2 className="text-xl font-semibold text-slate-800">Ваши достижения</h2>
              </div>
              <p className="text-slate-600">
                {readBooks.length} {readBooks.length === 1 ? 'книга' : 
                  readBooks.length < 5 ? 'книги' : 'книг'} прочитано
              </p>
            </div>
          </div>
          
          {/* Сетка книг */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {readBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Прочитанных книг пока нет</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Найдите интересные книги на главной странице и отметьте их как прочитанные, нажав на галочку ✓
          </p>
        </div>
      )}
    </div>
  );
} 
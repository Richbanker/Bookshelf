import { useBookStore } from '../store/useBookStore';
import BookCard from '../components/BookCard';

export default function WantToReadPage() {
  const { getWantToReadBooks } = useBookStore();
  const wantToReadBooks = getWantToReadBooks();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Хочу прочитать
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Список книг, которые вы планируете прочитать в будущем.
        </p>
      </div>
      
      {wantToReadBooks.length > 0 ? (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              {wantToReadBooks.length} {wantToReadBooks.length === 1 ? 'книга' : 
                wantToReadBooks.length < 5 ? 'книги' : 'книг'} в списке желаний
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {wantToReadBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">Список желаний пуст</p>
          <p className="text-gray-400">
            Найдите интересные книги на главной странице и добавьте их в список желаний
          </p>
        </div>
      )}
    </div>
  );
} 
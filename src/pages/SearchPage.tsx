import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { useBookStore } from '../store/useBookStore';
import { searchBooks } from '../api/googleBooks';
import BookCard from '../components/BookCard';
import type { Book } from '../store/useBookStore';

export default function SearchPage() {
  const {
    searchQuery,
    searchResults,
    isLoading,
    currentPage,
    totalItems,
    setSearchQuery,
    setSearchResults,
    setIsLoading,
    setCurrentPage,
    setTotalItems,
  } = useBookStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [failedSearch, setFailedSearch] = useState<{ query: string; page: number } | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const initialQuery = useRef(searchQuery);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestRequest = useRef(0);

  const performSearch = useCallback(async (query: string, page: number) => {
    const requestId = ++latestRequest.current;
    setFailedSearch(null);
    setIsLoading(true);
    if (query !== useBookStore.getState().searchQuery) {
      setSearchResults([]);
      setTotalItems(0);
    }
    setSearchQuery(query);
    setCurrentPage(page);

    try {
      const result = await searchBooks(query, page, 20);
      if (requestId !== latestRequest.current) return;

      setSearchResults(result.books);
      setTotalItems(result.totalItems);
    } catch (error) {
      if (requestId !== latestRequest.current) return;

      console.error('Search error:', error);
      setSearchResults([]);
      setTotalItems(0);
      setFailedSearch({ query, page });
    } finally {
      if (requestId === latestRequest.current) {
        setIsLoading(false);
      }
    }
  }, [setIsLoading, setSearchQuery, setCurrentPage, setSearchResults, setTotalItems]);

  const invalidateSearch = useCallback(() => {
    latestRequest.current++;
    setIsLoading(false);
  }, [setIsLoading]);

  useEffect(() => {
    if (initialQuery.current.trim()) {
      void performSearch(initialQuery.current, 1);
    }

    return () => {
      clearTimeout(debounceTimer.current);
      invalidateSearch();
    };
  }, [invalidateSearch, performSearch]);

  const handleQueryChange = (query: string) => {
    setLocalQuery(query);
    clearTimeout(debounceTimer.current);

    if (!query.trim()) {
      invalidateSearch();
      setFailedSearch(null);
      setSearchQuery('');
      setCurrentPage(1);
      setSearchResults([]);
      setTotalItems(0);
      return;
    }

    if (query === searchQuery) return;

    debounceTimer.current = setTimeout(() => {
      void performSearch(query, 1);
    }, 500);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceTimer.current);

    if (localQuery.trim()) {
      void performSearch(localQuery, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (searchQuery.trim()) {
      void performSearch(searchQuery, newPage);
    }
  };

  const totalPages = Math.ceil(totalItems / 20);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles aria-hidden="true" size={24} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Поиск книг
          </h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
          Найдите интересующие вас книги с помощью Google Books и резервного каталога Open Library.
          Ищите по названию, автору или ключевым словам.
        </p>
      </div>
      
      {/* Форма поиска */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/50 p-8 mb-12">
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search aria-hidden="true" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                ref={searchInput}
                aria-label="Поиск книг по названию, автору или ключевым словам"
                value={localQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Введите название книги, автора или ключевые слова..."
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading && localQuery === searchQuery && currentPage === 1}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 aria-hidden="true" size={20} className="animate-spin text-white" />
                  <span className="text-white">Поиск...</span>
                </>
              ) : (
                <>
                  <Search size={20} aria-hidden="true" className="text-white" />
                  <span className="text-white">Поиск</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Результаты поиска */}
      {isLoading && searchResults.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 aria-hidden="true" size={32} className="animate-spin text-white" />
          </div>
          <p role="status" className="text-slate-600 text-lg font-medium">Поиск книг...</p>
        </div>
      ) : failedSearch ? (
        <div className="text-center py-16">
          <div role="alert">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Не удалось выполнить поиск</h2>
            <p className="text-slate-600 max-w-md mx-auto">
              Попробуйте выполнить поиск ещё раз.
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              if (event.detail === 0) {
                searchInput.current?.focus({ preventScroll: true });
              }
              void performSearch(failedSearch.query, failedSearch.page);
            }}
            disabled={localQuery !== failedSearch.query}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            Повторить поиск
          </button>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          {/* Статистика */}
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/50 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen aria-hidden="true" size={20} className="text-blue-500" />
                <h2 className="text-xl font-semibold text-slate-800">Результаты поиска</h2>
              </div>
              <p className="text-slate-600">
                Найдено <span className="font-semibold text-blue-600">{totalItems.toLocaleString('ru-RU')}</span> книг
                {searchQuery && (
                  <span> по запросу <span className="font-semibold text-slate-800">"{searchQuery}"</span></span>
                )}
              </p>
            </div>
          </div>
          
          {/* Сетка книг */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-12">
            {searchResults.map((book: Book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          
          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={isLoading || currentPage === 1}
                className="px-6 py-3 border-2 border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium"
              >
                ← Назад
              </button>
              
              <div className="bg-white/80 backdrop-blur-md rounded-xl px-6 py-3 border border-slate-200/50 shadow-lg">
                <span className="text-slate-700 font-semibold">
                  Страница {currentPage} из {totalPages}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={isLoading || currentPage === totalPages}
                className="px-6 py-3 border-2 border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium"
              >
                Вперед →
              </button>
            </div>
          )}
        </>
      ) : searchQuery ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BookOpen aria-hidden="true" size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Книги не найдены</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Попробуйте изменить поисковый запрос или использовать другие ключевые слова
          </p>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Search aria-hidden="true" size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Начните поиск</h3>
          <p className="text-slate-600">
            Введите поисковый запрос выше, чтобы найти интересные книги
          </p>
        </div>
      )}
    </div>
  );
}

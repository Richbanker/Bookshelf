import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mergeLibraryBooks, parseLibraryTransfer } from '../utils/libraryTransfer';

export interface Book {
  id: string;
  title: string;
  authors?: string[];
  description?: string;
  imageUrl?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  previewLink?: string;
  infoLink?: string;
}

export interface BookWithStatus extends Book {
  status: 'favorite' | 'read' | 'want-to-read' | null;
  addedAt: string;
}

interface BookStore {
  // Состояние
  books: BookWithStatus[];
  searchQuery: string;
  searchResults: Book[];
  isLoading: boolean;
  currentPage: number;
  totalItems: number;
  filterStatus: 'all' | 'favorite' | 'read' | 'want-to-read';
  
  // Действия
  setSearchQuery: (query: string) => void;
  setSearchResults: (books: Book[]) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentPage: (page: number) => void;
  setTotalItems: (total: number) => void;
  setFilterStatus: (status: 'all' | 'favorite' | 'read' | 'want-to-read') => void;
  
  importLibrary: (contents: string) => ImportSummary;

  // Управление книгами
  addToFavorites: (book: Book) => void;
  removeFromFavorites: (bookId: string) => void;
  markAsRead: (book: Book) => void;
  removeFromRead: (bookId: string) => void;
  addToWantToRead: (book: Book) => void;
  removeFromWantToRead: (bookId: string) => void;
  
  // Геттеры
  getFavoriteBooks: () => BookWithStatus[];
  getReadBooks: () => BookWithStatus[];
  getWantToReadBooks: () => BookWithStatus[];
  getFilteredBooks: () => BookWithStatus[];
  isBookFavorite: (bookId: string) => boolean;
  isBookRead: (bookId: string) => boolean;
  isBookWantToRead: (bookId: string) => boolean;
}

interface ImportSummary {
  added: number;
  matched: number;
  enriched: number;
}

type PersistedLibrary = Pick<BookStore, 'books'>;
const storageName = 'bookshelf-storage';
const storageVersion = 0;
const libraryStorage = createJSONStorage<PersistedLibrary>(() => localStorage);

function saveImportedLibrary(currentBooks: BookWithStatus[], nextBooks: BookWithStatus[]) {
  try {
    if (!libraryStorage) throw new Error('Local storage unavailable');
    const stored = libraryStorage.getItem(storageName);
    if (stored instanceof Promise) throw new Error('Expected synchronous local storage');

    if (stored?.version !== undefined && stored.version !== storageVersion) return false;

    const storedBooks = stored?.state?.books ?? [];
    if (JSON.stringify(storedBooks) !== JSON.stringify(currentBooks)) return false;

    libraryStorage.setItem(storageName, { state: { books: nextBooks }, version: storageVersion });
    return true;
  } catch {
    throw new Error('Не удалось сохранить библиотеку в браузере. Освободите место или проверьте настройки хранилища.');
  }
}

export const useBookStore = create<BookStore>()<[['zustand/persist', PersistedLibrary]]>(
  (publish, getState, store) => persist<BookStore, [], [], PersistedLibrary>(
    (set, get) => ({
      // Начальное состояние
      books: [],
      searchQuery: '',
      searchResults: [],
      isLoading: false,
      currentPage: 1,
      totalItems: 0,
      filterStatus: 'all',
      
      // Действия
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (books) => set({ searchResults: books }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalItems: (total) => set({ totalItems: total }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      
      importLibrary: (contents) => {
        const imported = parseLibraryTransfer(contents);
        const currentBooks = get().books;
        const { books, added, matched, enriched } = mergeLibraryBooks(currentBooks, imported);

        if (added > 0 || enriched > 0) {
          if (!saveImportedLibrary(currentBooks, books)) {
            throw new Error('Библиотека изменилась в другой вкладке. Обновите страницу и повторите импорт.');
          }
          // Zustand persist writes after publishing; imports must persist first.
          publish({ books });
        }

        return { added, matched, enriched };
      },

      // Управление книгами
      addToFavorites: (book) => {
        const { books } = get();
        const existingBook = books.find(b => b.id === book.id);
        
        if (existingBook) {
          // Обновляем статус существующей книги
          const updatedBooks = books.map(b => 
            b.id === book.id 
              ? { ...b, status: 'favorite' as const, addedAt: new Date().toISOString() }
              : b
          );
          set({ books: updatedBooks });
        } else {
          // Добавляем новую книгу
          const newBook: BookWithStatus = {
            ...book,
            status: 'favorite',
            addedAt: new Date().toISOString()
          };
          set({ books: [...books, newBook] });
        }
      },
      
      removeFromFavorites: (bookId) => {
        const { books } = get();
        const updatedBooks = books.map(book => 
          book.id === bookId 
            ? { ...book, status: book.status === 'favorite' ? null : book.status }
            : book
        );
        set({ books: updatedBooks });
      },
      
      markAsRead: (book) => {
        const { books } = get();
        const existingBook = books.find(b => b.id === book.id);
        
        if (existingBook) {
          const updatedBooks = books.map(b => 
            b.id === book.id 
              ? { ...b, status: 'read' as const, addedAt: new Date().toISOString() }
              : b
          );
          set({ books: updatedBooks });
        } else {
          const newBook: BookWithStatus = {
            ...book,
            status: 'read',
            addedAt: new Date().toISOString()
          };
          set({ books: [...books, newBook] });
        }
      },
      
      removeFromRead: (bookId) => {
        const { books } = get();
        const updatedBooks = books.map(book => 
          book.id === bookId 
            ? { ...book, status: book.status === 'read' ? null : book.status }
            : book
        );
        set({ books: updatedBooks });
      },
      
      addToWantToRead: (book) => {
        const { books } = get();
        const existingBook = books.find(b => b.id === book.id);
        
        if (existingBook) {
          const updatedBooks = books.map(b => 
            b.id === book.id 
              ? { ...b, status: 'want-to-read' as const, addedAt: new Date().toISOString() }
              : b
          );
          set({ books: updatedBooks });
        } else {
          const newBook: BookWithStatus = {
            ...book,
            status: 'want-to-read',
            addedAt: new Date().toISOString()
          };
          set({ books: [...books, newBook] });
        }
      },
      
      removeFromWantToRead: (bookId) => {
        const { books } = get();
        const updatedBooks = books.map(book => 
          book.id === bookId 
            ? { ...book, status: book.status === 'want-to-read' ? null : book.status }
            : book
        );
        set({ books: updatedBooks });
      },
      
      // Геттеры
      getFavoriteBooks: () => {
        const { books } = get();
        return books.filter(book => book.status === 'favorite');
      },
      
      getReadBooks: () => {
        const { books } = get();
        return books.filter(book => book.status === 'read');
      },
      
      getWantToReadBooks: () => {
        const { books } = get();
        return books.filter(book => book.status === 'want-to-read');
      },
      
      getFilteredBooks: () => {
        const { books, filterStatus } = get();
        if (filterStatus === 'all') return books;
        return books.filter(book => book.status === filterStatus);
      },
      
      isBookFavorite: (bookId) => {
        const { books } = get();
        return books.some(book => book.id === bookId && book.status === 'favorite');
      },
      
      isBookRead: (bookId) => {
        const { books } = get();
        return books.some(book => book.id === bookId && book.status === 'read');
      },
      
      isBookWantToRead: (bookId) => {
        const { books } = get();
        return books.some(book => book.id === bookId && book.status === 'want-to-read');
      },
    }),
    {
      name: storageName,
      version: storageVersion,
      storage: libraryStorage,
      partialize: (state) => ({ books: state.books }),
    }
  )(publish, getState, store)
); 
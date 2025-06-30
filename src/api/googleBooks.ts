import type { Book } from '../store/useBookStore';

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1';

interface GoogleBooksResponse {
  items?: GoogleBookItem[];
  totalItems: number;
}

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publishedDate?: string;
    publisher?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    previewLink?: string;
    infoLink?: string;
  };
}

export async function searchBooks(query: string, page: number = 1, maxResults: number = 20): Promise<{ books: Book[], totalItems: number }> {
  if (!query.trim()) {
    return { books: [], totalItems: 0 };
  }

  try {
    const startIndex = (page - 1) * maxResults;
    const encodedQuery = encodeURIComponent(query);
    const url = `${GOOGLE_BOOKS_API_BASE}/volumes?q=${encodedQuery}&startIndex=${startIndex}&maxResults=${maxResults}&orderBy=relevance`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();
    
    const books: Book[] = (data.items || []).map(item => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors,
      description: item.volumeInfo.description,
      imageUrl: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail,
      publishedDate: item.volumeInfo.publishedDate,
      publisher: item.volumeInfo.publisher,
      pageCount: item.volumeInfo.pageCount,
      categories: item.volumeInfo.categories,
      averageRating: item.volumeInfo.averageRating,
      ratingsCount: item.volumeInfo.ratingsCount,
      previewLink: item.volumeInfo.previewLink,
      infoLink: item.volumeInfo.infoLink,
    }));

    return {
      books,
      totalItems: data.totalItems
    };
  } catch (error) {
    console.error('Error searching books:', error);
    throw new Error('Failed to search books');
  }
}

export async function getBookDetails(bookId: string): Promise<Book> {
  try {
    const url = `${GOOGLE_BOOKS_API_BASE}/volumes/${bookId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const item: GoogleBookItem = await response.json();
    
    return {
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors,
      description: item.volumeInfo.description,
      imageUrl: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail,
      publishedDate: item.volumeInfo.publishedDate,
      publisher: item.volumeInfo.publisher,
      pageCount: item.volumeInfo.pageCount,
      categories: item.volumeInfo.categories,
      averageRating: item.volumeInfo.averageRating,
      ratingsCount: item.volumeInfo.ratingsCount,
      previewLink: item.volumeInfo.previewLink,
      infoLink: item.volumeInfo.infoLink,
    };
  } catch (error) {
    console.error('Error getting book details:', error);
    throw new Error('Failed to get book details');
  }
} 
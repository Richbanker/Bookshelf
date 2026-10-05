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

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    
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
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&page=${page}&limit=${maxResults}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Failed to search books');
    const data = await response.json();
    return { books: data.docs.map((item: { key: string; title: string; author_name?: string[]; cover_i?: number; first_publish_year?: number }) => ({
      id: `openlibrary:${item.key.split('/').pop()}`,
      title: item.title,
      authors: item.author_name,
      imageUrl: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : undefined,
      publishedDate: item.first_publish_year?.toString(),
      infoLink: `https://openlibrary.org${item.key}`,
    })), totalItems: data.numFound };
  }
}

export async function getBookDetails(bookId: string): Promise<Book> {
  if (bookId.startsWith('openlibrary:')) {
    const workId = bookId.slice('openlibrary:'.length);
    if (!/^OL\d+W$/.test(workId)) throw new Error('Invalid book ID');
    const response = await fetch(`https://openlibrary.org/works/${workId}.json`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Failed to get book details');
    const work = await response.json();
    return { id: bookId, title: work.title, description: typeof work.description === 'string' ? work.description : work.description?.value,
      imageUrl: work.covers?.[0] ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : undefined,
      infoLink: `https://openlibrary.org/works/${workId}` };
  }
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

// Базовые типы для проекта
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

export interface SearchFilters {
  query: string;
  maxResults: number;
  orderBy: string;
  category?: string;
}

export interface GoogleBooksResponse {
  items?: GoogleBooksItem[];
  totalItems: number;
}

export interface GoogleBooksItem {
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
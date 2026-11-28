import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import WantToReadPage from './pages/WantToReadPage';
import ReadPage from './pages/ReadPage';
import BookPage from './pages/BookPage';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/want-to-read" element={<WantToReadPage />} />
          <Route path="/read" element={<ReadPage />} />
          <Route path="/book/:id" element={<BookPage />} />
          <Route
            path="*"
            element={
              <div className="py-16 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Страница не найдена</h1>
                <Link to="/" className="text-blue-600 underline">Перейти к поиску книг</Link>
              </div>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

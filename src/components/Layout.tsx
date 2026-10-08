import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, BookOpen, Bookmark } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Поиск', icon: Search },
    { path: '/favorites', label: 'Избранное', icon: Heart },
    { path: '/want-to-read', label: 'Хочу прочитать', icon: Bookmark },
    { path: '/read', label: 'Прочитано', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <BookOpen size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300">
                Bookshelf
              </span>
            </Link>
          </div>

          {/* Навигация */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : ''} />
                  <span className={isActive ? 'text-white' : ''}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Мобильное меню (заглушка) */}
          <div className="md:hidden">
            <button type="button" disabled aria-label="Мобильное меню недоступно" className="p-2 rounded-lg text-slate-400 cursor-not-allowed">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Bookshelf
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Создано =Richbanker= c помощью  React + TypeScript + Tailwind CSS
          </p>
          <p className="text-slate-400 text-xs mt-2">
            © 2025 Bookshelf. Все права защищены =Richbanker=
          </p>
        </div>
      </div>
    </footer>
  );
} 
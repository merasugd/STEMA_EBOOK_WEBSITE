import { useEffect, useState, useMemo } from 'react';
import BookCard from '../components/BookCard';
import type { Book } from '../types';
import { safeJsonParse } from '../utils/safeJsonParse';

export default function BookIndex() {
  const [books, setBooks] = useState<Record<string, Book>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadBooks() {
      try {
        const indexRes = await fetch('/db.json');
        if (!indexRes.ok) throw new Error('Failed to load index');

        const files: string[] = await indexRes.json();
        const bookData: Record<string, Book> = {};

        for (const file of files) {
          const res = await fetch(`/books/${file}`);
          if (!res.ok) continue;

          const text = await res.text();
          if (!text.trim()) continue;

          try {
            const book: Book = safeJsonParse(text) || {
              title: "Unknown Title",
              author: "Unknown Author",
              description: "",
              coverImage: "/images/placeholder-book.svg",
              availability: "unknown"
            };
            const id = file.replace('.json', '');
            bookData[id] = book;
          } catch (e) {
            console.error(`Parse error in ${file}`);
          }
        }

        setBooks(bookData);
      } catch (err) {
        console.error('Load books error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  // Filter books based on search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;

    const query = searchQuery.toLowerCase();
    return Object.fromEntries(
      Object.entries(books).filter(([_, book]) => {
        return (
          book.title?.toLowerCase().includes(query) ||
          book.author?.toLowerCase().includes(query) ||
          book.description?.toLowerCase().includes(query)
        );
      })
    );
  }, [books, searchQuery]);

  const displayedBooks = searchQuery ? filteredBooks : books;
  const hasResults = Object.keys(displayedBooks).length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-amber-100 text-2xl font-light tracking-wider">
            Opening the Book Index...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* "Back to Home" */}
      <button
        onClick={() => window.location.href = '/'}
        className="fixed top-8 left-8 z-50 inline-flex items-center gap-3 text-amber-300 hover:text-amber-100 transition text-lg tracking-wider uppercase focus:outline-none"
        aria-label="Back to Home"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </button>

      {/* Full-screen Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(/images/bg1.jpg)', filter: 'sepia(0.5) brightness(0.7)' }}
        />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-6xl md:text-8xl font-bold text-amber-100 tracking-tight mb-4">
            The Book Index
          </h1>
          <p className="text-xl md:text-2xl text-amber-200 font-light tracking-widest">
            Selected Works • Literacy Books
          </p>
          <div className="mt-10 flex items-center justify-center gap-8">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500"></div>
            <span className="text-amber-400 uppercase text-sm tracking-widest">Est. 2025</span>
            <div className="w-24 h-px bg-gradient-to-l from-transparent via-amber-500"></div>
          </div>
        </div>
      </section>

      {/* Books Collection with Search */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-serif text-amber-100 mb-4">Our Collection</h2>
            <p className="text-amber-300 text-lg max-w-2xl mx-auto">
              Selected works contributed by the STEM-A class.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or description..."
                className="w-full px-6 py-5 pl-14 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-100 placeholder-amber-500/60 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-900/30 transition-all duration-300 backdrop-blur-md"
              />
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-300 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Info */}
            {searchQuery && (
              <p className="text-amber-400 text-sm mt-4 text-center">
                Found <span className="font-bold text-amber-200">{Object.keys(displayedBooks).length}</span> result{Object.keys(displayedBooks).length !== 1 ? 's' : ''} for "<span className="italic">{searchQuery}</span>"
              </p>
            )}
          </div>

          {/* Books Grid */}
          {!hasResults ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-8 opacity-30">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full text-amber-700">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-amber-400 text-2xl">
                {searchQuery 
                  ? `No books found matching "${searchQuery}"`
                   
                  : "The library is currently being restocked..."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center">
              {Object.entries(displayedBooks).map(([id, book]) => (
                <div
                  key={id}
                  className="w-full max-w-xs transform transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl"
                >
                  <div className="bg-gradient-to-b from-amber-950/60 to-amber-900/30 backdrop-blur-md border border-amber-800/40 rounded-xl overflow-hidden shadow-xl hover:shadow-amber-900/30">
                    <BookCard book={book} id={id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-amber-900/30 bg-black/50">
        <div className="max-w-7xl mx-auto text-center px-6">
          <p className="text-amber-200 tracking-wider">The Book Index © {new Date().getFullYear()}</p>
          <p className="text-amber-400/70 text-sm mt-2">Read, Reflect, Repeat.</p>
        </div>
      </footer>
    </>
  );
}

import { useEffect, useState } from 'react';
import BookCard from '../components/BookCard';
import type { Book } from '../types';
import { safeJsonParse } from '../utils/safeJsonParse';

export default function BookIndex() {
  const [books, setBooks] = useState<Record<string, Book>>({});
  const [loading, setLoading] = useState(true);

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

      {/* Books Collection – Fixed Width, No Overflow */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-serif text-amber-100 mb-4">Our Collection</h2>
            <p className="text-amber-300 text-lg max-w-2xl mx-auto">
              Selected works contributed by the STEM-A class.
            </p>
          </div>

          {Object.keys(books).length === 0 ? (
            <p className="text-center text-amber-400 text-2xl py-20">The library is currently being restocked...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center">
              {Object.entries(books).map(([id, book]) => (
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
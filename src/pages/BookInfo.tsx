import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Book } from '../types';
import { safeJsonParse } from '../utils/safeJsonParse';

export default function BookInfo() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBook() {
      if (!id) return;
      try {
        const res = await fetch(`/books/${id}.json`);
        if (!res.ok) throw new Error('Book not found');
        const text = await res.text();
        if (!text.trim()) throw new Error('Empty file');
        const data = safeJsonParse(text) as Book;
        setBook(data || null);
      } catch (err) {
        console.error(err);
        setBook(null);
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-100 text-2xl font-light">Opening the volume...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-3xl">This tome appears to be missing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-amber-100">
      
      
      <div 
        className="fixed inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/bg2.jpg)' }}
      />

      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Link
            to="/books"
            className="inline-flex items-center gap-3 text-amber-300 hover:text-amber-100 transition mb-12 text-lg tracking-wider uppercase"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to the Book Index
          </Link>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="flex justify-center md:justify-end">
              <div className="relative group">
                <div className="absolute -inset-4 bg-amber-600/20 rounded-2xl blur-xl group-hover:bg-amber-500/30 transition"></div>
                <img
                  src={book.coverImage || '/images/placeholder-book.svg'}
                  alt={book.title}
                  onError={(e) => (e.currentTarget.src = '/images/placeholder-book.svg')}
                  className="relative z-10 w-96 max-w-full shadow-2xl rounded-xl border-8 border-amber-900/60"
                />
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-amber-700/40"></div>
              </div>
            </div>

            <div className="py-8">
              <h1 className="text-5xl md:text-6xl font-bold text-amber-100 mb-6 leading-tight">
                {book.title || 'Untitled'}
              </h1>

              {book.author && (
                <p className="text-2xl text-amber-300 mb-10 italic">
                  by {book.author}
                </p>
              )}

              <div className="space-y-6 text-lg">
                {book.genre && (
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 w-32">Genre</span>
                    <span className="text-amber-200">{book.genre}</span>
                  </div>
                )}

                {book.publicationYear && (
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 w-32">Published</span>
                    <span className="text-amber-200">{book.publicationYear}</span>
                  </div>
                )}

                {book.ageLevel && (
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 w-32">Age</span>
                    <span className="text-amber-200">{book.ageLevel}</span>
                  </div>
                )}

                {book.sharedBy && (
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 w-32">Shared By</span>
                    <span className="text-amber-200">{book.sharedBy}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <span className="text-amber-400 w-32">Status</span>
                  <span className={`px-5 py-2 rounded-full text-sm uppercase tracking-wider ${
                    book.availability === 'available'
                      ? 'bg-emerald-900/60 text-emerald-300'
                      : book.availability === 'borrowed'
                      ? 'bg-rose-900/60 text-rose-300'
                      : 'bg-amber-900/60 text-amber-300'
                  }`}>
                    {book.availability || 'Unknown'}
                  </span>
                </div>
              </div>

              {book.description && (
                <div className="mt-12 pt-12 border-t border-amber-800/40">
                  <h2 className="text-2xl font-serif text-amber-200 mb-6">About this work</h2>
                  <p className="text-amber-100 text-lg leading-relaxed whitespace-pre-line">
                    {book.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-32 py-12 border-t border-amber-900/30 text-center">
          <p className="text-amber-300 tracking-wider">
            The Book Index - Read, Reflect, Repeat.
          </p>
        </footer>
      </div>
    </div>
  );
}
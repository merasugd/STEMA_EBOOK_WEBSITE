// BookInfo.tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Book } from '../types';
import { safeJsonParse } from '../utils/safeJsonParse';

interface CoverImageProps {
  bookId: string;
  customUrl?: string;
  title: string;
  className?: string;
}

function CoverImage({ bookId, customUrl, title, className = "w-full h-80 object-cover" }: CoverImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(customUrl || `/images/books/${bookId}.jpg`);

  return (
    <img
      src={imgSrc}
      alt={title}
      className={className}
      onError={() => {
        if (customUrl && imgSrc === customUrl) {
          setImgSrc(`/images/books/${bookId}.jpg`);
        } else {
          setImgSrc("/images/placeholder-book.svg");
        }
      }}
    />
  );
}

export default function BookInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  // Preserve previous index state when going back
  const previousIndexState = location.state as { fromIndex?: boolean } | null;
  const cameFromIndex = previousIndexState?.fromIndex;

  useEffect(() => {
    window.scrollTo(0, 0);

    async function loadBook() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/books/${id}.json`);
        if (!res.ok) throw new Error('Book not found');
        const text = await res.text();
        if (!text.trim()) throw new Error('Empty file');

        const data = safeJsonParse(text) as Book;
        setBook(data || null);
      } catch (err) {
        console.error('Failed to load book:', err);
        setBook(null);
      } finally {
        setLoading(false);
        setAnimate(true);
      }
    }

    loadBook();
  }, [id]);

  const handleBack = () => {
    if (cameFromIndex) {
      // Go back in history (preserves all query params: search, sort, page, etc.)
      navigate(-1);
    } else {
      // Fallback: go to index with clean state
      navigate('/bookindex');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center overflow-x-hidden">
        <div className="text-amber-100 text-2xl font-light tracking-wider">Opening the volume...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center overflow-x-hidden">
        <div className="text-amber-400 text-3xl font-light">This tome appears to be missing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-amber-100 overflow-x-hidden relative">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none"
        style={{ backgroundImage: 'url(/images/bg2.jpg)', backgroundAttachment: 'fixed' }}
      />

      <div
        className={`relative z-10 transition-all duration-1000 ease-out ${
          animate ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-20">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-3 text-amber-300 hover:text-amber-100 transition mb-12 text-lg tracking-wider uppercase group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to the Book Index
          </button>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="flex justify-center md:justify-end">
              <div className="relative group max-w-full">
                <div className="absolute -inset-4 bg-amber-600/20 rounded-2xl blur-xl group-hover:bg-amber-500/30 transition duration-700"></div>
                <CoverImage
                  bookId={id || 'none'}
                  title={book.title}
                  customUrl={book.coverImage}
                  className="relative z-10 w-full max-w-sm md:max-w-md shadow-2xl rounded-xl border-8 border-amber-900/60"
                />
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-amber-700/40"></div>
              </div>
            </div>

            <div className="py-8 space-y-10">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-100 mb-6 leading-tight">
                  {book.title || 'Untitled'}
                </h1>

                {book.author && (
                  <p className="text-xl md:text-2xl text-amber-300 italic opacity-90">
                    by {book.author}
                  </p>
                )}
              </div>

              <div className="space-y-6 text-base md:text-lg">
                {book.genre && (
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 w-32 font-medium">Genre</span>
                    <span className="text-amber-200">{book.genre}</span>
                  </div>
                )}

                {book.publicationYear && (
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 w-32 font-medium">Published</span>
                    <span className="text-amber-200">{book.publicationYear}</span>
                  </div>
                )}

                {book.ageLevel && (
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 w-32 font-medium">Age</span>
                    <span className="text-amber-200">{book.ageLevel}</span>
                  </div>
                )}

                {book.sharedBy && (
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 w-32 font-medium">Shared By</span>
                    <span className="text-amber-200">{book.sharedBy}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-6">
                  <span className="text-amber-400 w-32 font-medium">Status</span>
                  <span className={`px-6 py-2 rounded-full text-sm uppercase tracking-wider font-medium ${
                    book.availability === 'available'
                      ? 'bg-emerald-900/70 text-emerald-300'
                      : book.availability === 'borrowed'
                      ? 'bg-rose-900/70 text-rose-300'
                      : 'bg-amber-900/70 text-amber-300'
                  }`}>
                    {book.availability || 'Unknown'}
                  </span>
                </div>
              </div>

              {book.description && (
                <div className="mt-12 pt-12 border-t border-amber-800/40">
                  <h2 className="text-2xl md:text-3xl font-serif text-amber-200 mb-8">About this work</h2>
                  <p className="text-amber-100 text-lg leading-relaxed whitespace-pre-line max-w-2xl">
                    {book.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-32 py-12 border-t border-amber-900/30 text-center bg-black/30">
          <p className="text-amber-300 tracking-wider text-lg">
            The Book Index • Read, Reflect, Repeat.
          </p>
          <p className="text-amber-400/70 text-sm mt-2">Est. 2025</p>
        </footer>
      </div>
    </div>
  );
}
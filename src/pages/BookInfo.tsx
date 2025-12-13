import { Link, useParams } from 'react-router-dom';
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
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

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
        setAnimate(true);
      }
    }
    loadBook();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center overflow-x-hidden">
        <div className="text-amber-100 text-2xl font-light">Opening the volume...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-black text-amber-100 overflow-x-hidden relative flex flex-col items-center justify-center">
        <div
          className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: 'url(/images/bg2.jpg)', backgroundAttachment: 'fixed' }}
        />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-9xl md:text-[12rem] font-bold text-amber-900/40 tracking-tight leading-none">
            404
          </h1>

          <p className="text-4xl md:text-5xl font-light text-amber-300 mt-8 mb-6">
            This tome appears to be missing...
          </p>

          <p className="text-2xl md:text-3xl italic text-amber-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            “The book you seek has wandered off the shelves,<br />
            perhaps borrowed by another curious soul.”
          </p>

          <Link
            to="/bookindex"
            className="inline-flex items-center gap-3 text-amber-300 hover:text-amber-100 transition text-xl tracking-wider uppercase"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Return to the Book Index
          </Link>

          <div className="mt-20 flex flex-col items-center">
            <img
              src="/images/qrcode.png"
              alt="QR code to Book Index"
              className="w-48 h-48 md:w-56 md:h-56 shadow-lg rounded-lg border-4 border-amber-900/30"
            />
            <a
              href="https://stemabookindex.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-lg font-medium text-amber-300 hover:underline"
            >
              https://stemabookindex.vercel.app
            </a>
          </div>

          <footer className="mt-24 text-amber-400/80 text-center text-sm uppercase tracking-widest">
            <p>The Book Index — Read, Reflect, Repeat.</p>
          </footer>
        </div>
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
        className={`relative z-10 transition-transform duration-700 ease-out opacity-0 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Link
            to="/bookindex"
            className="inline-flex items-center gap-3 text-amber-300 hover:text-amber-100 transition mb-12 text-lg tracking-wider uppercase"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to the Book Index
          </Link>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="flex justify-center md:justify-end">
              <div className="relative group max-w-full">
                <div className="absolute -inset-4 bg-amber-600/20 rounded-2xl blur-xl group-hover:bg-amber-500/30 transition"></div>
                <CoverImage
                  bookId={id || 'none'}
                  title={book.title}
                  customUrl={book.coverImage}
                  className="relative z-10 w-full max-w-sm md:max-w-md shadow-2xl rounded-xl border-8 border-amber-900/60"
                />
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-amber-700/40"></div>
              </div>
            </div>

            <div className="py-8">
              <h1 className="text-4xl md:text-5xl font-bold text-amber-100 mb-6 leading-tight">
                {book.title || 'Untitled'}
              </h1>

              {book.author && (
                <p className="text-xl md:text-2xl text-amber-300 mb-10 italic">
                  by {book.author}
                </p>
              )}

              <div className="space-y-6 text-base md:text-lg">
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

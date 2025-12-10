import { Link } from 'react-router-dom';
import type { Book } from '../types';
import { useState } from 'react';

interface Props {
  book: Book;
  id: string;
}

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

export default function BookCard({ book, id }: Props) {
  return (
    <Link to={`/book/${id}`} className="block group">
      <div className="aspect-[3/4.5] relative h-full flex flex-col">
        <CoverImage
          bookId={id}
          customUrl={book.coverImage}
          title={book.title}
          className="w-full h-80 object-cover rounded-t-xl"
        />
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-serif text-amber-100 line-clamp-2">{book.title || "Untitled"}</h3>
            <p className="text-amber-300 text-sm mt-2 italic">{book.author || "Anonymous"}</p>
          </div>
          <p className="text-amber-300 text-sm mt-2 italic">Shared By: {book.sharedBy || "Anonymous"}</p>
          <div className="mt-6 flex items-center justify-between">
            <span className={`px-4 py-1 rounded-full text-xs uppercase tracking-wider ${
              book.availability === 'available' ? 'bg-emerald-900/60 text-emerald-300' :
              book.availability === 'borrowed' ? 'bg-rose-900/60 text-rose-300' :
              'bg-amber-900/60 text-amber-300'
            }`}>
              {book.availability || 'Unknown'}
            </span>
            <span className="text-amber-500 text-sm">→ View</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
import { useEffect, useState, useMemo, useRef } from 'react';
import BookCard from '../components/BookCard';
import type { Book } from '../types';
import { safeJsonParse } from '../utils/safeJsonParse';

export default function BookIndex() {
  const [books, setBooks] = useState<Record<string, Book>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'author' | 'sharedBy'>('default');
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [contributorSearch, setContributorSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const pageSize = 8;
  const hasRestoredScroll = useRef(false);

  // Load books
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
              availability: "unknown",
            };
            const id = file.replace('.json', '');
            bookData[id] = book;
          } catch (e) {
            console.error(`Parse error in ${file}:`, e);
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

  // Session storage
  useEffect(() => {
    const saveState = () => {
      sessionStorage.setItem('bookIndexScroll', window.scrollY.toString());
      sessionStorage.setItem('bookIndexPage', currentPage.toString());
      sessionStorage.setItem('bookIndexSearch', searchQuery);
      sessionStorage.setItem('bookIndexSort', sortBy);
      sessionStorage.setItem('bookIndexContributors', JSON.stringify(selectedContributors));
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('[href^="/book/"]')) saveState();
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('beforeunload', saveState);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', saveState);
    };
  }, [currentPage, searchQuery, sortBy, selectedContributors]);

  useEffect(() => {
    if (loading || hasRestoredScroll.current) return;
    const savedPage = sessionStorage.getItem('bookIndexPage');
    const savedSearch = sessionStorage.getItem('bookIndexSearch');
    const savedSort = sessionStorage.getItem('bookIndexSort');
    const savedContribs = sessionStorage.getItem('bookIndexContributors');

    if (savedPage) setCurrentPage(Number(savedPage));
    if (savedSearch) setSearchQuery(savedSearch);
    if (savedSort) setSortBy(savedSort as any);
    if (savedContribs) setSelectedContributors(JSON.parse(savedContribs));

    const scrollPos = sessionStorage.getItem('bookIndexScroll');
    if (scrollPos && Number(scrollPos) > 0) {
      setTimeout(() => {
        window.scrollTo(0, Number(scrollPos));
        hasRestoredScroll.current = true;
      }, 100);
    } else {
      hasRestoredScroll.current = true;
    }
  }, [loading]);

  useEffect(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [currentPage]);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get contributors
  const allContributors = useMemo(() => {
    const contribs = new Set<string>();
    Object.values(books).forEach(book => {
      const name = book.sharedBy?.trim();
      if (name) contribs.add(name);
    });
    return Array.from(contribs).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filteredContributors = useMemo(() => {
    if (!contributorSearch.trim()) return allContributors;
    const q = contributorSearch.toLowerCase();
    return allContributors.filter(name => name.toLowerCase().includes(q));
  }, [allContributors, contributorSearch]);

  // Filtering
  const filteredBooks = useMemo(() => {
    let list = Object.entries(books);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(([, book]) =>
        `${book.title} ${book.author} ${book.description} ${book.sharedBy || ''}`.toLowerCase().includes(q)
      );
    }

    if (sortBy !== 'sharedBy' && selectedContributors.length > 0) {
      list = list.filter(([, book]) => {
        const name = book.sharedBy?.trim();
        return name && selectedContributors.includes(name);
      });
    }

    return Object.fromEntries(list);
  }, [books, searchQuery, selectedContributors, sortBy]);

  // Sorting
  const bookList = useMemo(() => {
    let list = Object.entries(filteredBooks);
    if (sortBy === 'title') list.sort((a, b) => (a[1].title || '').localeCompare(b[1].title || ''));
    else if (sortBy === 'author') list.sort((a, b) => (a[1].author || '').localeCompare(b[1].author || ''));
    else if (sortBy === 'sharedBy') list.sort((a, b) => (a[1].sharedBy || '').localeCompare(b[1].sharedBy || ''));
    return list;
  }, [filteredBooks, sortBy]);

  useEffect(() => setCurrentPage(1), [searchQuery, sortBy, selectedContributors]);

  // Pagination logic
  const {
    displayedList,
    currentContributor,
    totalPages: calculatedTotalPages,
    contributorList
  } = useMemo(() => {
    if (sortBy !== 'sharedBy') {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      return {
        displayedList: bookList.slice(start, end),
        currentContributor: null,
        totalPages: Math.ceil(bookList.length / pageSize),
        contributorList: []
      };
    }

    // Sorting
    const groups = bookList.reduce<Record<string, typeof bookList>>((acc, item) => {
      const key = item[1].sharedBy?.trim() || 'Unknown Contributor';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const sortedContributors = Object.keys(groups)
      .filter(name => groups[name].length > 0)
      .sort((a, b) => a.localeCompare(b));

    const contributorIndex = Math.max(0, Math.min(currentPage - 1, sortedContributors.length - 1));
    const currentName = sortedContributors[contributorIndex];
    const booksByCurrentContributor = groups[currentName] || [];

    return {
      displayedList: booksByCurrentContributor,
      currentContributor: currentName,
      totalPages: sortedContributors.length || 1,
      contributorList: sortedContributors
    };
  }, [bookList, sortBy, currentPage]);

  const totalPages = calculatedTotalPages;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-amber-100 text-2xl font-light tracking-wider">Opening the Book Index...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Back to Home */}
      <button onClick={() => window.location.href = '/'} className="fixed top-8 left-8 z-50 flex items-center gap-3 text-amber-300 hover:text-amber-100 transition text-lg tracking-wider uppercase">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </button>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/images/bg1.jpg)', filter: 'sepia(0.5) brightness(0.7)' }} />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-6xl md:text-8xl font-bold text-amber-100 tracking-tight mb-4">The Book Index</h1>
          <p className="text-xl md:text-2xl text-amber-200 font-light tracking-widest">Selected Works • Literacy Books</p>
          <div className="mt-10 flex items-center justify-center gap-8">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500" />
            <span className="text-amber-400 uppercase text-sm tracking-widest">Est. 2025</span>
            <div className="w-24 h-px bg-gradient-to-l from-transparent via-amber-500" />
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-serif text-amber-100 mb-4">Our Collection</h2>
            <p className="text-amber-300 text-lg max-w-2xl mx-auto">Selected works contributed by the STEM-A class.</p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center gap-0 border border-amber-800/60 rounded-xl overflow-hidden focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-900/30 transition-all bg-amber-950/40 backdrop-blur-md">
              <div className="pl-5 pr-3 py-5 text-amber-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, contributor..."
                className="w-full py-5 pr-12 pl-3 bg-transparent text-amber-100 placeholder-amber-500/60 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-amber-400 text-sm mt-4 text-center">
                Found <span className="font-bold text-amber-200">{bookList.length}</span> result{bookList.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Sort + Contributor Filter Button */}
          <div className="max-w-2xl mx-auto flex gap-4 mb-12">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-6 py-5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-900/30 backdrop-blur-md"
            >
              <option value="default">Sort by Default</option>
              <option value="title">Title (A–Z)</option>
              <option value="author">Author (A–Z)</option>
              <option value="sharedBy">Contributor (A–Z)</option>
            </select>

            {sortBy !== 'sharedBy' && allContributors.length > 0 && (
              <button
                onClick={() => setShowContributorModal(true)}
                className="px-8 py-5 bg-amber-900/50 border border-amber-700/70 rounded-xl text-amber-100 hover:bg-amber-800/60 transition-all flex items-center gap-3 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Filter by Contributor
                {selectedContributors.length > 0 && (
                  <span className="ml-2 px-3 py-1 bg-amber-600/30 rounded-full text-xs">
                    {selectedContributors.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Contributor Modal */}
          {showContributorModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowContributorModal(false)}>
              <div className="w-full max-w-lg mx-4 bg-gradient-to-b from-amber-950/90 to-black border border-amber-800/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-serif text-amber-100">Filter by Contributor</h3>
                    <button onClick={() => setShowContributorModal(false)} className="text-amber-400 hover:text-amber-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={contributorSearch}
                    onChange={(e) => setContributorSearch(e.target.value)}
                    placeholder="Search contributors..."
                    className="w-full mb-6 px-5 py-4 bg-amber-950/50 border border-amber-800/60 rounded-xl text-amber-100 placeholder-amber-500/60 focus:outline-none focus:border-amber-500"
                  />

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {filteredContributors.map(name => (
                      <label key={name} className="flex items-center gap-4 p-4 rounded-lg hover:bg-amber-900/30 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedContributors.includes(name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContributors(prev => [...prev, name]);
                            } else {
                              setSelectedContributors(prev => prev.filter(n => n !== name));
                            }
                          }}
                          className="w-5 h-5 text-amber-500 bg-amber-950/50 border-amber-700 rounded focus:ring-amber-500"
                        />
                        <span className="text-amber-100 text-lg">{name}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => {
                        setSelectedContributors([]);
                        setShowContributorModal(false);
                      }}
                      className="flex-1 py-4 border border-amber-700/70 text-amber-300 hover:bg-amber-900/30 rounded-xl transition"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowContributorModal(false)}
                      className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-black font-medium rounded-xl transition"
                    >
                      Apply ({selectedContributors.length} selected)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Listing */}
          {sortBy === 'sharedBy' && currentContributor && (
            <div className="text-center mb-12">
              <h3 className="text-4xl font-serif text-amber-200">
                Books shared by: <span className="text-amber-400 font-bold">{currentContributor}</span>
              </h3>
              <p className="text-amber-400 text-lg mt-4">
                Contributor {currentPage} of {totalPages}
              </p>
            </div>
          )}

          {bookList.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-amber-400 text-2xl">No books found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center">
                {displayedList.map(([id, book]) => (
                  <div key={id} className="w-full max-w-xs transform transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl">
                    <div className="bg-gradient-to-b from-amber-950/60 to-amber-900/30 backdrop-blur-md border border-amber-800/40 rounded-xl overflow-hidden shadow-xl hover:shadow-amber-900/30">
                      <BookCard book={book} id={id} />
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-16">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-8 py-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-100 disabled:opacity-50 hover:bg-amber-900/30 transition"
                  >
                    {sortBy === 'sharedBy' ? '← Previous Contributor' : '← Previous'}
                  </button>

                  <span className="text-amber-300 text-lg min-w-[200px] text-center">
                    Page {currentPage} of {totalPages}
                    {sortBy === 'sharedBy' && contributorList.length > 0 && (
                      <span className="block text-sm text-amber-400 mt-1">
                        ({contributorList[currentPage - 1]})
                      </span>
                    )}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-8 py-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-100 disabled:opacity-50 hover:bg-amber-900/30 transition"
                  >
                    {sortBy === 'sharedBy' ? 'Next Contributor →' : 'Next →'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer & Scroll Top */}
      <footer className="py-12 border-t border-amber-900/30 bg-black/50">
        <div className="max-w-7xl mx-auto text-center px-6">
          <p className="text-amber-200 tracking-wider">The Book Index © {new Date().getFullYear()}</p>
          <p className="text-amber-400/70 text-sm mt-2">Read, Reflect, Repeat.</p>
        </div>
      </footer>

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-8 right-8 z-50 p-4 bg-amber-500/90 hover:bg-amber-400 rounded-full shadow-2xl transition animate-pulse">
          <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </>
  );
}
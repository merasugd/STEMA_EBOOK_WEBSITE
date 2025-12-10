import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import type { Book } from '../types';
import { safeJsonParse } from '../utils/safeJsonParse';

const PAGE_SIZE = 8;

export default function BookIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [books, setBooks] = useState<Record<string, Book>>({});
  const [loading, setLoading] = useState(true);

  // State from URL
  const searchQuery = searchParams.get('q')?.trim() || '';
  const sortBy = (searchParams.get('sort') as 'default' | 'title' | 'author' | 'sharedBy') || 'default';
  const rawContributors = searchParams.get('contributors');
  const selectedContributors = useMemo(() => {
    if (!rawContributors) return [];
    try {
      return JSON.parse(rawContributors);
    } catch {
      return [];
    }
  }, [rawContributors]);

  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);

  const [showContributorModal, setShowContributorModal] = useState(false);
  const [contributorSearch, setContributorSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const hasInitialized = useRef(false);

  // Load all books
  useEffect(() => {
    let cancelled = false;

    async function loadBooks() {
      try {
        const indexRes = await fetch('db.json');
        if (!indexRes.ok) throw new Error('Failed to load index');
        const files: string[] = await indexRes.json();

        const promises = files.map(async (file) => {
          const res = await fetch(`/books/${file}`);
          if (!res.ok) return null;
          const text = await res.text();
          if (!text.trim()) return null;

          const book: Book = safeJsonParse(text) ?? {
            title: 'Unknown Title',
            author: 'Unknown Author',
            description: '',
            coverImage: '/images/placeholder-book.svg',
            availability: 'unknown',
          };

          const id = file.replace('.json', '');
          return [id, book] as const;
        });

        const results = await Promise.allSettled(promises);
        if (cancelled) return;

        const bookData: Record<string, Book> = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value) {
            const [id, book] = r.value;
            bookData[id] = book;
          }
        });

        setBooks(bookData);
      } catch (err) {
        console.error('Load books error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBooks();
    return () => { cancelled = true; };
  }, []);

  // Sync URL when filters change
  useEffect(() => {
    if (loading || hasInitialized.current === false) return;

    const params = new URLSearchParams();

    if (searchQuery) params.set('q', searchQuery);
    if (sortBy !== 'default') params.set('sort', sortBy);
    if (selectedContributors.length > 0) {
      params.set('contributors', JSON.stringify(selectedContributors));
    }
    if (currentPage > 1) params.set('page', currentPage.toString());

    // Only update if different to avoid infinite loop
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    const currentUrl = `${window.location.pathname}?${searchParams.toString()}`;
    if (newUrl !== currentUrl) {
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, sortBy, selectedContributors, currentPage, loading, searchParams, setSearchParams]);

  // Initial load: mark as initialized after first render
  useEffect(() => {
    if (!loading) hasInitialized.current = true;
  }, [loading]);

  // Scroll restoration on page change
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, loading]);

  // Scroll to top button
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('page');
        return next;
      }, { replace: true });
    }
  }, [searchQuery, sortBy, selectedContributors]);

  const allContributors = useMemo(() => {
    const set = new Set<string>();
    Object.values(books).forEach(b => b.sharedBy?.trim() && set.add(b.sharedBy.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filteredContributors = useMemo(() => {
    if (!contributorSearch.trim()) return allContributors;
    const q = contributorSearch.toLowerCase();
    return allContributors.filter(c => c.toLowerCase().includes(q));
  }, [allContributors, contributorSearch]);

  const filteredBooks = useMemo(() => {
    let entries = Object.entries(books);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(([, b]) =>
        `${b.title} ${b.author} ${b.description} ${b.sharedBy || ''}`.toLowerCase().includes(q)
      );
    }

    if (selectedContributors.length > 0 && sortBy !== 'sharedBy') {
      entries = entries.filter(([, b]) => {
        const name = b.sharedBy?.trim();
        return name && selectedContributors.includes(name);
      });
    }

    return Object.fromEntries(entries);
  }, [books, searchQuery, selectedContributors, sortBy]);

  const sortedBookList = useMemo(() => {
    const list = Object.entries(filteredBooks);

    if (sortBy === 'title') list.sort((a, b) => (a[1].title || '').localeCompare(b[1].title || ''));
    else if (sortBy === 'author') list.sort((a, b) => (a[1].author || '').localeCompare(b[1].author || ''));
    else if (sortBy === 'sharedBy') list.sort((a, b) => (a[1].sharedBy || '').localeCompare(b[1].sharedBy || ''));

    return list;
  }, [filteredBooks, sortBy]);

  const paginationData = useMemo(() => {
    if (sortBy !== 'sharedBy') {
      const start = (currentPage - 1) * PAGE_SIZE;
      return {
        displayed: sortedBookList.slice(start, start + PAGE_SIZE),
        currentContributor: null,
        totalPages: Math.ceil(sortedBookList.length / PAGE_SIZE),
        contributorList: [] as string[],
      };
    }

    const groups: Record<string, typeof sortedBookList> = {};
    sortedBookList.forEach(item => {
      const key = item[1].sharedBy?.trim() || 'Unknown Contributor';
      (groups[key] ||= []).push(item);
    });

    const contributors = Object.keys(groups)
      .filter(k => groups[k].length)
      .sort((a, b) => a.localeCompare(b));

    const idx = Math.max(0, Math.min(currentPage - 1, contributors.length - 1));
    const currentName = contributors[idx] || 'Unknown Contributor';

    return {
      displayed: groups[currentName] || [],
      currentContributor: currentName,
      totalPages: contributors.length || 1,
      contributorList: contributors,
    };
  }, [sortedBookList, sortBy, currentPage]);

  const { displayed, currentContributor, totalPages, contributorList } = paginationData;

  // Handlers
  const updateSearch = (value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value.trim()) next.set('q', value.trim());
      else next.delete('q');
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const updateSort = (value: typeof sortBy) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value !== 'default') next.set('sort', value);
      else next.delete('sort');
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const updateContributors = (contributors: string[]) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (contributors.length > 0) {
        next.set('contributors', JSON.stringify(contributors));
      } else {
        next.delete('contributors');
      }
      next.delete('page');
      return next;
    }, { replace: true });
    setShowContributorModal(false);
  };

  const goToPage = (page: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (page > 1) next.set('page', page.toString());
      else next.delete('page');
      return next;
    }, { replace: true });
  };

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
      <button onClick={() => navigate('/')} className="fixed top-8 left-8 z-50 flex items-center gap-3 text-amber-300 hover:text-amber-100 transition text-lg tracking-wider uppercase">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </button>

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
                onChange={e => updateSearch(e.target.value)}
                placeholder="Search by title, author, contributor..."
                className="w-full py-5 pr-12 pl-3 bg-transparent text-amber-100 placeholder-amber-500/60 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => updateSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-amber-400 text-sm mt-4 text-center">
                Found <span className="font-bold text-amber-200">{sortedBookList.length}</span> result{sortedBookList.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="max-w-2xl mx-auto flex gap-4 mb-12">
            <select
              value={sortBy}
              onChange={e => updateSort(e.target.value as any)}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowContributorModal(false)}>
              <div className="w-full max-w-lg mx-4 bg-gradient-to-b from-amber-950/90 to-black border border-amber-800/60 rounded-2xl shadow-2xl overflow-hidden">
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
                    onChange={e => setContributorSearch(e.target.value)}
                    placeholder="Search contributors..."
                    className="w-full mb-6 px-5 py-4 bg-amber-950/50 border border-amber-800/60 rounded-xl text-amber-100 placeholder-amber-500/60 focus:outline-none focus:border-amber-500"
                  />

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {filteredContributors.map(name => (
                      <label key={name} className="flex items-center gap-4 p-4 rounded-lg hover:bg-amber-900/30 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedContributors.includes(name)}
                          onChange={e => {
                            const newList = e.target.checked
                              ? [...selectedContributors, name]
                              : selectedContributors.filter((n: any) => n !== name);
                            updateContributors(newList);
                          }}
                          className="w-5 h-5 text-amber-500 bg-amber-950/50 border-amber-700 rounded focus:ring-amber-500"
                        />
                        <span className="text-amber-100 text-lg">{name}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => updateContributors([])}
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

          {sortedBookList.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-amber-400 text-2xl">No books found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center">
                {displayed.map(([id, book]) => (
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
                    onClick={() => goToPage(currentPage - 1)}
                    className="px-8 py-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-100 disabled:opacity-50 hover:bg-amber-900/30 transition"
                  >
                    {sortBy === 'sharedBy' ? 'Previous Contributor' : 'Previous'}
                  </button>

                  <span className="text-amber-300 text-lg min-w-[200px] text-center">
                    Page {currentPage} of {totalPages}
                    {sortBy === 'sharedBy' && contributorList[currentPage - 1] && (
                      <span className="block text-sm text-amber-400 mt-1">
                        ({contributorList[currentPage - 1]})
                      </span>
                    )}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    className="px-8 py-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-100 disabled:opacity-50 hover:bg-amber-900/30 transition"
                  >
                    {sortBy === 'sharedBy' ? 'Next Contributor' : 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

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
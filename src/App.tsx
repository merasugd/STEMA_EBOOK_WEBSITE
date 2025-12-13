import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import BookIndex from './pages/BookIndex';
import BookInfo from './pages/BookInfo';
import NotFound from './pages/NotFound';
import { useEffect } from 'react';
import EasterPage from './components/Any';

function App() {
  function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
    return null;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bookindex" element={<BookIndex />} />
        <Route path="/book/:id" element={<BookInfo />} />
        <Route path="/what" element={<EasterPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
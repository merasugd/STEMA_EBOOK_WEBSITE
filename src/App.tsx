import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import BookIndex from './pages/BookIndex';
import BookInfo from './pages/BookInfo';
import { useEffect } from 'react';

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
      <ScrollToTop/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bookindex" element={<BookIndex />} />
        <Route path="/book/:id" element={<BookInfo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
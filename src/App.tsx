import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BookIndex from './pages/BookIndex';
import BookInfo from './pages/BookInfo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<BookIndex />} />
        <Route path="/book/:id" element={<BookInfo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
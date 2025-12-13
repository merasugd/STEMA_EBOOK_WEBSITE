import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount >= 5) {
      setClickCount(0);
      window.location.href = '/what?h=yourenotsupposedtobehere';
    }
  }, [clickCount]);

  const handleSecretClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative"
      style={{
        background: `linear-gradient(rgba(249, 245, 240, 0.85), rgba(249, 245, 240, 0.85)), url(/images/bg1.jpg) center/cover no-repeat fixed`,
      }}
    >

      <h1 onClick={handleSecretClick} className="text-8xl md:text-9xl font-bold mb-4 text-[#6b5a3d] tracking-tighter">
        404
      </h1>

      <p className="text-4xl md:text-5xl font-semibold mb-6 text-[#8b6f47]">
        Oops! Page Not Found
      </p>

      <p className="text-2xl md:text-3xl italic mb-12 text-[#6b5a3d] max-w-2xl">
        “Not all those who wander are lost…”<br />
        …but this page definitely is!
      </p>

      <Link to="/">
        <button className="btn-primary text-2xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-shadow">
          Back to Reading Corner
        </button>
      </Link>

      <div className="mt-16 flex flex-col items-center">
        <img
          src="/images/qrcode.png"
          alt="QR code to Book Index"
          className="w-48 h-48 md:w-56 md:h-56 shadow-lg rounded-lg border-4 border-white"
        />
        <Link to='https://stemabookindex.vercel.app'>
          <p className="mt-4 text-lg font-medium text-[#6b5a3d] break-all">
            https://stemabookindex.vercel.app
          </p>
        </Link>
      </div>

      <footer className="absolute bottom-8 text-lg text-[#6b5a3d]">
        <p>Made by: <strong>Meras and The STEM A</strong></p>
        <p>Project by: <strong>11-STEM-A</strong></p>
      </footer>
    </div>
  );
}
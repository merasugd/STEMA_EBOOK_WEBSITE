import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative"
      style={{
        background: `linear-gradient(rgba(249, 245, 240, 0.85), rgba(249, 245, 240, 0.85)), url(/images/bg1.jpg) center/cover no-repeat fixed`,
      }}
    >
      <h1 className="text-6xl md:text-7xl font-bold mb-4 text-[#6b5a3d]">
        STEM A Reading Corner
      </h1>
      <p className="text-3xl md:text-4xl italic mb-12 text-[#8b6f47]">
        “The more that you read, the more things you will know.” — Dr. Seuss
      </p>

      <div className="flex flex-col md:flex-row items-center gap-12 mb-12">
        <Link to="/bookindex">
          <button className="btn-primary text-2xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-shadow">
            Open Book Index
          </button>
        </Link>

        <div className="flex flex-col items-center">
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
      </div>

      <footer className="absolute bottom-8 text-lg text-[#6b5a3d]">
        <p>Made by: <strong>Meras and The STEM A</strong></p>
        <p>Project by: <strong>11-STEM-A</strong></p>
      </footer>
    </div>
  );
}
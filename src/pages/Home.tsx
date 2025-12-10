import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{
        background: `linear-gradient(rgba(249, 245, 240, 0.85), rgba(249, 245, 240, 0.85)), url(/images/bg1.jpg) center/cover no-repeat fixed`,
      }}
    >
      <h1 className="text-6xl md:text-7xl font-bold mb-4 text-[#6b5a3d]">
        STEMA Reading Corner
      </h1>
      <p className="text-3xl md:text-4xl italic mb-8 text-[#8b6f47]">
        “The more that you read, the more things you will know.” — Dr. Seuss
      </p>

      <Link to="/bookindex">
        <button className="btn-primary text-2xl px-12 py-6 shadow-xl">
          Open Book Index
        </button>
      </Link>

      <footer className="absolute bottom-8 text-lg">
        <p>Made by: <strong>Anjo Martin Meras</strong></p>
        <p>Project by: <strong>11-STEM-A</strong></p>
      </footer>
    </div>
  );
}
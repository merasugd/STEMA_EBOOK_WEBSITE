import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

function EasterPage() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('h');
  const SECRET_KEY = 'yourenotsupposedtobehere';

  const [userInteracted, setUserInteracted] = useState(false);
  const [outcome, setOutcome] = useState<'jumpscare' | 'cute' | null>(null);
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

  if (!key || key !== SECRET_KEY) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative"
        style={{
          background: `linear-gradient(rgba(249, 245, 240, 0.85), rgba(249, 245, 240, 0.85)), url(/images/bg1.jpg) center/cover no-repeat fixed`,
        }}
      >
        <h1
          onClick={handleSecretClick}
          className="text-8xl md:text-9xl font-bold mb-4 text-[#6b5a3d] tracking-tighter cursor-pointer select-none transition-all hover:scale-105 active:scale-95"
        >
          404
        </h1>
        <p className="text-4xl md:text-5xl font-semibold mb-6 text-[#8b6f47]">
          There's nothing here...
        </p>
        <p className="text-2xl md:text-3xl italic mb-12 text-[#6b5a3d] max-w-3xl leading-relaxed">
          The dust settles on empty shelves.<br />
          Faint scratches in the wood suggest something was meant to be here...<br />
          ...but the page has long since been torn out.
        </p>
        <Link to="/">
          <button className="btn-primary text-2xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-shadow">
            Back to Reading Corner
          </button>
        </Link>
        <footer className="absolute bottom-8 text-lg text-[#6b5a3d]">
          <p>Made by: <strong>Meras and The STEM A</strong></p>
          <p>Project by: <strong>11-STEM-A</strong></p>
        </footer>
      </div>
    );
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClickMe = () => {
    setUserInteracted(true);
    if (Math.random() < 0.5) {
      setOutcome('jumpscare');
    } else {
      setOutcome('cute');
    }
  };

  const handleAcceptFate = () => {
    alert("Your soul has been archived. Welcome to eternity.");
    window.location.href = '/';
  };

  const handleCuteClose = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    if (outcome === 'jumpscare') {
      const audio = new Audio('/easter/sound.mp3');
      audio.volume = 1;
      audio.loop = true;
      audio.play().catch(() => {});

      return () => {
        audio.pause();
      };
    } else {
      const audio = new Audio('/easter/cutesy.mp3');
      audio.volume = 0.7;
      audio.loop = true;
      audio.play().catch(() => {});

      return () => {
        audio.pause();
      };
    }
  }, [outcome]);

  if (!userInteracted) {
    return (
      <div
        className="fixed inset-0 bg-black flex items-center justify-center cursor-pointer"
        onClick={handleClickMe}
      >
        <p className="text-6xl md:text-8xl font-bold text-amber-600 tracking-widest animate-pulse select-none">
          CLICK ME
        </p>
      </div>
    );
  }

  if (outcome === 'jumpscare') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/98 backdrop-blur-lg">
        <div className="absolute inset-0 bg-red-900/60 animate-ping pointer-events-none" />

        <div className="relative max-w-4xl w-full mx-6 text-amber-100">
          <div className="flex flex-col items-center">
            <img
              src="/easter/image.jpg"
              alt="Ancient job application parchment"
              className="w-full max-w-2xl shadow-2xl rounded-xl border-8 border-amber-900 animate-pulse"
            />

            <div className="absolute inset-x-0 bottom-10 text-center space-y-6 px-8">
              <h1 className="text-5xl md:text-6xl font-bold text-red-600 tracking-widest drop-shadow-2xl">
                THE STACKS CLAIM YOU
              </h1>

              <p className="text-2xl italic text-amber-300">
                You were not meant to dwell this far...
              </p>

              <button
                onClick={handleAcceptFate}
                className="mt-8 px-12 py-5 bg-red-900/90 hover:bg-red-800 text-amber-100 font-bold text-2xl uppercase tracking-wider rounded-lg shadow-2xl transition"
              >
                Accept Your Fate
              </button>

              <p className="mt-6 text-amber-400 text-lg italic">
                There is no refusal. Only acceptance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-pink-100 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-8 h-8 opacity-70 animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 7}s`,
              top: '-10%',
            }}
          >
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f338.png" alt="cherry blossom" />
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-8">
        <img
          src="https://static.wikitide.net/kaoruhanawiki/e/e5/Kaoruko_Portal_Color.png"
          alt="Cute anime girl"
          className="w-80 h-80 md:w-96 md:h-96 rounded-full shadow-2xl border-8 border-pink-300"
        />

        <h1 className="mt-10 text-5xl md:text-7xl font-bold text-pink-600 tracking-wider">
          Kyaa~! You found me! ♡
        </h1>

        <p className="mt-6 text-2xl md:text-3xl text-pink-800 italic">
          Hehe, thank you for clicking~ 🌸
        </p>

        <p className="mt-4 text-xl text-pink-700">
          You're super cute for finding the secret! (*≧ω≦*)
        </p>

        <button
          onClick={handleCuteClose}
          className="mt-12 px-10 py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xl rounded-full shadow-lg transition"
        >
          Back to the Library ♡
        </button>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100%) rotate(0deg);
          }
          100% {
            transform: translateY(120vh) rotate(360deg);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}

export default EasterPage;
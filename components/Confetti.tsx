import React from 'react';

const CONFETTI_CLASSES = [
  'bg-confetti-1', 'bg-confetti-2', 'bg-confetti-3',
  'bg-confetti-4', 'bg-confetti-5', 'bg-confetti-6'
];
const CONFETTI_COUNT = 150;

const Confetti: React.FC = () => {
    return (
        <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
            {Array.from({ length: CONFETTI_COUNT }).map((_, index) => {
                const style: React.CSSProperties = {
                    left: `${Math.random() * 100}%`,
                    animation: `confetti-fall 8s ease-out forwards`,
                    animationDelay: `${Math.random() * 2}s`,
                    width: `${Math.floor(Math.random() * 8) + 6}px`,
                    height: `${Math.floor(Math.random() * 5) + 5}px`,
                    opacity: 0,
                };
                const confettiClass = CONFETTI_CLASSES[Math.floor(Math.random() * CONFETTI_CLASSES.length)];
                return <i key={index} style={style} className={`absolute top-[-20px] rounded-full ${confettiClass}`} />;
            })}
        </div>
    );
};

export default Confetti;

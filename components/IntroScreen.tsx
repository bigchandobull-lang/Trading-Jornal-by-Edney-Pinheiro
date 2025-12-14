import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../assets/icon';

interface IntroScreenProps {
  onAnimationEnd: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onAnimationEnd }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 3000); // Total duration of the intro

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-[100] animate-intro-fade-out">
      <div className="flex flex-col items-center gap-4 animate-intro-fade-in-scale">
        <AppIcon className="w-24 h-24" />
        <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight" style={{textShadow: '0 2px 4px hsla(0,0%,0%,0.1)'}}>
                {t('header.title')}
            </h1>
            <p className="text-lg text-brand-text-secondary mt-2">{t('header.author')}</p>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
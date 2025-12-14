
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlagEN } from '../assets/FlagEN';
import { FlagES } from '../assets/FlagES';
import { FlagBR } from '../assets/FlagBR';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: 'en' | 'es' | 'pt-BR') => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', flag: <FlagEN /> },
    { code: 'es', flag: <FlagES /> },
    { code: 'pt-BR', flag: <FlagBR /> },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-brand-surface border border-brand-border-soft shadow-soft backdrop-blur-md">
      {languages.map(({ code, flag }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code as 'en' | 'es' | 'pt-BR')}
          className={`p-1.5 rounded-md transition-all ${i18n.language.startsWith(code.split('-')[0]) ? 'bg-brand-surface-opaque shadow-sm ring-1 ring-brand-accent/50' : 'opacity-60 hover:opacity-100'}`}
          aria-label={`Change language to ${code === 'en' ? 'English' : code === 'es' ? 'Spanish' : 'Portuguese'}`}
        >
          {flag}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;

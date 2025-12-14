
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Locale } from 'date-fns';

const locales: { [key: string]: Locale } = { en: enUS, es, pt: ptBR };

export const useDateFnsLocale = () => {
    const { i18n } = useTranslation();
    const [locale, setLocale] = useState<Locale>(enUS);

    useEffect(() => {
        const lang = i18n.language.split('-')[0]; // 'en-US' -> 'en', 'pt-BR' -> 'pt'
        setLocale(locales[lang as keyof typeof locales] || enUS);
    }, [i18n.language]);

    return locale;
};

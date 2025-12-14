import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Streak } from '../types';
import { AlertCircle, TrendingUp, X, Flame, ShieldAlert } from 'lucide-react';

interface CycleAlertProps {
    streak: Streak | null;
}

const CycleAlert: React.FC<CycleAlertProps> = ({ streak }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (streak) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [streak]);

    if (!streak || !isVisible) {
        return null;
    }

    const isHighImpact = streak.length >= 5;
    const level = isHighImpact ? 'high' : 'low';

    // Configuration based on streak type and intensity
    const config = {
        loss: {
            low: {
                icon: <AlertCircle size={24} className="text-brand-loss" />,
                style: "bg-brand-loss/5 border-brand-loss/20",
                titleKey: 'cycleAlert.loss.low.title',
                descKey: 'cycleAlert.loss.low.desc',
                badgeStyle: "bg-brand-loss/10 text-brand-loss border border-brand-loss/20"
            },
            high: {
                icon: <ShieldAlert size={28} className="text-brand-loss animate-pulse" />,
                style: "bg-gradient-to-br from-brand-loss/10 via-brand-surface to-brand-surface border-brand-loss/50 shadow-lg shadow-brand-loss/5",
                titleKey: 'cycleAlert.loss.high.title',
                descKey: 'cycleAlert.loss.high.desc',
                badgeStyle: "bg-brand-loss text-white shadow-md border border-brand-loss"
            }
        },
        win: {
            low: {
                icon: <TrendingUp size={24} className="text-brand-profit" />,
                style: "bg-brand-profit/5 border-brand-profit/20",
                titleKey: 'cycleAlert.win.low.title',
                descKey: 'cycleAlert.win.low.desc',
                badgeStyle: "bg-brand-profit/10 text-brand-profit border border-brand-profit/20"
            },
            high: {
                icon: <Flame size={28} className="text-orange-500 animate-pulse" />,
                style: "bg-gradient-to-br from-brand-profit/10 via-brand-surface to-brand-surface border-brand-profit/50 shadow-lg shadow-brand-profit/5",
                titleKey: 'cycleAlert.win.high.title',
                descKey: 'cycleAlert.win.high.desc',
                badgeStyle: "bg-brand-profit text-white shadow-md border border-brand-profit"
            }
        }
    };

    const currentConfig = config[streak.type][level];

    return (
        <div 
            className={`relative flex items-start gap-4 p-5 mb-6 rounded-2xl border backdrop-blur-xl animate-scale-in transition-all duration-500 ${currentConfig.style}`}
            role="alert"
        >
            <div className="flex-shrink-0 p-3 bg-brand-surface rounded-xl shadow-sm border border-brand-border-soft">
                {currentConfig.icon}
            </div>
            <div className="flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wider ${currentConfig.badgeStyle}`}>
                        {streak.length} {t('cycleAlert.streak')}
                    </span>
                    <h4 className="font-bold text-brand-text-primary text-lg tracking-tight">
                        {t(currentConfig.titleKey)}
                    </h4>
                </div>
                <p className="text-sm text-brand-text-secondary leading-relaxed">
                    {t(currentConfig.descKey, { count: streak.length })}
                </p>
            </div>
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-3 p-2 rounded-full text-brand-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label={t('cycleAlert.dismiss')}
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default React.memo(CycleAlert);
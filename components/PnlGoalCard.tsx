import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, Settings } from 'lucide-react';
import Confetti from './Confetti';
import { useNotification } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface PnlGoalCardProps {
  pnlGoal: number;
  setPnlGoal: (goal: number) => void;
  totalPnl: number;
}

const PnlGoalCard: React.FC<PnlGoalCardProps> = ({ pnlGoal, setPnlGoal, totalPnl }) => {
  const { t } = useTranslation();
  const { formatCurrency, currencySymbol } = useCurrency();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const { showNotification } = useNotification();
  const goalMetRef = useRef(false);

  useEffect(() => {
    setGoalInput(pnlGoal > 0 ? pnlGoal.toString() : '');
  }, [pnlGoal]);

  useEffect(() => {
    // Reset confetti trigger when totalPnl falls below the goal
    if (pnlGoal > 0 && totalPnl < pnlGoal) {
      goalMetRef.current = false;
    }

    if (pnlGoal > 0 && totalPnl >= pnlGoal && !goalMetRef.current) {
      setShowConfetti(true);
      goalMetRef.current = true;
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [totalPnl, pnlGoal]);
  
  const handleGoalSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const newGoal = parseFloat(goalInput) || 0;
    if (newGoal <= 0) return;
    setPnlGoal(newGoal);
    setIsEditingGoal(false);
    showNotification(t('notifications.pnlGoalSaved'), 'success');
  };

  const handleGoalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleGoalSave();
    else if (e.key === 'Escape') {
      setIsEditingGoal(false);
      setGoalInput(pnlGoal > 0 ? pnlGoal.toString() : '');
    }
  };
  
  const pnlGoalProgress = pnlGoal > 0 ? (totalPnl / pnlGoal) * 100 : 0;
  const isGoalInputValid = useMemo(() => {
    const num = parseFloat(goalInput);
    return !isNaN(num) && num > 0;
  }, [goalInput]);

  return (
    <div className={`glass-panel p-5 flex flex-col justify-between hover-lift relative overflow-hidden group`}>
      {!isEditingGoal ? (
        <div onClick={() => setIsEditingGoal(true)} className="cursor-pointer h-full flex flex-col relative z-10">
          <div className="flex-grow">
            <div className="flex items-center text-brand-text-secondary mb-2">
                <div className="p-1.5 rounded-lg bg-white/10 mr-2 border border-white/5 group-hover:scale-110 transition-transform">
                    <Flag size={16} />
                </div>
                <span className="text-sm font-semibold">{t('dashboard.pnlGoal')}</span>
            </div>
            <div>
              <p className={`text-3xl font-bold ${pnlGoalProgress >= 100 ? 'text-brand-profit' : 'text-brand-text-primary'} drop-shadow-sm`}>
                {pnlGoal > 0 ? `${pnlGoalProgress.toFixed(1)}%` : t('dashboard.clickToSet')}
              </p>
              {pnlGoal > 0 && (
                <p className="text-xs text-brand-text-secondary mt-1">
                  {`${formatCurrency(totalPnl)} / ${formatCurrency(pnlGoal)}`}
                </p>
              )}
            </div>
          </div>
          {pnlGoal > 0 && (
            <div className="mt-auto pt-4">
              <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-brand-profit/70 to-brand-profit rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${Math.min(100, pnlGoalProgress)}%` }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleGoalSave} className="animate-fade-in relative z-10">
          <div className="flex items-center text-brand-text-secondary mb-2">
            <Settings size={20} />
            <span className="ml-2 text-sm font-semibold">{t('dashboard.setPnlGoal')}</span>
          </div>
          <div className="relative mt-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-text-secondary">{currencySymbol}</span>
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={handleGoalKeyDown}
              placeholder="e.g., 5000"
              className="w-full bg-white/5 border border-brand-border-soft rounded-xl pl-7 pr-3 py-2 text-brand-text-primary placeholder:text-brand-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:bg-white/10 transition-colors"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                setIsEditingGoal(false);
                setGoalInput(pnlGoal > 0 ? pnlGoal.toString() : '');
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-white/10 text-brand-text-secondary transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={!isGoalInputValid}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-accent/20"
            >
              {t('actions.save')}
            </button>
          </div>
        </form>
      )}
      {showConfetti && <Confetti />}
    </div>
  );
};

export default React.memo(PnlGoalCard);
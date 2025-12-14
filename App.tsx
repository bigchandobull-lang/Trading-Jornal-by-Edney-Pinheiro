import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Contrast, BarChart2, Calendar as CalendarIcon, List, Plus, Loader2 } from 'lucide-react';
import { AppIcon } from './assets/icon';
import TradeModal from './components/TradeModal';
import WeekDetailModal from './components/WeekDetailModal';
import { useTheme } from './components/ThemeProvider';
import DataManagement from './components/DataManagement';
import { Trade, TradesByDay } from './types';
import TagFilter from './components/TagFilter';
import IntroScreen from './components/IntroScreen';
import { usePnlGoal } from './hooks/usePnlGoal';
import { format, subDays, addDays } from 'date-fns';
import { useTradesContext } from './contexts/TradesContext';
import { useNotification } from './contexts/NotificationContext';
import LanguageSwitcher from './components/LanguageSwitcher';

const DashboardView = lazy(() => import('./components/DashboardView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const TradesList = lazy(() => import('./components/TradesList'));


export type Timeframe = 'week' | 'month' | 'year';
export type ActiveTab = 'dashboard' | 'calendar' | 'trades';

const Header: React.FC<{ 
    activeTab: ActiveTab; 
    setActiveTab: (tab: ActiveTab) => void; 
    onAddNewTrade: () => void; 
}> = React.memo(({ activeTab, setActiveTab, onAddNewTrade }) => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    const TABS = [
        { id: 'dashboard', label: t('tabs.dashboard'), icon: BarChart2 },
        { id: 'calendar', label: t('tabs.calendar'), icon: CalendarIcon },
        { id: 'trades', label: t('tabs.trades'), icon: List },
    ];
    
    return (
        <header className="sticky top-4 z-40 mb-10 transition-all duration-300">
            <div className="glass-panel flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-4 shadow-lg backdrop-blur-2xl">
                <div className="flex items-center gap-4">
                    <div className="grid place-content-center w-12 h-12 bg-white/10 rounded-xl shadow-inner border border-white/10 backdrop-blur-md animate-float">
                        <AppIcon className="w-8 h-8" />
                    </div>
                    <h1 className="hidden md:block text-2xl font-bold tracking-tight text-brand-text-primary drop-shadow-sm">{t('header.title')}</h1>
                </div>
                
                <div className="flex items-center justify-end gap-3 flex-wrap">
                    <LanguageSwitcher />
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/20 transition-all active:scale-95 text-brand-text-secondary hover:text-brand-text-primary"
                        aria-label={t('tooltips.toggleTheme')}
                    >
                        {theme === 'light' && <Moon size={20} />}
                        {theme === 'dark' && <Sun size={20} />}
                        {theme === 'high-contrast' && <Contrast size={20} />}
                    </button>
                    <DataManagement />
                    <button
                        onClick={onAddNewTrade}
                        className="relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-brand-accent hover:bg-indigo-500 rounded-xl shadow-lg shadow-brand-accent/30 transition-all duration-300 active:scale-95 hover:-translate-y-0.5 group"
                        aria-label={t('actions.addNewTrade')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
                        <Plus size={20} className="relative z-10" />
                        <span className="hidden xl:inline relative z-10">{t('actions.addNewTrade')}</span>
                    </button>
                </div>

                <div className="flex items-center bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl w-full lg:w-auto order-last lg:order-none backdrop-blur-sm border border-brand-border-soft">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ActiveTab)}
                            className={`flex-1 flex items-center justify-center gap-2.5 px-5 sm:px-6 py-2.5 text-sm font-semibold rounded-[12px] transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-brand-surface shadow-md text-brand-text-primary scale-100 ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/10 active:scale-95'}`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-brand-accent' : ''} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
});


const App: React.FC = () => {
  const { t } = useTranslation();
  
  const [showIntro, setShowIntro] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { trades, addTrade, deleteTrade, updateTrade, isLoaded, allTags } = useTradesContext();
  const { showNotification } = useNotification();

  const [selectedWeek, setSelectedWeek] = useState<{ start: Date, end: Date } | null>(null);
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { pnlGoal, setPnlGoal } = usePnlGoal();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [lastAddedTradeId, setLastAddedTradeId] = useState<string | null>(null);
  
  const filteredTrades = useMemo(() => {
    if (selectedTags.length === 0) {
        return trades;
    }
    return trades.filter(trade => {
        if (!trade.tags) {
            return false;
        }
        const tradeTagValues = Object.values(trade.tags).flat().filter(Boolean);
        return selectedTags.every(selectedTag => tradeTagValues.includes(selectedTag));
    });
  }, [trades, selectedTags]);

  const tradesByDay = useMemo(() => {
    const map = new Map<string, TradesByDay>();
    filteredTrades.forEach(trade => {
      const dateKey = trade.date;

      const summary = map.get(dateKey) || { totalPnl: 0, tradeCount: 0, trades: [] };
      summary.totalPnl += trade.pnl;
      summary.tradeCount += 1;
      summary.trades.push(trade);
      map.set(dateKey, summary);
    });
    return map;
  }, [filteredTrades]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDate(null);
  }, [])

  const handlePrevDay = useCallback(() => {
    setSelectedDate(prevDate => (prevDate ? subDays(prevDate, 1) : null));
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate(prevDate => (prevDate ? addDays(prevDate, 1) : null));
  }, []);
  
  const handleWeekClick = useCallback((start: Date, end: Date) => {
    setSelectedWeek({ start, end });
    setIsWeekModalOpen(true);
  }, []);

  const handleCloseWeekModal = useCallback(() => {
    setIsWeekModalOpen(false);
    setSelectedWeek(null);
  }, []);

  const handleAddTrade = useCallback((trade: Omit<Trade, 'id'>) => {
    const newTrade = addTrade(trade);
    setLastAddedTradeId(newTrade.id);
    showNotification(t('notifications.tradeAdded', { pair: newTrade.pair }), 'success');
  }, [addTrade, showNotification, t]);

  const handleUpdateTrade = useCallback(async (tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => {
    await updateTrade(tradeId, updates);
  }, [updateTrade]);
  
  const handleDeleteTrade = useCallback((tradeId: string) => {
      deleteTrade(tradeId);
      showNotification(t('notifications.tradeDeleted'), 'info');
  }, [deleteTrade, showNotification, t]);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => {
        const newTags = new Set(prev);
        if (newTags.has(tag)) {
            newTags.delete(tag);
        } else {
            newTags.add(tag);
        }
        return Array.from(newTags);
    });
  }, []);

  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  useEffect(() => {
    if (lastAddedTradeId) {
        const timer = setTimeout(() => setLastAddedTradeId(null), 1500);
        return () => clearTimeout(timer);
    }
  }, [lastAddedTradeId]);

  const tradesForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tradesByDay.get(dateStr)?.trades || [];
  }, [tradesByDay, selectedDate]);
  
  if (showIntro) {
    return <IntroScreen onAnimationEnd={() => setShowIntro(false)} />;
  }

  if (!isLoaded) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
                    <AppIcon className="w-8 h-8" />
                </div>
            </div>
        </div>
    );
  }

  const renderActiveTab = () => {
    switch(activeTab) {
      case 'calendar':
        return <CalendarView 
                  tradesByDay={tradesByDay} 
                  onDayClick={handleDayClick}
                  onWeekClick={handleWeekClick}
                />;
      case 'trades':
        return <TradesList trades={filteredTrades} lastAddedTradeId={lastAddedTradeId} />;
      case 'dashboard':
      default:
        return <DashboardView 
                  trades={filteredTrades}
                  pnlGoal={pnlGoal}
                  setPnlGoal={setPnlGoal}
                  lastAddedTradeId={lastAddedTradeId}
                  onDayClick={handleDayClick}
                  setActiveTab={setActiveTab}
                />;
    }
  }

  const suspenseFallback = (
    <div className="flex items-center justify-center p-12 glass-panel">
        <Loader2 size={32} className="animate-spin text-brand-accent" />
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans pb-24 sm:pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onAddNewTrade={() => handleDayClick(new Date())}
        />
        
        <main className="space-y-6">
          <div className="flex items-center justify-end">
             <TagFilter 
                  allTags={allTags}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  onClear={handleClearTags}
                />
          </div>
          <div key={activeTab} className="animate-content-fade-in">
             <Suspense fallback={suspenseFallback}>
                {renderActiveTab()}
             </Suspense>
          </div>
        </main>
      </div>

      {selectedDate && (
        <TradeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedDate={selectedDate}
          tradesForDay={tradesForSelectedDay}
          addTrade={handleAddTrade}
          deleteTrade={handleDeleteTrade}
          updateTrade={handleUpdateTrade}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
        />
      )}
      
      {selectedWeek && (
        <WeekDetailModal
          isOpen={isWeekModalOpen}
          onClose={handleCloseWeekModal}
          weekRange={selectedWeek}
          trades={trades}
        />
      )}
    </div>
  );
};

export default App;
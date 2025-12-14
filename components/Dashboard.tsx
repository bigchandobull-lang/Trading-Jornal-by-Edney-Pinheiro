import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { Timeframe, ActiveTab } from '../App';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval
} from 'date-fns';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Brush,
  Cell,
  ReferenceLine,
  CartesianGrid,
  ReferenceArea
} from 'recharts';
import { DollarSign, Percent, TrendingUp, BarChart2, ZoomOut } from 'lucide-react';
import { useTradeCycleTracker } from '../hooks/useTradeCycleTracker';
import { useAppColors } from '../contexts/ColorContext';
import { useCurrency } from '../contexts/CurrencyContext';

import PnlGoalCard from './PnlGoalCard';
import RecentTradesTable from './RecentTradesTable';
import CycleAlert from './CycleAlert';
import PeriodStrip from './PeriodStrip';
import CircadianProfitMap from './CircadianProfitMap';
import CircadianInsights from './CircadianInsights';
import TagPerformance from './TagPerformance';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';

interface DashboardProps {
  trades: Trade[];
  currentDate: Date;
  timeframe: Timeframe;
  pnlGoal: number;
  setPnlGoal: (goal: number) => void;
  lastAddedTradeId?: string | null;
  onDayClick: (date: Date) => void;
  setCurrentDate: (date: Date) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

const CustomTooltipContent = ({ active, payload, label, t, formatCurrency }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-brand-surface/95 p-3 border border-brand-border rounded-xl shadow-glass text-sm backdrop-blur-xl z-50 min-w-[200px]">
          <p className="font-bold text-brand-text-primary mb-3 border-b border-brand-border-soft pb-2">{label}</p>
          
          <div className="space-y-3">
            {/* Daily P&L Section */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-brand-text-secondary uppercase tracking-wider font-semibold">
                    <div className={`w-2 h-2 rounded-sm ${data.pnl >= 0 ? 'bg-brand-profit' : 'bg-brand-loss'}`}></div>
                    {t('common.pnl')}
                </div>
                <div className="flex justify-between items-baseline pl-4">
                    <span className={`font-bold font-mono text-base ${data.pnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>
                        {formatCurrency(data.pnl)}
                    </span>
                    <span className="text-xs text-brand-text-secondary">
                        {data.tradeCount} trade{data.tradeCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            
            {/* Equity Section */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-brand-text-secondary uppercase tracking-wider font-semibold">
                    <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                    Equity
                </div>
                <div className="pl-4">
                    <span className="font-bold font-mono text-base text-brand-text-primary">
                        {formatCurrency(data.cumulativePnl)}
                    </span>
                </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
};
  
const CustomTooltip = React.memo((props: any) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    return <CustomTooltipContent {...props} t={t} formatCurrency={formatCurrency} />;
});

const Dashboard: React.FC<DashboardProps> = ({
    trades, currentDate, timeframe, pnlGoal, setPnlGoal, lastAddedTradeId, onDayClick, setCurrentDate, setActiveTab
}) => {
    const { t } = useTranslation();
    const locale = useDateFnsLocale();
    const { chartColors } = useAppColors();
    const { formatCurrency } = useCurrency();

    // Zoom State
    const [left, setLeft] = useState<string | null>(null);
    const [right, setRight] = useState<string | null>(null);
    const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
    const [refAreaRight, setRefAreaRight] = useState<string | null>(null);

    // Reset zoom when timeframe or date changes
    useEffect(() => {
        setLeft(null);
        setRight(null);
        setRefAreaLeft(null);
        setRefAreaRight(null);
    }, [timeframe, currentDate]);

    const dateRange = useMemo(() => {
        switch (timeframe) {
            case 'week': return { start: startOfWeek(currentDate, { locale }), end: endOfWeek(currentDate, { locale }) };
            case 'year': return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
            case 'month':
            default: return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
        }
    }, [currentDate, timeframe, locale]);
    
    const filteredTrades = useMemo(() => {
        return trades.filter(trade => {
            const tradeDate = new Date(trade.date + 'T00:00:00');
            return isWithinInterval(tradeDate, dateRange);
        });
    }, [trades, dateRange]);
    
    const { totalPnl, winRate, avgPnl } = useMemo(() => {
        const tradeCount = filteredTrades.length;
        if (tradeCount === 0) return { totalPnl: 0, winRate: 0, avgPnl: 0 };
        
        const totalPnl = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);
        const winningTrades = filteredTrades.filter(t => t.pnl > 0).length;
        const winRate = (winningTrades / tradeCount) * 100;
        const avgPnl = totalPnl / tradeCount;
        
        return { totalPnl, winRate, avgPnl };
    }, [filteredTrades]);
    
    const chartData = useMemo(() => {
        const dataMap = new Map<string, { pnl: number, tradeCount: number }>();
        
        filteredTrades.forEach(trade => {
            const key = trade.date;
            const existing = dataMap.get(key) || { pnl: 0, tradeCount: 0 };
            existing.pnl += trade.pnl;
            existing.tradeCount++;
            dataMap.set(key, existing);
        });
        
        const sortedData = Array.from(dataMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));

        let cumulative = 0;
        return sortedData.map(item => {
            cumulative += item.pnl;
            return { ...item, cumulativePnl: cumulative };
        });
    }, [filteredTrades]);

    const streak = useTradeCycleTracker(filteredTrades);

    const zoom = () => {
        if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
            setRefAreaLeft(null);
            setRefAreaRight(null);
            return;
        }

        let leftIndex = chartData.findIndex(d => d.date === refAreaLeft);
        let rightIndex = chartData.findIndex(d => d.date === refAreaRight);

        // Handle case where activeLabel might not be found or indices are messed up
        if (leftIndex < 0 || rightIndex < 0) {
             setRefAreaLeft(null);
             setRefAreaRight(null);
             return;
        }

        if (leftIndex > rightIndex) [leftIndex, rightIndex] = [rightIndex, leftIndex];

        setRefAreaLeft(null);
        setRefAreaRight(null);
        setLeft(chartData[leftIndex].date);
        setRight(chartData[rightIndex].date);
    };

    const zoomOut = () => {
        setLeft(null);
        setRight(null);
    };

    const isZoomed = left !== null && right !== null;

    if (trades.length === 0) {
        return (
            <div className="empty-state-container glass-panel animate-scale-in">
                <div className="bg-brand-surface p-4 rounded-full border border-brand-border-soft shadow-inner mb-2">
                    <BarChart2 size={48} className="text-brand-accent opacity-80" />
                </div>
                <div>
                    <h3 className="font-bold text-brand-text-primary text-2xl">{t('dashboard.noTrades.title')}</h3>
                    <p className="mt-2 text-base text-brand-text-secondary max-w-md mx-auto leading-relaxed">{t('dashboard.noTrades.desc')}</p>
                    <button
                        onClick={() => onDayClick(new Date())}
                        className="mt-6 inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-brand-accent hover:bg-indigo-500 rounded-xl shadow-lg shadow-brand-accent/30 transition-all active:scale-95 hover:-translate-y-1"
                    >
                        {t('actions.logFirstTrade')}
                    </button>
                </div>
            </div>
        );
    }
    
    const StatCard = ({ icon, title, value, colorClass = 'text-brand-text-primary' }: { icon: React.ReactNode; title: string; value: string; colorClass?: string; }) => (
        <div className="glass-panel p-6 flex items-start gap-5 hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
            <div className="relative z-10 grid place-content-center w-14 h-14 bg-gradient-to-br from-white/20 to-white/5 border border-white/10 rounded-2xl shadow-inner text-brand-accent group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-sm font-semibold text-brand-text-secondary mb-1">{title}</p>
                <p className={`text-3xl font-bold tracking-tight ${colorClass} drop-shadow-sm`}>{value}</p>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-8 stagger-enter">
            <CycleAlert streak={streak} />
            
            <PeriodStrip 
                trades={trades}
                currentDate={currentDate}
                timeframe={timeframe}
                onDayClick={onDayClick}
                onSetDate={setCurrentDate}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={<DollarSign size={28} />}
                    title={t('dashboard.netPnl')}
                    value={formatCurrency(totalPnl)}
                    colorClass={totalPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}
                />
                <StatCard 
                    icon={<TrendingUp size={28} />}
                    title={t('dashboard.winRate')}
                    value={`${winRate.toFixed(1)}%`}
                />
                <StatCard 
                    icon={<Percent size={28} />}
                    title={t('dashboard.avgPnl')}
                    value={formatCurrency(avgPnl)}
                    colorClass={avgPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}
                />
                <PnlGoalCard pnlGoal={pnlGoal} setPnlGoal={setPnlGoal} totalPnl={totalPnl} />
            </div>

            <div className="glass-panel p-6 hover-lift relative">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="font-semibold text-brand-text-primary">{t('dashboard.pnlOverTime')}</h3>
                    <div className="flex items-center gap-4">
                        {isZoomed && (
                            <button 
                                onClick={zoomOut}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-accent bg-brand-accent/10 hover:bg-brand-accent/20 rounded-lg transition-colors animate-fade-in"
                            >
                                <ZoomOut size={14} />
                                Reset Zoom
                            </button>
                        )}
                        <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
                            <div className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 bg-brand-accent rounded-full"></div>
                                <span>Equity Curve</span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                                <div className="w-2.5 h-2.5 bg-brand-profit rounded-sm"></div>
                                <span>Daily P&L</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {chartData.length > 0 ? (
                    <div className="chart-container select-none" style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <ComposedChart 
                                data={chartData} 
                                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                                onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                                onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                                onMouseUp={zoom}
                            >
                                <defs>
                                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={chartColors.profit} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={chartColors.profit} stopOpacity={0.4}/>
                                    </linearGradient>
                                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={chartColors.loss} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={chartColors.loss} stopOpacity={0.4}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} strokeOpacity={0.5} />
                                <ReferenceLine y={0} stroke={chartColors.text} strokeOpacity={0.3} strokeWidth={1} />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
                                    tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500 }} 
                                    axisLine={{ stroke: chartColors.grid }} 
                                    tickLine={false} 
                                    dy={10}
                                    domain={[left || 'dataMin', right || 'dataMax']}
                                    allowDataOverflow={true}
                                />
                                <YAxis 
                                    yAxisId="left"
                                    tickFormatter={(v) => formatCurrency(v)} 
                                    tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={65}
                                />
                                <YAxis 
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(v) => formatCurrency(v)} 
                                    tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500, opacity: 0.5 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={65}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                
                                <Bar yAxisId="left" dataKey="pnl" radius={[4, 4, 4, 4]} barSize={12} animationDuration={1000}>
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.pnl >= 0 ? 'url(#profitGradient)' : 'url(#lossGradient)'} 
                                            stroke={entry.pnl >= 0 ? chartColors.profit : chartColors.loss}
                                            strokeWidth={1}
                                        />
                                    ))}
                                </Bar>
                                <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey="cumulativePnl" 
                                    stroke="var(--brand-accent)" 
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--brand-accent)', r: 3, strokeWidth: 0 }}
                                    activeDot={{ r: 6, stroke: 'var(--brand-surface)', strokeWidth: 2 }}
                                    animationDuration={1500}
                                />
                                {chartData.length > 20 && !isZoomed && (
                                    <Brush 
                                        dataKey="date" 
                                        height={30} 
                                        stroke="var(--brand-accent)" 
                                        fill="var(--glass-surface)"
                                        tickFormatter={() => ''}
                                        travellerWidth={10}
                                    />
                                )}
                                {refAreaLeft && refAreaRight ? (
                                    <ReferenceArea 
                                        yAxisId="left" 
                                        x1={refAreaLeft} 
                                        x2={refAreaRight} 
                                        strokeOpacity={0.3} 
                                        fill="var(--brand-accent)" 
                                        fillOpacity={0.1} 
                                    />
                                ) : null}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-72 flex items-center justify-center text-brand-text-secondary">{t('dashboard.noDataForChart')}</div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="glass-panel p-6 hover-lift flex flex-col">
                    <h3 className="font-semibold mb-6 text-brand-text-primary px-2">{t('dashboard.recentTrades')}</h3>
                    <div className="flex-1">
                        <RecentTradesTable trades={filteredTrades.slice(0, 10)} lastAddedTradeId={lastAddedTradeId} />
                    </div>
                     {filteredTrades.length > 10 && (
                        <div className="mt-6 text-center">
                            <button onClick={() => setActiveTab('trades')} className="text-sm font-semibold text-brand-accent hover:text-indigo-400 transition-colors">
                                {t('actions.viewAllTrades')}
                            </button>
                        </div>
                    )}
                </div>
                <div className="glass-panel p-6 hover-lift">
                    <TagPerformance trades={filteredTrades} />
                </div>
            </div>

            <div className="glass-panel p-6 hover-lift">
                <CircadianProfitMap trades={filteredTrades} />
                <CircadianInsights trades={filteredTrades} />
            </div>

        </div>
    );
};

export default React.memo(Dashboard);
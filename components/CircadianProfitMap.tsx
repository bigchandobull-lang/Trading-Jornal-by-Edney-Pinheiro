import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { getDay } from 'date-fns';
import {
  ResponsiveContainer,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Scatter,
  Cell,
  CartesianGrid
} from 'recharts';
import { useTheme } from './ThemeProvider';
import { useCurrency } from '../contexts/CurrencyContext';

// --- Constants for clarity and maintainability ---
const WEEKDAY_LABELS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS_WORKWEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const TRADING_WEEK = { startDay: 1, endDay: 5 }; // Monday (1) to Friday (5)
const TRADING_HOURS = { startHour: 7, endHour: 17 }; // 7 AM to 5 PM (inclusive)


interface CircadianProfitMapProps {
  trades: Trade[];
}

interface HeatmapData {
  day: number;
  hour: number;
  pnl: number;
  tradeCount: number;
  winRate: number;
}

const CustomTooltipContent = ({ active, payload, t, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as HeatmapData;
    return (
      <div className="bg-brand-surface/95 p-3 border border-brand-border rounded-xl shadow-glass text-sm backdrop-blur-xl z-50">
        <p className="font-bold text-brand-text-primary mb-1 border-b border-brand-border-soft pb-1">
          {WEEKDAY_LABELS_FULL[data.day]} • {data.hour}:00
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            <span className="text-brand-text-secondary">{t('common.pnl')}:</span>
            <span className={`font-mono font-bold text-right ${data.pnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>
                {formatCurrency(data.pnl)}
            </span>
            
            <span className="text-brand-text-secondary">Win Rate:</span>
            <span className="font-bold text-right text-brand-text-primary">{data.winRate.toFixed(0)}%</span>
            
            <span className="text-brand-text-secondary">Volume:</span>
            <span className="font-bold text-right text-brand-text-primary">{data.tradeCount}</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomTooltip = (props: any) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    return <CustomTooltipContent {...props} t={t} formatCurrency={formatCurrency} />;
};


const CircadianProfitMap: React.FC<CircadianProfitMapProps> = ({ trades }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const chartColors = React.useMemo(() => {
    const bodyStyles = getComputedStyle(document.body);
    return {
      text: bodyStyles.getPropertyValue('--color-text-secondary').trim(),
      grid: bodyStyles.getPropertyValue('--color-border-soft').trim(),
      noTradeFill: bodyStyles.getPropertyValue('--color-surface-light').trim(),
    };
  }, [theme]);

  const heatmapData = useMemo(() => {
    const hourlyData = new Map<string, { pnl: number; count: number; wins: number }>();

    trades.forEach(trade => {
      if (!trade.time) return;
      const tradeDate = new Date(`${trade.date}T${trade.time}`);
      const day = getDay(tradeDate); // Sunday = 0, Monday = 1, etc.
      
      // Filter for trades within the defined trading week
      if (day < TRADING_WEEK.startDay || day > TRADING_WEEK.endDay) return;
      
      const hour = tradeDate.getHours();
      const key = `${day}-${hour}`;
      
      const existing = hourlyData.get(key) || { pnl: 0, count: 0, wins: 0 };
      existing.pnl += trade.pnl;
      existing.count += 1;
      if (trade.pnl > 0) existing.wins += 1;
      hourlyData.set(key, existing);
    });

    const data: HeatmapData[] = [];
    // Generate grid data for the specified trading days and hours
    for (let day = TRADING_WEEK.startDay; day <= TRADING_WEEK.endDay; day++) {
      for (let hour = TRADING_HOURS.startHour; hour <= TRADING_HOURS.endHour; hour++) {
        const key = `${day}-${hour}`;
        const entry = hourlyData.get(key);
        if (entry) {
            data.push({
                day,
                hour,
                pnl: entry.pnl,
                tradeCount: entry.count,
                winRate: (entry.wins / entry.count) * 100
            });
        }
      }
    }
    return data;
  }, [trades]);

  const hasData = heatmapData.length > 0;

  const maxAbsPnl = useMemo(() => {
    if (!hasData) return 1;
    return Math.max(1, ...heatmapData.map(d => Math.abs(d.pnl)));
  }, [heatmapData, hasData]);

  const maxVolume = useMemo(() => {
      if (!hasData) return 10;
      return Math.max(1, ...heatmapData.map(d => d.tradeCount));
  }, [heatmapData, hasData]);

  const getColor = useCallback((pnl: number) => {
    const intensity = Math.min(1, Math.sqrt(Math.abs(pnl) / maxAbsPnl)); 
    const alpha = 0.3 + intensity * 0.7; // Min 0.3 alpha to be visible
    return pnl >= 0 ? `rgba(16, 185, 129, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
  }, [maxAbsPnl]);

  const dayFormatter = (day: number) => WEEKDAY_LABELS_WORKWEEK[day - TRADING_WEEK.startDay];
  const hourFormatter = (hour: number) => `${hour}:00`;

  if (!hasData) {
    return (
        <div>
            <h3 className="font-semibold mb-4 text-brand-text-primary">{t('circadian.title')}</h3>
            <div className="h-[350px] flex items-center justify-center text-brand-text-secondary bg-brand-surface-light rounded-lg border border-dashed border-brand-border-soft">
                {t('dashboard.noDataForChart')}
            </div>
        </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-brand-text-primary">{t('circadian.title')}</h3>
          <div className="flex items-center gap-3 text-xs text-brand-text-secondary">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-profit"></div> Profit</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-loss"></div> Loss</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-brand-text-secondary"></div> Size = Volume</span>
          </div>
      </div>
       <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} strokeOpacity={0.5} horizontal={true} vertical={true} />
                <XAxis 
                    type="number" 
                    dataKey="day" 
                    name="day" 
                    domain={[TRADING_WEEK.startDay - 0.5, TRADING_WEEK.endDay + 0.5]}
                    tickCount={TRADING_WEEK.endDay - TRADING_WEEK.startDay + 1}
                    tickFormatter={dayFormatter}
                    tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: chartColors.grid }}
                    tickLine={false}
                    padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                    type="number" 
                    dataKey="hour" 
                    name="hour" 
                    domain={[TRADING_HOURS.startHour - 0.5, TRADING_HOURS.endHour + 0.5]}
                    reversed={true}
                    tickCount={TRADING_HOURS.endHour - TRADING_HOURS.startHour + 1}
                    tickFormatter={hourFormatter}
                    tick={{ fill: chartColors.text, fontSize: 12 }}
                    axisLine={{ stroke: chartColors.grid }}
                    tickLine={false}
                    width={50}
                />
                <ZAxis type="number" dataKey="tradeCount" range={[60, 600]} name="Volume" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter data={heatmapData} name="Trades">
                    {heatmapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(entry.pnl)} stroke={entry.pnl >= 0 ? '#059669' : '#DC2626'} strokeWidth={1} fillOpacity={0.8} />
                    ))}
                </Scatter>
            </ScatterChart>
        </ResponsiveContainer>
    </div>
  );
};

export default CircadianProfitMap;
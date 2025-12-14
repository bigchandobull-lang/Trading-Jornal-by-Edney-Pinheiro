import { TFunction } from 'i18next';
import { Trade, AIAnalysisResult, ActionableInsight, KeyObservation, PerformanceGrade } from '../types';
import { formatTag } from './tags';

const MIN_TAG_TRADES = 3;
const TREND_ANALYSIS_PERIOD = 20; // Number of recent trades to check for trend

interface TagStats {
    pnl: number;
    wins: number;
    losses: number;
    count: number;
}

const formatPercent = (value: number) => `${value.toFixed(0)}%`;

/** Calculates a 1-10 consistency score based on P&L volatility. */
const calculateConsistency = (trades: Trade[]): number => {
    if (trades.length < 5) return 0;
    const pnls = trades.map(t => t.pnl);
    const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const stdDev = Math.sqrt(pnls.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / pnls.length);
    const avgAbsPnl = pnls.reduce((a, b) => a + Math.abs(b), 0) / pnls.length;
    if (avgAbsPnl === 0) return 1;

    // Coefficient of variation - lower is better.
    const coefficientOfVariation = stdDev / avgAbsPnl;

    // Map CV to a 1-10 score. This is an empirical mapping.
    // A CV of 0.5 or less is excellent (score 9-10).
    // A CV of 2.0 or more is highly inconsistent (score 1-2).
    const score = Math.round(10 * Math.exp(-0.6 * coefficientOfVariation));
    return Math.max(1, Math.min(10, score));
};

/** Calculates an overall performance grade. */
const calculatePerformanceGrade = (metrics: AIAnalysisResult['keyMetrics'], t: TFunction): PerformanceGrade => {
    const { profitFactor, winRate, consistencyScore } = metrics;
    
    const pfScore = isFinite(profitFactor) ? (profitFactor > 2 ? 10 : profitFactor > 1.5 ? 8 : profitFactor > 1.2 ? 6 : profitFactor > 1 ? 4 : 2) : 10;
    const wrScore = winRate > 65 ? 10 : winRate > 55 ? 8 : winRate > 50 ? 6 : winRate > 40 ? 4 : 2;

    const totalScore = (pfScore * 0.45) + (wrScore * 0.35) + (consistencyScore * 0.2);

    if (totalScore > 8.5) return { grade: 'A', summary: t('aiInsights.grade.summaryA') };
    if (totalScore > 7) return { grade: 'B', summary: t('aiInsights.grade.summaryB') };
    if (totalScore > 5) return { grade: 'C', summary: t('aiInsights.grade.summaryC') };
    return { grade: 'D', summary: t('aiInsights.grade.summaryD') };
};


/** Analyzes recent performance vs. overall performance to detect slumps. */
const analyzePerformanceTrend = (trades: Trade[], overallWinRate: number, overallProfitFactor: number, t: TFunction): ActionableInsight | null => {
    if (trades.length < TREND_ANALYSIS_PERIOD * 2) return null;
    
    const recentTrades = trades.slice(0, TREND_ANALYSIS_PERIOD);
    const recentWins = recentTrades.filter(t => t.pnl > 0).length;
    const recentWinRate = recentTrades.length > 0 ? (recentWins / recentTrades.length) * 100 : 0;
    
    const recentTotalWinPnl = recentTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const recentTotalLossPnl = recentTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0);
    const recentProfitFactor = recentTotalLossPnl !== 0 ? Math.abs(recentTotalWinPnl / recentTotalLossPnl) : Infinity;

    const winRateDrop = overallWinRate - recentWinRate;
    const isDegraded = winRateDrop > 15 || (isFinite(overallProfitFactor) && recentProfitFactor < (overallProfitFactor * 0.7));

    if (isDegraded) {
        return {
            // FIX: 'trend' is not a valid topic. Changed to 'performance' as it relates to performance degradation.
            topic: 'performance',
            pattern: t('aiInsights.offline.trendPattern', { count: TREND_ANALYSIS_PERIOD, winRate: formatPercent(recentWinRate) }),
            recommendation: t('aiInsights.offline.trendRec'),
            relatedTags: [],
        };
    }
    return null;
}

/** Finds the most profitable hour of the day. */
const findGoldenHour = (trades: Trade[], t: TFunction, formatCurrency: (val: number) => string): ActionableInsight | null => {
    const hourlyStats = trades.reduce((acc, trade) => {
        const hour = new Date(`${trade.date}T${trade.time}`).getHours();
        const stats = acc.get(hour) || { pnl: 0, count: 0 };
        stats.pnl += trade.pnl;
        stats.count++;
        acc.set(hour, stats);
        return acc;
    }, new Map<number, {pnl: number, count: number}>());

    const significantHours = [...hourlyStats.entries()]
        .filter(([, stats]) => stats.count >= 5)
        .map(([hour, stats]) => ({ hour, ...stats, avgPnl: stats.pnl / stats.count }))
        .sort((a, b) => b.avgPnl - a.avgPnl);

    if (significantHours.length > 0 && significantHours[0].avgPnl > 0) {
        const bestHour = significantHours[0];
        const startTime = `${bestHour.hour}:00`;
        const endTime = `${bestHour.hour + 1}:00`;
        return {
            topic: 'timing',
            pattern: t('aiInsights.offline.goldenHourPattern', { startTime, endTime, avgPnl: formatCurrency(bestHour.avgPnl) }),
            recommendation: t('aiInsights.offline.goldenHourRec'),
            relatedTags: [],
        };
    }
    return null;
};

/** Provides a qualitative assessment of the trader's risk profile. */
const analyzeRiskProfile = (avgWin: number, avgLoss: number, winRate: number, t: TFunction): KeyObservation => {
    const rrRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : Infinity;
    let profileKey = 'riskProfile_balanced';
    if (rrRatio > 2.5 && winRate < 45) profileKey = 'riskProfile_sniper';
    else if (rrRatio < 1.5 && winRate > 55) profileKey = 'riskProfile_scalper';
    else if (rrRatio < 1.2 && winRate < 45) profileKey = 'riskProfile_highRisk';
    else if (rrRatio > 2 && winRate > 50) profileKey = 'riskProfile_effective';

    return {
        topic: 'risk',
        text: t(`aiInsights.offline.${profileKey}`, { rr: isFinite(rrRatio) ? rrRatio.toFixed(1) : 'N/A', winRate: formatPercent(winRate) })
    };
};

export const analyzeTradesOffline: (trades: Trade[], t: TFunction, formatCurrency: (val: number) => string) => AIAnalysisResult = (trades, t, formatCurrency) => {
    const totalPnl = trades.reduce((acc, trade) => acc + trade.pnl, 0);
    const totalWins = trades.filter(t => t.pnl > 0).length;
    const totalLosses = trades.filter(t => t.pnl < 0).length;
    const winRate = trades.length > 0 ? (totalWins / trades.length) * 100 : 0;
    const totalWinPnl = trades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const totalLossPnl = trades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0);
    const avgWin = totalWins > 0 ? totalWinPnl / totalWins : 0;
    const avgLoss = totalLosses > 0 ? totalLossPnl / totalLosses : 0;
    const profitFactor = totalLossPnl !== 0 ? Math.abs(totalWinPnl / totalLossPnl) : Infinity;

    const tagStats = new Map<string, TagStats>();
    trades.forEach(trade => {
        if (!trade.tags) return;
        const allTradeTags = Object.entries(trade.tags).flatMap(([category, value]) => {
            if (Array.isArray(value)) return value.map(v => `${category}:${v}`);
            return value ? [`${category}:${value}`] : [];
        });
        
        allTradeTags.forEach(tag => {
            const stats = tagStats.get(tag) || { pnl: 0, wins: 0, losses: 0, count: 0 };
            stats.pnl += trade.pnl;
            stats.count++;
            if (trade.pnl > 0) stats.wins++;
            else if (trade.pnl < 0) stats.losses++;
            tagStats.set(tag, stats);
        });
    });

    const significantTags = Array.from(tagStats.entries())
        .filter(([, stats]) => stats.count >= MIN_TAG_TRADES)
        .map(([tag, stats]) => ({
            tag, ...stats,
            winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
            avgPnl: stats.count > 0 ? stats.pnl / stats.count : 0,
        }));

    const profitableTags = significantTags
        .filter(tag => tag.pnl > 0)
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 5);

    const unprofitableTags = significantTags
        .filter(tag => tag.pnl < 0)
        .sort((a, b) => a.pnl - b.pnl)
        .slice(0, 5);

    const strengths: string[] = [];
    if (winRate > 55) strengths.push(t('aiInsights.offline.strengthWinRate', { winRate: formatPercent(winRate) }));
    if (profitFactor > 1.5) strengths.push(t('aiInsights.offline.strengthProfitFactor', { profitFactor: profitFactor.toFixed(2) }));
    
    const weaknesses: string[] = [];
    if (winRate < 45) weaknesses.push(t('aiInsights.offline.weaknessWinRate', { winRate: formatPercent(winRate) }));
    if (profitFactor < 1 && isFinite(profitFactor)) weaknesses.push(t('aiInsights.offline.weaknessProfitFactor', { profitFactor: profitFactor.toFixed(2) }));
    
    const actionableInsights: ActionableInsight[] = [];
    
    // Strategy/Tag Insights
    significantTags.sort((a, b) => b.pnl - a.pnl).slice(0, 1).forEach(tag => {
        if (tag.pnl > 0) actionableInsights.push({ topic: 'strategy', pattern: t('aiInsights.offline.strengthTag', { tag: formatTag(tag.tag), pnl: formatCurrency(tag.pnl) }), recommendation: t('aiInsights.offline.strengthTagRec'), relatedTags: [tag.tag] });
    });
    significantTags.sort((a, b) => a.pnl - b.pnl).slice(0, 1).forEach(tag => {
        if (tag.pnl < 0) actionableInsights.push({ topic: 'strategy', pattern: t('aiInsights.offline.weaknessTag', { tag: formatTag(tag.tag), pnl: formatCurrency(tag.pnl) }), recommendation: t('aiInsights.offline.weaknessTagRec'), relatedTags: [tag.tag] });
    });

    // Risk/Mistake Insights
    const mistakeTags = significantTags.filter(t => t.tag.startsWith('mistakes:'));
    if (mistakeTags.length > 0) {
        const worstMistake = mistakeTags.sort((a, b) => a.pnl - b.pnl)[0];
        if (worstMistake && worstMistake.pnl < 0) {
            actionableInsights.push({
                topic: 'risk',
                pattern: t('aiInsights.offline.patternMistake', { mistake: formatTag(worstMistake.tag), pnl: formatCurrency(worstMistake.pnl) }),
                recommendation: t('aiInsights.offline.recommendationMistake'),
                relatedTags: [worstMistake.tag],
            });
        }
    }

    const performanceTrendInsight = analyzePerformanceTrend(trades, winRate, profitFactor, t);
    if (performanceTrendInsight) actionableInsights.push(performanceTrendInsight);
    
    const goldenHourInsight = findGoldenHour(trades, t, formatCurrency);
    if (goldenHourInsight) actionableInsights.push(goldenHourInsight);

    const keyObservations: KeyObservation[] = [
        { topic: 'general', text: t('aiInsights.offline.observationOverall', { tradeCount: trades.length, totalPnl: formatCurrency(totalPnl) }) },
        analyzeRiskProfile(avgWin, avgLoss, winRate, t)
    ];

    const summary = t('aiInsights.offline.summary', {
        result: totalPnl > 0 ? t('common.profitable') : t('common.unprofitable'),
        tradeCount: trades.length,
        winRate: formatPercent(winRate)
    });
    
    const keyMetrics = {
        consistencyScore: calculateConsistency(trades),
        profitFactor,
        winRate,
        totalPnl,
        tradeCount: trades.length,
        avgWin,
        avgLoss,
    };

    return {
        overallSummary: summary,
        strengths,
        weaknesses,
        actionableInsights,
        keyObservations,
        performanceGrade: calculatePerformanceGrade(keyMetrics, t),
        keyMetrics,
        tagPerformance: {
            profitable: profitableTags.map(t => ({ tag: t.tag, totalPnl: t.pnl, tradeCount: t.count, winRate: t.winRate })),
            unprofitable: unprofitableTags.map(t => ({ tag: t.tag, totalPnl: t.pnl, tradeCount: t.count, winRate: t.winRate })),
        }
    };
};
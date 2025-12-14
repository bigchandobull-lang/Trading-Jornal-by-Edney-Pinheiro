import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade, AIAnalysisResult, KeyObservation, ActionableInsight } from '../types';
import { BrainCircuit, Loader2, AlertTriangle, CheckCircle, Lightbulb, Zap, TrendingDown, Clock, ShieldCheck, Scale, Award, Tag, TrendingUp } from 'lucide-react';
import { formatTag } from '../utils/tags';
import { analyzeTradesOffline } from '../utils/offlineAnalysis';
import { analyzeTradingPerformance } from '../utils/geminiAnalysis';
import { useCurrency } from '../contexts/CurrencyContext';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const MIN_TRADES_FOR_ANALYSIS = 20;

const TOPIC_ICONS: { [key: string]: React.ReactNode } = {
  performance: <TrendingDown className="text-orange-400" size={24} />,
  opportunity: <Clock className="text-teal-400" size={24} />,
  risk: <ShieldCheck className="text-rose-400" size={24} />,
  consistency: <Scale className="text-indigo-400" size={24} />,
  general: <Zap className="text-blue-400" size={24} />,
  strategy: <Award className="text-purple-400" size={24} />,
  timing: <Clock className="text-cyan-400" size={24} />,
  default: <Lightbulb className="text-yellow-400" size={24} />,
};

const LoadingState: React.FC = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);

    const loadingMessages = [
        t('aiInsights.loading.step1', "Preparing trade data..."),
        t('aiInsights.loading.step2', "Analyzing risk and consistency..."),
        t('aiInsights.loading.step3', "Identifying recurring patterns..."),
        t('aiInsights.loading.step4', "Generating recommendations...")
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % loadingMessages.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [loadingMessages.length]);

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-8 animate-fade-in min-h-[400px]">
            <div className="relative">
                <div className="absolute inset-0 bg-brand-accent/20 blur-2xl rounded-full animate-pulse"></div>
                <div className="relative bg-brand-surface p-6 rounded-3xl border border-brand-border-soft shadow-glass backdrop-blur-xl">
                    <Loader2 size={48} className="animate-spin text-brand-accent" />
                </div>
            </div>
            
            <div className="space-y-3 max-w-md w-full">
                <h3 className="text-xl font-bold text-brand-text-primary tracking-tight">{t('aiInsights.loadingTitle')}</h3>
                <p className="text-brand-text-secondary h-6 transition-all duration-300 font-medium">
                    {loadingMessages[step]}
                </p>
                
                {/* Progress Bar Visual */}
                <div className="w-full h-1.5 bg-brand-surface-light border border-brand-border-soft rounded-full overflow-hidden mt-4 mx-auto max-w-[200px]">
                    <div 
                        className="h-full bg-brand-accent rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                        style={{ width: `${((step + 1) / loadingMessages.length) * 100}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite] skew-x-12"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PerformanceGradeCard: React.FC<{ result: AIAnalysisResult, formatCurrency: (val: number) => string }> = ({ result, formatCurrency }) => {
    const { performanceGrade, keyMetrics } = result;
    if (!performanceGrade || !keyMetrics) return null;
    
    const gradeColor = {
        'A': '#10B981', // Emerald
        'B': '#3B82F6', // Blue
        'C': '#F59E0B', // Amber
        'D': '#EF4444', // Red
    }[performanceGrade.grade];

    const consistencyData = [{
        name: 'Consistency',
        value: keyMetrics.consistencyScore * 10,
        fill: gradeColor
    }];

    return (
        <div className="card-container">
            <div className="card-content grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex flex-col items-center justify-center text-center p-4 relative">
                    <div className="h-40 w-40 relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="80%" 
                                outerRadius="100%" 
                                barSize={10} 
                                data={consistencyData} 
                                startAngle={90} 
                                endAngle={-270}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-5xl font-bold text-brand-text-primary" style={{ color: gradeColor }}>
                                {performanceGrade.grade}
                            </span>
                            <span className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wider mt-1">Grade</span>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-brand-text-secondary font-medium max-w-xs">{performanceGrade.summary}</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-brand-surface-light p-3 rounded-lg">
                        <p className="text-sm font-semibold text-brand-text-secondary">Win Rate</p>
                        <p className="text-3xl font-bold mt-1">{keyMetrics.winRate.toFixed(1)}%</p>
                    </div>
                    <div className="bg-brand-surface-light p-3 rounded-lg">
                        <p className="text-sm font-semibold text-brand-text-secondary">Profit Factor</p>
                        <p className={`text-3xl font-bold mt-1 ${keyMetrics.profitFactor >= 1.5 ? 'text-brand-profit' : keyMetrics.profitFactor < 1 ? 'text-brand-loss' : ''}`}>
                            {isFinite(keyMetrics.profitFactor) ? keyMetrics.profitFactor.toFixed(2) : '∞'}
                        </p>
                    </div>
                    <div className="bg-brand-surface-light p-3 rounded-lg">
                        <p className="text-sm font-semibold text-brand-text-secondary">Consistency</p>
                        <p className="text-3xl font-bold mt-1">{keyMetrics.consistencyScore}/10</p>
                    </div>
                    <div className="bg-brand-surface-light p-3 rounded-lg">
                        <p className="text-sm font-semibold text-brand-text-secondary">Avg. Win</p>
                        <p className="text-xl font-semibold mt-1 text-brand-profit">{formatCurrency(keyMetrics.avgWin ?? 0)}</p>
                    </div>
                    <div className="bg-brand-surface-light p-3 rounded-lg">
                        <p className="text-sm font-semibold text-brand-text-secondary">Avg. Loss</p>
                        <p className="text-xl font-semibold mt-1 text-brand-loss">{formatCurrency(keyMetrics.avgLoss ?? 0)}</p>
                    </div>
                     <div className="bg-brand-surface-light p-3 rounded-lg">
                        <p className="text-sm font-semibold text-brand-text-secondary">Net P&L</p>
                        <p className={`text-xl font-bold mt-1 ${keyMetrics.totalPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>{formatCurrency(keyMetrics.totalPnl)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InsightTopicCard: React.FC<{ title: string; icon: React.ReactNode; insights: (ActionableInsight | KeyObservation)[] }> = ({ title, icon, insights }) => {
    const { t } = useTranslation();
    if (insights.length === 0) return null;

    return (
        <div className="glass-card p-6 h-full">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-brand-text-primary mb-4">{icon}{title}</h3>
            <ul className="space-y-4">
                {insights.map((insight, index) => (
                    <li key={index} className="text-sm">
                        <p className="font-semibold text-brand-text-primary mb-1">
                            {'pattern' in insight ? insight.pattern : insight.text}
                        </p>
                        {'recommendation' in insight && (
                            <p className="text-brand-text-secondary pl-2 border-l-2 border-brand-accent/50">
                                {insight.recommendation}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TagPerformanceListItem: React.FC<{ stat: any, isProfitable: boolean, maxAbsPnl: number, formatCurrency: (val: number) => string }> = ({ stat, isProfitable, maxAbsPnl, formatCurrency }) => {
    const { t } = useTranslation();
    const pnlColor = isProfitable ? 'text-brand-profit' : 'text-brand-loss';
    const pnlBg = isProfitable ? 'bg-brand-profit' : 'bg-brand-loss';
    const barWidth = maxAbsPnl > 0 ? (Math.abs(stat.totalPnl) / maxAbsPnl) * 100 : 0;
    
    return (
        <li className="p-3 bg-brand-surface-light rounded-lg border border-brand-border-soft">
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-brand-text-primary truncate">{formatTag(stat.tag)}</span>
                <span className={`font-semibold text-sm ${pnlColor}`}>
                    {formatCurrency(stat.totalPnl)}
                </span>
            </div>
            <div className="flex justify-between items-center text-xs text-brand-text-secondary">
                <span>{stat.winRate.toFixed(0)}% WR</span>
                <span>{t('tradeModal.trade', { count: stat.tradeCount })}</span>
            </div>
            <div className="relative h-1.5 w-full bg-brand-surface rounded-full mt-2 overflow-hidden">
                <div className={`absolute top-0 left-0 h-full rounded-full ${pnlBg}`} style={{ width: `${Math.min(100, barWidth)}%` }}></div>
            </div>
        </li>
    );
};

const TagPerformanceAnalysis: React.FC<{ result: AIAnalysisResult, formatCurrency: (val: number) => string }> = ({ result, formatCurrency }) => {
    const { t } = useTranslation();
    const { profitable, unprofitable } = result.tagPerformance || { profitable: [], unprofitable: [] };

    const maxAbsPnl = useMemo(() => {
        const allPnl = [...profitable.map(s => s.totalPnl), ...unprofitable.map(s => s.totalPnl)];
        if (allPnl.length === 0) return 1;
        return Math.max(1, ...allPnl.map(pnl => Math.abs(pnl)));
    }, [profitable, unprofitable]);

    if (profitable.length === 0 && unprofitable.length === 0) {
        return null;
    }

    return (
        <div className="glass-card p-6">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-brand-text-primary mb-4">
                <Tag size={24} className="text-brand-accent" />
                {t('dashboard.tagPerformance')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={18} className="text-brand-profit" />
                        <h4 className="font-semibold text-sm text-brand-text-primary">{t('dashboard.topProfitableTags')}</h4>
                    </div>
                    {profitable.length > 0 ? (
                        <ul className="space-y-2">
                            {profitable.map(stat => <TagPerformanceListItem key={stat.tag} stat={stat} isProfitable={true} maxAbsPnl={maxAbsPnl} formatCurrency={formatCurrency} />)}
                        </ul>
                    ) : <p className="text-xs text-center text-brand-text-secondary p-4">{t('dashboard.noProfitableTags')}</p>}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={18} className="text-brand-loss" />
                        <h4 className="font-semibold text-sm text-brand-text-primary">{t('dashboard.topUnprofitableTags')}</h4>
                    </div>
                    {unprofitable.length > 0 ? (
                        <ul className="space-y-2">
                            {unprofitable.map(stat => <TagPerformanceListItem key={stat.tag} stat={stat} isProfitable={false} maxAbsPnl={maxAbsPnl} formatCurrency={formatCurrency} />)}
                        </ul>
                    ) : <p className="text-xs text-center text-brand-text-secondary p-4">{t('dashboard.noUnprofitableTags')}</p>}
                </div>
            </div>
        </div>
    );
};

const AnalysisResults: React.FC<{ result: AIAnalysisResult, formatCurrency: (val: number) => string }> = ({ result, formatCurrency }) => {
    const { t } = useTranslation();

    const groupedInsights = useMemo(() => {
        const allInsights = [...(result.actionableInsights || []), ...(result.keyObservations || [])];
        const groups: { [key: string]: (ActionableInsight | KeyObservation)[] } = {
            risk: [],
            timing: [],
            strategy: [],
        };
        allInsights.forEach(insight => {
            const topic = insight.topic || 'default';
            if (groups[topic]) {
                groups[topic].push(insight);
            } else if (groups.strategy) { // Fallback for unexpected topics
                groups.strategy.push(insight);
            }
        });
        return groups;
    }, [result]);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-content-fade-in">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-brand-text-primary mb-2">{t('aiInsights.analysisComplete')}</h2>
                <p className="text-brand-text-secondary max-w-3xl mx-auto">{result.overallSummary}</p>
            </div>
            
            <PerformanceGradeCard result={result} formatCurrency={formatCurrency} />

            <TagPerformanceAnalysis result={result} formatCurrency={formatCurrency} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InsightTopicCard 
                    title={t('aiInsights.topics.risk')} 
                    icon={TOPIC_ICONS.risk} 
                    insights={groupedInsights.risk} 
                />
                <InsightTopicCard 
                    title={t('aiInsights.topics.timing')} 
                    icon={TOPIC_ICONS.timing} 
                    insights={groupedInsights.timing} 
                />
            </div>
             <InsightTopicCard 
                title={t('aiInsights.topics.strategy')} 
                icon={TOPIC_ICONS.strategy} 
                insights={groupedInsights.strategy} 
            />
        </div>
    );
};


const AIAnalysisView: React.FC<{ trades: Trade[] }> = ({ trades }) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            // 1. Always run offline analysis for metrics and hard data to ensure accuracy
            const offlineResult = analyzeTradesOffline(trades, t, formatCurrency);
            let finalResult = offlineResult;

            try {
                // 2. Attempt to enhance with Gemini AI insights
                // Note: The AI might fail if no API key is present or network issues occur
                const aiResult = await analyzeTradingPerformance(trades);
                
                // Merge AI insights with hard metrics
                finalResult = {
                    ...offlineResult,
                    ...aiResult,
                    // Preserve metrics derived from offline analysis as they are mathematically precise
                    keyMetrics: offlineResult.keyMetrics,
                    performanceGrade: offlineResult.performanceGrade,
                    tagPerformance: offlineResult.tagPerformance,
                };
            } catch (aiError) {
                console.warn("AI Analysis failed or not available, falling back to offline analysis.", aiError);
                // No action needed, finalResult is already offlineResult
            }

            setAnalysisResult(finalResult);
        } catch (e) {
             setError(e instanceof Error ? e.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    }, [trades, t, formatCurrency]);

    const canAnalyze = trades.length >= MIN_TRADES_FOR_ANALYSIS;
    
    const initialDesc = t('aiInsights.initialDesc');

    return (
        <div className="space-y-6">
            <div className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4">
                <div>
                    <h2 className="text-xl font-bold text-brand-text-primary tracking-tight">{t('aiInsights.title')}</h2>
                    <p className="text-sm text-brand-text-secondary">{t('aiInsights.subtitle')}</p>
                </div>
            </div>
            
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                {isLoading ? (
                    <LoadingState />
                ) : error ? (
                    <div className="empty-state-container max-w-md">
                        <AlertTriangle size={48} className="text-brand-loss" />
                        <h3 className="font-semibold text-brand-text-primary text-lg">{t('aiInsights.errorTitle')}</h3>
                        <p className="mt-1 text-sm text-brand-text-secondary">{error}</p>
                        <button
                            onClick={handleAnalyze}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-accent hover:bg-indigo-500 rounded-lg shadow-soft transition-all active:scale-95"
                        >
                            {t('aiInsights.tryAgain')}
                        </button>
                    </div>
                ) : analysisResult ? (
                    <AnalysisResults result={analysisResult} formatCurrency={formatCurrency} />
                ) : (
                    <div className="text-center space-y-4 max-w-xl">
                        <BrainCircuit size={64} className="mx-auto text-brand-accent" />
                        <h3 className="text-2xl font-bold text-brand-text-primary">{t('aiInsights.initialTitle')}</h3>
                        <p className="text-brand-text-secondary">{initialDesc}</p>
                        {!canAnalyze && (
                             <p className="text-sm text-brand-accent font-medium mt-4">{t('aiInsights.notEnoughTrades', { required: MIN_TRADES_FOR_ANALYSIS, current: trades.length })}</p>
                        )}
                        <button
                            onClick={handleAnalyze}
                            disabled={!canAnalyze}
                            className="mt-4 inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-brand-accent hover:bg-indigo-500 rounded-xl shadow-soft transition-all duration-300 active:scale-95 transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <BrainCircuit size={20} />
                            {t('aiInsights.analyzeButton')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnalysisView;
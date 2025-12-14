import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { Database, Upload, AlertTriangle, FileJson, FileText, CheckCircle, Loader2, Palette, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useTradesContext } from '../contexts/TradesContext';
import { useNotification } from '../contexts/NotificationContext';
import { isValidTradeData, parseMt4Trades, parseMt5Trades } from '../utils/importUtils';
import { clearTradesDB, set } from '../utils/db';
import ColorPicker from './ColorPicker';
import { useAppColors } from '../contexts/ColorContext';
import { useCurrency, AVAILABLE_CURRENCIES } from '../contexts/CurrencyContext';

interface DataManagementProps {}

const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const DataManagement: React.FC<DataManagementProps> = () => {
    const { trades, importTrades } = useTradesContext();
    const { chartColors, setCustomColors, resetColors } = useAppColors();
    const { currency, setCurrency } = useCurrency();
    const { showNotification } = useNotification();
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [tradesToImport, setTradesToImport] = useState<Trade[] | null>(null);
    const [importSource, setImportSource] = useState<'backup' | 'report' | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportJson = () => {
        const jsonString = JSON.stringify(trades, null, 2);
        const fileName = `trade-journal-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
        downloadFile(jsonString, fileName, 'application/json');
        showNotification(t('notifications.backupExported'), 'success');
        setIsMenuOpen(false);
    };

    const handleImportClick = (source: 'backup' | 'report') => {
        setImportSource(source);
        if (fileInputRef.current) {
            fileInputRef.current.accept = source === 'backup' ? '.json' : '.html,.htm,.xlsx';
            fileInputRef.current.click();
        }
        setIsMenuOpen(false);
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        const reader = new FileReader();

        const processData = (data: Trade[]) => {
            setTradesToImport(data);
            setIsConfirmModalOpen(true);
            setIsLoading(false);
        };
        const handleError = (error: unknown) => {
            showNotification(error instanceof Error ? error.message : "An unknown error occurred.", 'error');
            setIsLoading(false);
        };

        if (importSource === 'backup') {
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (!isValidTradeData(data)) throw new Error(t('errors.invalidBackup'));
                    processData(data);
                } catch (error) { handleError(error); }
            };
            reader.readAsText(file);
        } else if (importSource === 'report') {
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
                reader.onload = (e) => {
                    try { processData(parseMt4Trades(e.target?.result as string)); }
                    catch (error) { handleError(error); }
                };
                reader.readAsText(file);
            } else if (fileName.endsWith('.xlsx')) {
                reader.onload = (e) => {
                    try { processData(parseMt5Trades(e.target?.result as ArrayBuffer)); }
                    catch (error) { handleError(error); }
                };
                reader.readAsArrayBuffer(file);
            } else {
                handleError(new Error(t('errors.unsupportedFile')));
            }
        }
        event.target.value = ''; // Reset file input
    };

    const handleConfirmImport = () => {
        if (tradesToImport) {
            importTrades(tradesToImport);
            showNotification(t('notifications.tradesImported', { count: tradesToImport.length }), 'success');
        }
        setIsConfirmModalOpen(false);
        setTradesToImport(null);
    };

    const handleResetApp = () => {
        setIsMenuOpen(false);
        setIsResetConfirmOpen(true);
    };

    const handleConfirmReset = async () => {
        try {
            await clearTradesDB();
            await set('suggestedPairs', []);
            await set('pnlGoal', 0);
            await set('appColors', null);
            await set('userCurrency', 'USD');

            localStorage.removeItem('theme');
            localStorage.removeItem('i18nextLng');

            setIsResetConfirmOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("Failed to reset app data:", error);
            showNotification("Failed to reset application data.", 'error');
        }
    };
    
    const modalTitle = importSource === 'backup' ? t('dataManagement.overwriteData') : t('dataManagement.confirmImport');
    const modalIcon = importSource === 'backup' 
        ? <AlertTriangle className="h-6 w-6 text-brand-accent" />
        : <CheckCircle className="h-6 w-6 text-brand-profit" />;
    const modalButtonText = importSource === 'backup' ? t('dataManagement.overwriteData') : t('actions.import');
    
    return (
        <>
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(p => !p)} 
                    className="p-3 rounded-xl hover:bg-brand-surface-light bg-brand-surface border border-brand-border-soft shadow-elevation-medium backdrop-blur-md transition-all active:scale-95 text-brand-text-secondary"
                    aria-haspopup="true" aria-expanded={isMenuOpen} aria-label={t('dataManagement.ariaLabel')}
                >
                    <Database size={22} />
                </button>

                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-brand-surface-opaque/90 border border-brand-border backdrop-blur-2xl rounded-xl shadow-soft-lg animate-menu-slide z-50 p-2 overflow-y-auto max-h-[80vh] stagger-list">
                        <div className="space-y-1">
                            <div>
                                <p className="px-3 py-1.5 text-xs font-semibold text-brand-text-secondary">{t('actions.export')}</p>
                                <button onClick={handleExportJson} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-brand-surface-light text-sm transition-colors"><FileJson size={16} /> {t('dataManagement.exportBackup')}</button>
                            </div>
                            <div className="my-1 border-t border-brand-border-soft"></div>
                            <div>
                                <p className="px-3 py-1.5 text-xs font-semibold text-brand-text-secondary">{t('actions.import')}</p>
                                <button onClick={() => handleImportClick('report')} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-brand-surface-light text-sm transition-colors"><FileText size={16} /> {t('dataManagement.importReport')}</button>
                                <button onClick={() => handleImportClick('backup')} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-brand-surface-light text-sm transition-colors"><Upload size={16} /> {t('dataManagement.restoreBackup')}</button>
                            </div>
                            <div className="my-1 border-t border-brand-border-soft"></div>
                            
                            {/* Color Settings */}
                            <div>
                                <p className="px-3 py-1.5 text-xs font-semibold text-brand-text-secondary flex items-center gap-2"><Palette size={14}/> {t('dataManagement.colorSettings')}</p>
                                <div className="px-3 py-1 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-brand-text-primary">{t('dataManagement.profitColor')}</label>
                                        <ColorPicker color={chartColors.profit} onChange={newColor => setCustomColors({ profit: newColor })} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-brand-text-primary">{t('dataManagement.lossColor')}</label>
                                        <ColorPicker color={chartColors.loss} onChange={newColor => setCustomColors({ loss: newColor })} />
                                    </div>
                                    <button onClick={resetColors} className="w-full text-center text-sm font-semibold text-brand-accent hover:underline py-1 rounded-md mt-1 transition-colors">
                                        {t('actions.resetToDefault')}
                                    </button>
                                </div>
                            </div>

                            <div className="my-1 border-t border-brand-border-soft"></div>
                            
                            {/* Currency Settings */}
                            <div>
                                <p className="px-3 py-1.5 text-xs font-semibold text-brand-text-secondary flex items-center gap-2"><DollarSign size={14}/> Currency</p>
                                <div className="px-3 py-1">
                                    <select 
                                        value={currency} 
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full bg-brand-surface-light border border-brand-border-soft rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-shadow"
                                    >
                                        {AVAILABLE_CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="my-1 border-t border-brand-border-soft"></div>
                            <button onClick={handleResetApp} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm text-brand-loss hover:bg-brand-loss/10 transition-colors"><AlertTriangle size={16} /> {t('dataManagement.resetApp')}</button>
                        </div>
                    </div>
                )}
                
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                {isConfirmModalOpen && tradesToImport && (
                     <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-brand-surface/80 backdrop-blur-xl border border-brand-border rounded-xl shadow-soft-lg p-6 max-w-sm text-center animate-scale-in">
                            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${importSource === 'backup' ? 'bg-brand-accent/20' : 'bg-brand-profit/20'}`}>{modalIcon}</div>
                            <h3 className="text-lg font-bold text-brand-text-primary mt-4">{modalTitle}</h3>
                            <p className="text-brand-text-secondary my-3 text-sm">
                              {importSource === 'backup' 
                                ? t('dataManagement.overwriteDataMsg', { currentCount: trades.length, importCount: tradesToImport.length })
                                : t('dataManagement.confirmImportMsg', { count: tradesToImport.length })
                              }
                            </p>
                            <div className="flex justify-center gap-4 mt-6">
                                <button onClick={() => setIsConfirmModalOpen(false)} className="bg-brand-surface-light hover:bg-brand-border font-bold py-2 px-6 rounded-md">{t('actions.cancel')}</button>
                                <button onClick={handleConfirmImport} className={`${importSource === 'backup' ? 'bg-brand-loss hover:bg-red-500' : 'bg-brand-accent hover:bg-indigo-500'} text-white font-bold py-2 px-6 rounded-md`}>{modalButtonText}</button>
                            </div>
                        </div>
                     </div>
                )}

                {isResetConfirmOpen && (
                     <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[51] p-4">
                        <div className="bg-brand-surface/80 backdrop-blur-xl border border-brand-border rounded-xl shadow-soft-lg p-6 max-w-sm text-center animate-scale-in">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-loss/20"><AlertTriangle className="h-6 w-6 text-brand-loss" /></div>
                            <h3 className="text-lg font-bold text-brand-text-primary mt-4">{t('dataManagement.resetAppConfirm')}</h3>
                            <p className="text-brand-text-secondary my-3 text-sm">{t('dataManagement.resetAppConfirmMsg')}</p>
                            <div className="flex justify-center gap-4 mt-6">
                                <button onClick={() => setIsResetConfirmOpen(false)} className="bg-brand-surface-light hover:bg-brand-border font-bold py-2 px-6 rounded-md">{t('actions.cancel')}</button>
                                <button onClick={handleConfirmReset} className="bg-brand-loss hover:bg-red-500 text-white font-bold py-2 px-6 rounded-md">{t('actions.confirm')} {t('actions.reset')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {isLoading && (
                 <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center z-[99] p-4 animate-fade-in">
                    <div className="flex items-center gap-3 bg-brand-surface/80 backdrop-blur-lg border border-brand-border rounded-xl shadow-soft-lg p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="font-semibold text-brand-text-primary">{t('dataManagement.processingFile')}</span>
                    </div>
                 </div>
            )}
        </>
    );
};

export default React.memo(DataManagement);
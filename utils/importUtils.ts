import { Trade, TradeTags } from '../types';
import { format } from 'date-fns';

declare var XLSX: any;

/**
 * Validates if the provided data is a valid array of Trade objects.
 * This function is crucial for ensuring data integrity when importing from backups.
 * It now supports both the old tag format (string[]) and the new format (TradeTags object).
 * @param data The data to validate.
 * @returns A boolean indicating if the data is valid.
 */
export const isValidTradeData = (data: any): data is Trade[] => {
    if (!Array.isArray(data)) return false;
    // An empty array is a valid import (e.g., to clear data).
    if (data.length === 0) return true;

    for (const item of data) {
        if (typeof item !== 'object' || item === null) return false;

        const hasRequiredFields = 
            typeof item.id === 'string' &&
            typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
            typeof item.time === 'string' && /^\d{2}:\d{2}$/.test(item.time) &&
            typeof item.pair === 'string' &&
            typeof item.pnl === 'number';

        if (!hasRequiredFields) return false;
        
        // Validate optional fields
        if (item.type !== undefined && item.type !== 'long' && item.type !== 'short') return false;
        if (item.notes !== undefined && typeof item.notes !== 'string') return false;
        if (item.photos !== undefined && (!Array.isArray(item.photos) || !item.photos.every((p: any) => typeof p === 'string'))) return false;
        
        // Validate tags, accepting both old and new formats for backward compatibility.
        if (item.tags !== undefined) {
            if (Array.isArray(item.tags)) { // Old format: string[]
                if (!item.tags.every((t: any) => typeof t === 'string')) return false;
            } else if (typeof item.tags === 'object' && item.tags !== null) { // New format: TradeTags
                // Check if all values in the tags object are either string or string[].
                for (const key in item.tags) {
                    const value = item.tags[key as keyof TradeTags];
                    if (value === undefined) continue;
                    const isArrayOfStrings = Array.isArray(value) && value.every(v => typeof v === 'string');
                    const isString = typeof value === 'string';
                    if (!isArrayOfStrings && !isString) return false;
                }
            } else {
                return false; // Invalid type for tags
            }
        }
    }
    return true;
};

export const parsePnlString = (pnlStr: string | null | undefined): number => {
    if (!pnlStr) return 0;
    let cleanStr = pnlStr.trim();
    const isAccountingNegative = cleanStr.startsWith('(') && cleanStr.endsWith(')');
    if (isAccountingNegative) cleanStr = '-' + cleanStr.substring(1, cleanStr.length - 1);
    cleanStr = cleanStr.replace(/[^0-9.,-]/g, '');
    const lastComma = cleanStr.lastIndexOf(',');
    const lastPeriod = cleanStr.lastIndexOf('.');
    if (lastComma > lastPeriod) cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    else cleanStr = cleanStr.replace(/,/g, '');
    const pnl = parseFloat(cleanStr);
    return isNaN(pnl) ? 0 : pnl;
};

export const parseMt4Trades = (htmlString: string): Trade[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    let table: HTMLTableElement | null = null;
    const possibleTableHeaders = ['closed transactions', 'closed trades', 'account history'];
    const headerElement = Array.from(doc.querySelectorAll('body *')).find(el => 
        possibleTableHeaders.some(h => el.textContent?.trim().toLowerCase().includes(h))
    );
    if (headerElement) {
        table = headerElement.closest('table');
    }
    
    const headerKeywords = ['ticket', 'open time', 'type', 'symbol', 'profit'];
    if (!table) {
        table = Array.from(doc.querySelectorAll('table')).find(t => {
            return Array.from(t.querySelectorAll('tr')).some(r => {
                const cells = Array.from(r.querySelectorAll('td, th')).map(c => c.textContent?.trim().toLowerCase() || '');
                return headerKeywords.filter(k => cells.some(c => c.includes(k))).length >= 3;
            });
        }) || null;
    }

    if (!table) {
        throw new Error("Could not find a valid trades table. The report format may be unsupported.");
    }
    
    const rows = Array.from(table.querySelectorAll('tr'));
    
    let headerRowIndex = -1;
    const columnIndexMap: { [key: string]: number } = {};

    for (let i = 0; i < rows.length; i++) {
        const potentialHeaderCells = Array.from(rows[i].querySelectorAll('td, th'));
        const headers = potentialHeaderCells.map(c => c.textContent?.trim().toLowerCase() || '');
        
        const openTimeIndex = headers.findIndex(h => h.includes('open time'));
        const typeIndex = headers.findIndex(h => h.includes('type'));
        const symbolIndex = headers.findIndex(h => h.includes('symbol'));
        const profitIndex = headers.findIndex(h => h.includes('profit'));

        if (openTimeIndex > -1 && typeIndex > -1 && symbolIndex > -1 && profitIndex > -1) {
            headerRowIndex = i;
            columnIndexMap['openTime'] = openTimeIndex;
            columnIndexMap['type'] = typeIndex;
            columnIndexMap['symbol'] = symbolIndex;
            columnIndexMap['profit'] = profitIndex;
            break;
        }
    }

    if (headerRowIndex === -1) {
        throw new Error("Could not find the header row in the trades table. Required columns: Open Time, Type, Symbol, Profit.");
    }

    const importedTrades: Trade[] = [];

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length < 4 || cells[0]?.colSpan > 5) continue;
        
        const type = (cells[columnIndexMap['type']]?.textContent || '').trim().toLowerCase();
        
        // Skip non-trade rows (deposits, etc.)
        if (type !== 'buy' && type !== 'sell') continue;
        
        try {
            const dateTimeString = cells[columnIndexMap['openTime']]?.textContent?.trim() || '';
            const [datePart, timePart] = dateTimeString.split(' ');
            if (!datePart || !timePart) continue;

            const date = datePart.replace(/[.\/]/g, '-');
            const time = timePart.substring(0, 5);
            
            const pair = (cells[columnIndexMap['symbol']]?.textContent || '').trim().toUpperCase();
            const pnl = parsePnlString(cells[columnIndexMap['profit']]?.textContent);
            
            if (pnl === 0 || !pair) continue;
            
            importedTrades.push({
                id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
                date, time, pair, pnl, type: type === 'buy' ? 'long' : 'short', notes: '', photos: [], tags: {}
            });
        } catch (e) {
            console.warn("Skipping a row in HTML report due to parsing error:", e, { rowHTML: rows[i].innerHTML });
        }
    }
    
    if (importedTrades.length === 0) {
        throw new Error("No valid 'buy' or 'sell' trades were found in the report.");
    }

    return importedTrades;
};

export const parseMt5Trades = (fileBuffer: ArrayBuffer): Trade[] => {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in the XLSX file.");
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
    
    let positionsStartIndex = rows.findIndex(r => (r[0] || '').toString().trim().toLowerCase().includes('positions'));
    if (positionsStartIndex === -1) throw new Error("Could not find the 'Positions' section in the report.");
    
    let positionsEndIndex = rows.findIndex((r, i) => i > positionsStartIndex && ['orders', 'deals', 'summary'].some(h => (r[0] || '').toString().trim().toLowerCase().includes(h)));
    if (positionsEndIndex === -1) positionsEndIndex = rows.length;
    
    let headerRowIndex = -1;
    let header: string[] = [];
    const requiredKeywords = [['time', 'open time'], ['symbol', 'item'], ['type'], ['profit', 'p/l', 'p&l']];

    for(let i = positionsStartIndex; i < positionsEndIndex; i++) {
        const potentialHeader = rows[i].map(cell => String(cell || '').trim().toLowerCase());
        if (requiredKeywords.every(aliases => aliases.some(alias => potentialHeader.includes(alias)))) {
            headerRowIndex = i;
            header = potentialHeader;
            break;
        }
    }
    if (headerRowIndex === -1) throw new Error("Could not locate the header row within the 'Positions' section. Please ensure it contains Time, Symbol, Type, and Profit columns.");

    const dataRows = rows.slice(headerRowIndex + 1, positionsEndIndex);
    
    const findIndex = (aliases: string[]) => header.findIndex(h => aliases.includes(h));
    const timeColIndex = findIndex(['time', 'open time']);
    const symbolColIndex = findIndex(['symbol', 'item']);
    const typeColIndex = findIndex(['type']);
    const profitColIndex = findIndex(['profit', 'p/l', 'p&l']);
    const commentColIndex = findIndex(['comment']);

    const importedTrades: Trade[] = [];
    dataRows.forEach((row, index) => {
        if (row.length < header.length / 2 || row.every(cell => !cell)) return;
        
        const type = String(row[typeColIndex] || '').trim().toLowerCase();
        const comment = commentColIndex !== -1 ? String(row[commentColIndex] || '').trim().toLowerCase() : '';
        if (['balance', 'deposit', 'withdrawal'].some(word => type.includes(word) || comment.includes(word)) || (type !== 'buy' && type !== 'sell')) return;

        try {
            const d = new Date(String(row[timeColIndex] || '').replace(/\./g, '/'));
            if (isNaN(d.getTime())) return;
            const date = format(d, 'yyyy-MM-dd');
            const time = format(d, 'HH:mm');
            const pair = String(row[symbolColIndex] || '').trim().toUpperCase();
            const pnl = parsePnlString(String(row[profitColIndex] || '0'));
            if (pnl === 0 || !pair) return;
            importedTrades.push({
                id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
                date, time, pair, pnl, type: type === 'buy' ? 'long' : 'short', notes: '', photos: [], tags: {}
            });
        } catch (e) {
            console.warn("Skipping a row in XLSX report due to parsing error:", e, { rowData: row });
        }
    });

    if (importedTrades.length === 0) {
        throw new Error("No valid 'buy' or 'sell' trades were found in the 'Positions' section.");
    }
    return importedTrades;
};
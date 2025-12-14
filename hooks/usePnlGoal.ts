import { useState, useEffect, useCallback } from 'react';
import { get, set } from '../utils/db';

const STORAGE_KEY = 'pnlGoal';

export const usePnlGoal = () => {
  const [pnlGoal, setPnlGoal] = useState<number>(0);

  useEffect(() => {
    get<number>(STORAGE_KEY).then(storedGoal => {
        if (storedGoal) {
            setPnlGoal(storedGoal);
        }
    }).catch(error => {
        console.error("Failed to load P&L goal from DB", error);
    });
  }, []);

  const handleSetPnlGoal = useCallback((goal: number) => {
    const newGoal = Math.max(0, goal);
    setPnlGoal(newGoal);
    set(STORAGE_KEY, newGoal).catch(error => {
        console.error("Failed to save P&L goal to DB", error);
    });
  }, []);
  
  return { pnlGoal, setPnlGoal: handleSetPnlGoal };
};
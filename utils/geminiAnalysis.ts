import { GoogleGenAI, Type } from '@google/genai';
import { Trade, AIAnalysisResult } from '../types';

const MIN_TRADES_FOR_ANALYSIS = 20;
const MAX_TRADES_FOR_ANALYSIS = 5000; // Safety limit for performance and memory

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: {
            type: Type.STRING,
            description: "A brief, high-level overview of the trading performance, written in an encouraging tone."
        },
        strengths: {
            type: Type.ARRAY,
            description: "A list of 3-5 key strengths identified from the data. These should be specific and data-backed.",
            items: { type: Type.STRING }
        },
        weaknesses: {
            type: Type.ARRAY,
            description: "A list of 3-5 key weaknesses or areas for improvement. Phrase these constructively.",
            items: { type: Type.STRING }
        },
        actionableInsights: {
            type: Type.ARRAY,
            description: "A list of 2-4 specific, actionable insights. Each insight should identify a pattern and suggest a concrete recommendation.",
            items: {
                type: Type.OBJECT,
                properties: {
                    pattern: {
                        type: Type.STRING,
                        description: "A clear description of a recurring pattern observed in the trades (e.g., 'Losing trades on Fridays are often tagged with FOMO')."
                    },
                    recommendation: {
                        type: Type.STRING,
                        description: "A specific, actionable recommendation to address the pattern (e.g., 'Consider implementing a pre-trade checklist on Fridays to avoid impulsive entries.')."
                    },
                    relatedTags: {
                        type: Type.ARRAY,
                        description: "A list of tags that are most relevant to this pattern.",
                        items: { type: Type.STRING }
                    }
                },
                required: ['pattern', 'recommendation', 'relatedTags']
            }
        },
        keyObservations: {
            type: Type.ARRAY,
            description: "A list of 2-3 other interesting observations or potential correlations that might be useful to the trader.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { 
                        type: Type.STRING,
                        description: "A single, concise observation."
                    },
                    topic: {
                        type: Type.STRING,
                        description: "The general topic of the observation. Can be 'risk', 'timing', 'strategy', 'consistency', or 'general'."
                    }
                },
                required: ['text', 'topic']
            }
        }
    },
    required: ['overallSummary', 'strengths', 'weaknesses', 'actionableInsights', 'keyObservations']
};

export const analyzeTradingPerformance = async (trades: Trade[]): Promise<Partial<AIAnalysisResult>> => {
    if (trades.length < MIN_TRADES_FOR_ANALYSIS) {
        throw new Error(`A minimum of ${MIN_TRADES_FOR_ANALYSIS} trades is required for a meaningful analysis.`);
    }

    // Sanitize and simplify data for the model to reduce token count and improve focus
    const simplifiedTrades = trades.slice(0, MAX_TRADES_FOR_ANALYSIS).map(trade => ({
        pnl: trade.pnl,
        pair: trade.pair,
        type: trade.type,
        rating: trade.rating,
        // Get day of week: 0 for Sunday, 1 for Monday, etc.
        dayOfWeek: new Date(trade.date + 'T00:00:00').getDay(),
        tags: trade.tags ? Object.entries(trade.tags).map(([key, value]) => {
            if (Array.isArray(value)) {
                return value.map(v => `${key}:${v}`);
            }
            return `${key}:${value}`;
        }).flat() : []
    }));

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `You are an expert trading coach and performance analyst. Your task is to analyze a list of trades provided as JSON data and identify key patterns, strengths, weaknesses, and provide actionable recommendations for improvement. You must be objective, data-driven, and encouraging. Focus on psychological and strategic aspects of trading based on the provided tags (emotions, mistakes, strategy, etc.). The user is trying to improve their trading discipline and profitability. All monetary values are in USD. The 'dayOfWeek' is represented as a number where Sunday is 0, Monday is 1, and so on. Your analysis should be returned in the specified JSON format.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Here is the trading data: ${JSON.stringify(simplifiedTrades)}. Please analyze this data and provide your insights.`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    const jsonString = response.text.trim();
    try {
        const result = JSON.parse(jsonString);
        return result as Partial<AIAnalysisResult>;
    } catch (e) {
        console.error("Failed to parse Gemini response:", e, "Raw response:", jsonString);
        throw new Error("The AI returned an unexpected response format. Please try again.");
    }
};
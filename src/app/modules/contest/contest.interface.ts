import { Types, Document } from "mongoose";
export type CoinLite = { id: string; symbol: string; name: string };
export const COMMON: Record<string, string> = {
    btc: 'bitcoin',
    xbt: 'bitcoin',
    eth: 'ethereum',
    sol: 'solana',
    bnb: 'binancecoin',
    xrp: 'ripple',
    ada: 'cardano',
    doge: 'dogecoin',
    trx: 'tron',
    matic: 'polygon',
    avax: 'avalanche-2',
    dot: 'polkadot',
    ltc: 'litecoin',
    link: 'chainlink',
    uni: 'uniswap',
    atom: 'cosmos',
};
export type US_STATES =
    | "Alabama" | "Alaska" | "Arizona" | "Arkansas" | "California" | "Colorado" | "Connecticut"
    | "Delaware" | "Florida" | "Georgia" | "Hawaii" | "Idaho" | "Illinois" | "Indiana" | "Iowa"
    | "Kansas" | "Kentucky" | "Louisiana" | "Maine" | "Maryland" | "Massachusetts" | "Michigan"
    | "Minnesota" | "Mississippi" | "Missouri" | "Montana" | "Nebraska" | "Nevada" | "New Hampshire"
    | "New Jersey" | "New Mexico" | "New York" | "North Carolina" | "North Dakota" | "Ohio" | "Oklahoma"
    | "Oregon" | "Pennsylvania" | "Rhode Island" | "South Carolina" | "South Dakota" | "Tennessee"
    | "Texas" | "Utah" | "Vermont" | "Virginia" | "Washington" | "West Virginia" | "Wisconsin" | "Wyoming";

export interface IGeneratedPrediction {
    value: number;
    tierId: string;
    price: number;
    currentEntries: number;
    maxEntries: number;
    isAvailable: boolean;
}
export interface IPrediction {
    minPrediction: number;
    maxPrediction: number;
    increment: number;
    unit: string;
    numberOfEntriesPerPrediction: number;
    generatedPredictions: IGeneratedPrediction[];
    placePercentages: Map<string, number>;
}
export interface IPricing {
    predictionType: 'percentage' | 'tier' | 'priceOnly';
    flatPrice: number;
    minTierPrice: number;
    maxTierPrice: number;
    tiers: IPredictionTier[];

}
export interface IPredictionTier {
    id: string;
    name: string; // "118k - 118.5k"
    min: number;  // 118000
    max: number;  // 118500
    pricePerPrediction: number;
    isActive: boolean;
}
export interface IContestMetadata {
    cryptoId?: string; // e.g., 'bitcoin', 'ethereum'
    // For stock contests
    stockSymbol?: string; // e.g., 'AAPL', 'GOOGL'
    // For sports contests
    playerId?: string;
    gameId?: string;
    league?: string; // 'nfl', 'nba', 'mlb'
    statType?: string; // 'points', 'yards', 'touchdowns', etc.
    // For economic contests
    economicSeries?: string; // e.g., 'CPIAUCSL', 'GDP'
    // For entertainment contests
    movieId?: string;
    videoId?: string;
    metricType?: string; // 'revenue', 'views', 'rating'
    // Generic
    dataSource?: string; // For documentation purposes
    resultUnit?: string; // e.g., 'USD', 'percentage', 'count'
}
export interface IContest extends Document {
    name: string;
    serial: number;
    category: string;
    categoryId: Types.ObjectId;
    description: string;
    state: US_STATES[];
    prize: {
        title: string;
        type: string;
        prizePool: number;
    };
    predictions: IPrediction;
    pricing: IPricing;
    startTime: Date;
    endTime: Date;
    image?: string;
    endOffsetTime: Date;
    status: 'Draft' | 'Published' | 'Active' | 'Deleted' | 'Completed';
    totalEntries: number;
    maxEntries?: number;
    createdBy?: Types.ObjectId;
    popularity: number;
    metadata?: IContestMetadata;
    results: {
        actualValue: number;
        winningPredictions: Types.ObjectId[];
        prizeDistributed: boolean;
        endedAt: Date;
    };

    // Instance methods
    generatePredictions(): Promise<this>;
    updatePredictionEntries(predictionValue: number): Promise<this>;
    getPriceForPrediction(predictionValue: number): number;
    getAvailablePredictions(): IGeneratedPrediction[];
    getTotalCostForPredictions(predictionValues: number[]): number;
}


export interface UnifiedForecastResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        category: 'crypto' | 'stock' | 'economic' | 'energy' | 'sports' | 'entertainment';
        asset: string;                    // Asset name (Bitcoin, AAPL, etc)
        currentValue: number;              // Current price/value
        previousValue?: number;            // Previous price/value
        changeAmount?: number;             // Absolute change
        changePercent: number;             // Percentage change
        unit: string;                      // USD, points, yards, etc
        timestamp: string;                 // ISO date string
        metadata: {
            source: string;                // API source name
            period?: string;               // Time period (24h, 7d, etc)
            additionalInfo?: any;          // Category-specific extra data
        };
        history?: Array<{                  // Historical data (if requested)
            timestamp: string;
            value: number;
            [key: string]: any;            // Allow extra fields
        }>;
    };
}
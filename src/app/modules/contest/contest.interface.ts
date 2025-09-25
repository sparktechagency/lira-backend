import { Types, Document } from "mongoose";

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
    currentEntries: number;
    maxEntries: number;
    isAvailable: boolean;
}

export interface IPredictionTier {
    id: string;
    name: string; // "118k - 118.5k"
    min: number;  // 118000
    max: number;  // 118500
    pricePerPrediction: number;
    isActive: boolean;
}

export interface IContest extends Document {
    name: string;
    category: string;
    categoryId: Types.ObjectId;
    description: string;
    state: US_STATES[];
    
    prize: {
        title: string;
        type: string;
    };
    
    predictions: {
        increment: number;
        unit: string;
        numberOfEntriesPerPrediction: number;
        placePercentages: Map<string, number>;
        predictionType?: string;
        dataSource?: string;
        tiers: IPredictionTier[];
        generatedPredictions?: IGeneratedPrediction[];
    };
    
    startTime: Date;
    endTime: Date;
    
    image?: string;
    status: 'Draft' | 'Published' | 'Active' | 'Deleted';
    
    totalEntries: number;
    maxEntries?: number;
    createdBy?: Types.ObjectId;
    
    results?: {
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
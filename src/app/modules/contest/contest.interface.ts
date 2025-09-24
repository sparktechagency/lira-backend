import { Types } from "mongoose";
// State
export type US_STATES =
    | "Alabama" | "Alaska" | "Arizona" | "Arkansas" | "California" | "Colorado" | "Connecticut"
    | "Delaware" | "Florida" | "Georgia" | "Hawaii" | "Idaho" | "Illinois" | "Indiana" | "Iowa"
    | "Kansas" | "Kentucky" | "Louisiana" | "Maine" | "Maryland" | "Massachusetts" | "Michigan"
    | "Minnesota" | "Mississippi" | "Missouri" | "Montana" | "Nebraska" | "Nevada" | "New Hampshire"
    | "New Jersey" | "New Mexico" | "New York" | "North Carolina" | "North Dakota" | "Ohio" | "Oklahoma"
    | "Oregon" | "Pennsylvania" | "Rhode Island" | "South Carolina" | "South Dakota" | "Tennessee"
    | "Texas" | "Utah" | "Vermont" | "Virginia" | "Washington" | "West Virginia" | "Wisconsin" | "Wyoming";
export interface IPriceTier {
    min: number;
    max: number;
    pricePerPrediction: number;
}
// Pricing model types
export type PricingModel = "flat" | "tiered" | "tiered_percentage";
export interface IContest {
    name: string;
    category: string;
    categoryId: Types.ObjectId;
    description: string;
    state: US_STATES[];
    prize: {
        title: string;
        type: string;
    }
    predictions: {
        min: number;
        max: number;
        increment: number;
        unit: string;
        numberOfEntriesPerPrediction: number;
        predictionType?: string;
        dataSource?: string;
    };

    pricing: {
        model: PricingModel;
        flat?: number;
        tiered?: IPriceTier[];
        tieredPercentage?: IPriceTier[];
        currentPrice?: number;
        priceChange?: string;
        lastUpdated?: Date;
    }
    results?: {
        actualValue: number;
        winningPredictions: Types.ObjectId[];
        prizeDistributed: boolean;
        endedAt: Date;
    };
    startTime: Date;
    endTime: Date;
    endOffset: number;
    image: string;
    isActive: boolean;
    isDraft: boolean;
    totalEntries?: number;
    maxEntries?: number;
    createdBy?: Types.ObjectId;
}

// StateEnum
export enum StateEnum {
    ALABAMA = 'Alabama',
    ALASKA = 'Alaska',
    ARIZONA = 'Arizona',
    ARKANSAS = 'Arkansas',
    CALIFORNIA = 'California',
    COLORADO = 'Colorado',
    CONNECTICUT = 'Connecticut',
    DELAWARE = 'Delaware',
    FLORIDA = 'Florida',
    GEORGIA = 'Georgia',
    HAWAII = 'Hawaii',
    IDAHO = 'Idaho',
    ILLINOIS = 'Illinois',
    INDIANA = 'Indiana',
    IOWA = 'Iowa',
    KANSAS = 'Kansas',
    KENTUCKY = 'Kentucky',
    LOUISIANA = 'Louisiana',
    MAINE = 'Maine',
    MARYLAND = 'Maryland',
    MASSACHUSETTS = 'Massachusetts',
    MICHIGAN = 'Michigan',
    MINNESOTA = 'Minnesota',
    MISSISSIPPI = 'Mississippi',
    MISSOURI = 'Missouri',
    MONTANA = 'Montana',
    NEBRASKA = 'Nebraska',
    NEVADA = 'Nevada',
    NEW_HAMPSHIRE = 'New Hampshire',
    NEW_JERSEY = 'New Jersey',
    NEW_MEXICO = 'New Mexico',
    NEW_YORK = 'New York',
    NORTH_CAROLINA = 'North Carolina',
    NORTH_DAKOTA = 'North Dakota',
    OHIO = 'Ohio',
    OKLAHOMA = 'Oklahoma',
    OREGON = 'Oregon',
    PENNSYLVANIA = 'Pennsylvania',
    RHODE_ISLAND = 'Rhode Island',
    SOUTH_CAROLINA = 'South Carolina',
    SOUTH_DAKOTA = 'South Dakota',
    TENNESSEE = 'Tennessee',
    TEXAS = 'Texas',
    UTAH = 'Utah',
    VERMONT = 'Vermont',
    VIRGINIA = 'Virginia',
    WASHINGTON = 'Washington',
    WEST_VIRGINIA = 'West Virginia',
    WISCONSIN = 'Wisconsin',
    WYOMING = 'Wyoming'
}

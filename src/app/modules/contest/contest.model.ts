import mongoose, { Schema, Document, Types } from "mongoose";
import { IContest, IPriceTier } from "./contest.interface";

// State enum
export const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
    "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
    "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
] as const;


// Schemas
const PriceTierSchema = new Schema<IPriceTier>({
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    pricePerPrediction: { type: Number, required: true }
}, { _id: false });


const ContestSchema = new Schema<IContest>({
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    category: { 
        type: String, 
        required: true 
    },
    categoryId: { 
        type: Schema.Types.ObjectId, 
        ref: 'ContestCategory',
        required: true 
    },
    description: { 
        type: String, 
        required: true,
        trim: true 
    },
    state: [{ 
        type: String, 
        enum: US_STATES,
        required: true 
    }],
    
    prize: {
        title: { type: String, required: true },
        type: { type: String, required: true },
    },
    
    predictions: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
        increment: { type: Number, required: true },
        unit: { type: String, required: true },
        numberOfEntriesPerPrediction: { type: Number, default: 1 },
        predictionType: { type: String },
        dataSource: { type: String }
    },
    
    pricing: {
        model: { 
            type: String, 
            enum: ['flat', 'tiered', 'tiered_percentage'],
            required: true 
        },
        flat: { type: Number },
        tiered: [PriceTierSchema],
        tieredPercentage: [PriceTierSchema],
        currentPrice: { type: Number },
        priceChange: { type: String },
        lastUpdated: { type: Date }
    },
    
    startTime: { 
        type: Date, 
        required: true 
    },
    endTime: { 
        type: Date, 
        required: true 
    },
    endOffset: { type: Number },
    image: { type: String },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    isDraft: { 
        type: Boolean, 
        default: false 
    },
    totalEntries: { 
        type: Number, 
        default: 0 
    },
    maxEntries: { type: Number },
    
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    results: {
        actualValue: { type: Number },
        winningPredictions: [{ type: Schema.Types.ObjectId, ref: 'ContestEntry' }],
        prizeDistributed: { type: Boolean, default: false },
        endedAt: { type: Date }
    }
}, {
    timestamps: true
});



// Indexes
ContestSchema.index({ isActive: 1, startTime: 1 });
ContestSchema.index({ categoryId: 1 });
ContestSchema.index({ state: 1 });
ContestSchema.index({ endTime: 1 });
ContestSchema.index({ createdBy: 1 });







// Static methods
ContestSchema.statics.getActiveContests = function() {
    return this.find({ 
        isActive: true, 
        isDraft: false,
        startTime: { $lte: new Date() },
        endTime: { $gte: new Date() }
    }).populate('categoryId');
};

ContestSchema.statics.getUpcomingContests = function() {
    return this.find({ 
        isActive: true, 
        isDraft: false,
        startTime: { $gt: new Date() }
    }).populate('categoryId');
};

// Models
export const Contest = mongoose.model<IContest>('Contest', ContestSchema);

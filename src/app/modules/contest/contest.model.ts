import mongoose, { Schema } from "mongoose";
import { IContest, IGeneratedPrediction, IPredictionTier } from "./contest.interface";

const US_STATES_ARRAY = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
    "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
    "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
] as const;

const ContestSchema = new Schema<IContest>({
    name: {
        type: String,
        required: [true, 'Contest name is required'],
        trim: true,
        maxlength: [200, 'Contest name cannot exceed 200 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category ID is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    state: [{
        type: String,
        enum: {
            values: US_STATES_ARRAY,
            message: 'Invalid state provided'
        },
        required: true
    }],

    prize: {
        title: { 
            type: String, 
            required: [true, 'Prize title is required'] 
        },
        type: { 
            type: String, 
            required: [true, 'Prize type is required'] 
        }
    },

    predictions: {
        increment: { 
            type: Number, 
            required: [true, 'Increment is required'],
            min: [1, 'Increment must be at least 1']
        },
        unit: { 
            type: String, 
            required: [true, 'Unit is required'] 
        },
        numberOfEntriesPerPrediction: { 
            type: Number, 
            default: 1,
            min: [1, 'Number of entries must be at least 1']
        },
        placePercentages: {
            type: Map,
            of: Number,
            default: () => new Map()
        },
        predictionType: { type: String },
        dataSource: { type: String },
        tiers: [{
            id: { 
                type: String, 
                required: [true, 'Tier ID is required'] 
            },
            name: { 
                type: String, 
                required: [true, 'Tier name is required'] 
            },
            min: { 
                type: Number, 
                required: [true, 'Tier min value is required'] 
            },
            max: { 
                type: Number, 
                required: [true, 'Tier max value is required'] 
            },
            pricePerPrediction: { 
                type: Number, 
                required: [true, 'Price per prediction is required'],
                min: [0, 'Price cannot be negative']
            },
            isActive: { 
                type: Boolean, 
                default: true 
            }
        }],
        generatedPredictions: [{
            value: { 
                type: Number, 
                required: [true, 'Prediction value is required'] 
            },
            tierId: { 
                type: String, 
                required: [true, 'Tier ID is required'] 
            },
            currentEntries: { 
                type: Number, 
                default: 0,
                min: [0, 'Current entries cannot be negative']
            },
            maxEntries: { 
                type: Number, 
                required: [true, 'Max entries is required'],
                min: [1, 'Max entries must be at least 1']
            },
            isAvailable: { 
                type: Boolean, 
                default: true 
            }
        }]
    },

    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },

    image: { type: String },

    status: {
        type: String,
        enum: ['Draft', 'Published', 'Active', 'Deleted'],
        default: 'Draft'
    },

    totalEntries: {
        type: Number,
        default: 0,
        min: [0, 'Total entries cannot be negative']
    },
    maxEntries: { 
        type: Number,
        min: [1, 'Max entries must be at least 1']
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    results: {
        actualValue: { type: Number },
        winningPredictions: [{ 
            type: Schema.Types.ObjectId, 
            ref: 'ContestEntry' 
        }],
        prizeDistributed: { 
            type: Boolean, 
            default: false 
        },
        endedAt: { type: Date , default: null}
    }
}, {
    timestamps: true
});

// Indexes for performance
ContestSchema.index({ isActive: 1, isDraft: 1, startTime: 1 });
ContestSchema.index({ categoryId: 1 });
ContestSchema.index({ createdBy: 1 });
ContestSchema.index({ endTime: 1 });

// Pre-save validation
ContestSchema.pre('save', function(next) {
    // Validate end time is after start time
    if (this.endTime <= this.startTime) {
        return next(new Error('End time must be after start time'));
    }
    
    // Validate tiers don't overlap and are in correct order
    const sortedTiers = this.predictions.tiers
        .filter(tier => tier.isActive)
        .sort((a, b) => a.min - b.min);
        
    for (let i = 0; i < sortedTiers.length - 1; i++) {
        if (sortedTiers[i].max >= sortedTiers[i + 1].min) {
            return next(new Error('Prediction tiers cannot overlap'));
        }
    }
    
    next();
});

// Instance Methods
ContestSchema.methods.generatePredictions = function(): Promise<IContest> {
    const generatedPredictions: IGeneratedPrediction[] = [];

    this.predictions.tiers.forEach((tier: IPredictionTier) => {
        if (!tier.isActive) return;

        const start = tier.min;
        const end = tier.max;
        const increment = this.predictions.increment;

        for (let value = start; value <= end; value += increment) {
            generatedPredictions.push({
                value,
                tierId: tier.id,
                currentEntries: 0,
                maxEntries: this.predictions.numberOfEntriesPerPrediction,
                isAvailable: true
            });
        }
    });

    this.predictions.generatedPredictions = generatedPredictions;
    return this.save();
};

ContestSchema.methods.updatePredictionEntries = function(predictionValue: number): Promise<IContest> {
    const prediction = this.predictions.generatedPredictions?.find(
        (p: IGeneratedPrediction) => p.value === predictionValue
    );
    
    if (!prediction) {
        throw new Error(`Prediction with value ${predictionValue} not found`);
    }
    
    if (!prediction.isAvailable) {
        throw new Error('This prediction is no longer available');
    }
    
    if (prediction.currentEntries >= prediction.maxEntries) {
        throw new Error('Prediction limit reached');
    }
    
    prediction.currentEntries += 1;
    prediction.isAvailable = prediction.currentEntries < prediction.maxEntries;
    this.totalEntries += 1;
    
    return this.save();
};

ContestSchema.methods.getPriceForPrediction = function(predictionValue: number): number {
    const prediction = this.predictions.generatedPredictions?.find(
        (p: IGeneratedPrediction) => p.value === predictionValue
    );
    
    if (!prediction) {
        throw new Error(`Prediction with value ${predictionValue} not found`);
    }
    
    const tier = this.predictions.tiers.find((t: IPredictionTier) => t.id === prediction.tierId);
    
    if (!tier) {
        throw new Error('Associated tier not found');
    }
    
    return tier.pricePerPrediction;
};

ContestSchema.methods.getAvailablePredictions = function(): IGeneratedPrediction[] {
    return this.predictions.generatedPredictions?.filter(
        (p: IGeneratedPrediction) => p.isAvailable
    ) || [];
};

ContestSchema.methods.getTotalCostForPredictions = function(predictionValues: number[]): number {
    let totalCost = 0;
    
    predictionValues.forEach(value => {
        totalCost += this.getPriceForPrediction(value);
    });
    
    return totalCost;
};

// Static Methods
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

export const Contest = mongoose.model<IContest>('Contest', ContestSchema);
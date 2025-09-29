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
const tierSchema = new mongoose.Schema({
    tiers: [
        {
                name: {
                    type: String,
                    required: false, // Optional field
                },
                min: {
                    type: Number,
                    required: false, // Optional field
                },
                max: {
                    type: Number,
                    required: false, // Optional field
                },
                pricePerPrediction: {
                    type: Number,
                    required: false, // Optional field
                    min: [0, 'Price cannot be negative'],
                },
            isActive: {
                type: Boolean,
                default: false, // Default value
            },
            default: {
                type: Array,
                default: [], // Default as an empty array
            },
        },
    ],
});
const ContestSchema = new Schema<IContest>({
    name: {
        type: String,
        required: [true, 'Contest name is required'],
        trim: true,
        maxlength: [200, 'Contest name cannot exceed 200 characters']
    },
    serial: {
        type: Number,
        required: [false, 'Serial number is required'],
        default: 1,
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
        minPrediction: {
            type: Number,
            required: [true, 'Min prediction is required'],
            min: [0, 'Min prediction must be at least 0']
        },
        maxPrediction: {
            type: Number,
            required: [true, 'Max prediction is required'],
            min: [1, 'Max prediction must be at least 1']
        },
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
        generatedPredictions: [{
            value: {
                type: Number,
                required: [true, 'Prediction value is required']
            },
            tierId: {
                type: String,
                required: [true, 'Tier ID is required']
            },
            price: {
                type: Number,
                required: [true, 'Price is required'],
                min: [0, 'Price cannot be negative']
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

    pricing: {
        predictionType: {
            type: String,
            enum: ['percentage', 'tier', 'priceOnly'],
            required: [true, 'Prediction type is required']
        },
        flatPrice: {
            type: Number,
            default: 0,
            min: [0, 'Flat price cannot be negative']
        },
        minTierPrice: {
            type: Number,
            default: 0,
            min: [0, 'Min tier price cannot be negative']
        },
        maxTierPrice: {
            type: Number,
            default: 0,
            min: [0, 'Max tier price cannot be negative']
        },
        tiers: [tierSchema],
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },
    endOffsetTime: {
        type: Date,
        required: [true, 'End of selection time is required']
    },
    image: { type: String },

    status: {
        type: String,
        enum: ['Draft', 'Active', 'Done', 'Deleted'],
        default: 'Draft'
    },

    totalEntries: {
        type: Number,
        default: 0,
        min: [0, 'Total entries cannot be negative']
    },
    maxEntries: {
        type: Number,
        default: 0,
        min: [0, 'Max entries cannot be negative']
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
        endedAt: { type: Date, default: null }
    }
}, {
    timestamps: true
});

// Indexes for performance
ContestSchema.index({ isActive: 1, isDraft: 1, startTime: 1 });
ContestSchema.index({ categoryId: 1 });
ContestSchema.index({ createdBy: 1 });
ContestSchema.index({ endTime: 1 });



// // Instance Methods
// ContestSchema.methods.generatePredictions = function (): Promise<IContest> {
//     const generatedPredictions: IGeneratedPrediction[] = [];

//     // Use predictions min/max instead of tiers
//     const start = this.predictions.minPrediction;
//     const end = this.predictions.maxPrediction;
//     const increment = this.predictions.increment;

//     // Generate all possible predictions based on min, max, increment
//     for (let value = start; value <= end; value += increment) {
//         // Find which tier this prediction belongs to
//         const tier = this.pricing.tiers.find((t: IPredictionTier) =>
//             t.isActive && value >= t.min && value <= t.max
//         );

//         if (tier) {
//             generatedPredictions.push({
//                 value,
//                 tierId: tier.id,
//                 price: tier.pricePerPrediction,
//                 currentEntries: 0,
//                 maxEntries: this.predictions.numberOfEntriesPerPrediction,
//                 isAvailable: true
//             });
//         }
//     }

//     this.predictions.generatedPredictions = generatedPredictions;
//     return this.save();
// };
ContestSchema.methods.generatePredictions = function (): Promise<IContest> {
    console.log('=== Generate Predictions Debug ===');
    console.log('Prediction Type:', this.pricing.predictionType);

    const generatedPredictions: IGeneratedPrediction[] = [];
    const start = this.predictions.minPrediction;
    const end = this.predictions.maxPrediction;
    const increment = this.predictions.increment;

    console.log(`Prediction Range: ${start} to ${end} with increment ${increment}`);

    // Generate all possible predictions based on predictionType
    for (let value = start; value <= end; value += increment) {
        console.log(`\nChecking prediction: ${value}`);

        let prediction: IGeneratedPrediction | null = null;

        switch (this.pricing.predictionType) {
            case 'priceOnly':
                // For priceOnly type, use flatPrice for all predictions
                console.log(`  PriceOnly mode: Using flatPrice ${this.pricing.flatPrice}`);
                prediction = {
                    value,
                    tierId: 'flat_price', // Simple tierId for priceOnly
                    price: this.pricing.flatPrice,
                    currentEntries: 0,
                    maxEntries: this.predictions.numberOfEntriesPerPrediction,
                    isAvailable: true
                };
                break;

            case 'percentage':
                // For percentage type, find the appropriate tier based on percentage ranges
                const percentageTier = this.pricing.tiers.find((t: IPredictionTier) => {
                    const inRange = t.isActive && value >= t.min && value <= t.max;
                    console.log(`  Percentage Tier ${t.name} (${t.min}%-${t.max}%): ${inRange ? 'MATCH' : 'NO MATCH'}`);
                    return inRange;
                });

                if (percentageTier) {
                    console.log(`  ✓ Added to percentage tier: ${percentageTier.name}`);
                    prediction = {
                        value,
                        tierId: percentageTier.id || `percentage_tier_${percentageTier.name.replace(/\s/g, '_')}`,
                        price: percentageTier.pricePerPrediction,
                        currentEntries: 0,
                        maxEntries: this.predictions.numberOfEntriesPerPrediction,
                        isAvailable: true
                    };
                } else {
                    console.log(`  ✗ No percentage tier found for value: ${value}%`);
                }
                break;

            case 'tier':
                // For tier type, find the appropriate tier (existing logic)
                const tier = this.pricing.tiers.find((t: IPredictionTier) => {
                    const inRange = t.isActive && value >= t.min && value <= t.max;
                    console.log(`  Tier ${t.name} (${t.min}-${t.max}): ${inRange ? 'MATCH' : 'NO MATCH'}`);
                    return inRange;
                });

                if (tier) {
                    console.log(`  ✓ Added to tier: ${tier.name}`);
                    prediction = {
                        value,
                        tierId: tier.id || `tier_${tier.name.replace(/\s/g, '_')}`,
                        price: tier.pricePerPrediction,
                        currentEntries: 0,
                        maxEntries: this.predictions.numberOfEntriesPerPrediction,
                        isAvailable: true
                    };
                } else {
                    console.log(`  ✗ No tier found for value: ${value}`);
                }
                break;

            default:
                console.log(`  ✗ Invalid prediction type: ${this.pricing.predictionType}`);
        }

        // Add prediction if it was created
        if (prediction) {
            generatedPredictions.push(prediction);
            console.log(`  ✓ Added prediction: ${value} with price ${prediction.price}`);
        }
    }

    console.log(`\nTotal generated predictions: ${generatedPredictions.length}`);
    this.predictions.generatedPredictions = generatedPredictions;
    return this.save();
};
ContestSchema.methods.updatePredictionEntries = function (predictionValue: number): Promise<IContest> {
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

ContestSchema.methods.getPriceForPrediction = function (predictionValue: number): number {
    const prediction = this.pricing.generatedPredictions?.find(
        (p: IGeneratedPrediction) => p.value === predictionValue
    );

    if (!prediction) {
        throw new Error(`Prediction with value ${predictionValue} not found`);
    }

    const tier = this.pricing.tiers.find((t: IPredictionTier) => t.id === prediction.tierId);

    if (!tier) {
        throw new Error('Associated tier not found');
    }

    return tier.pricePerPrediction;
};

ContestSchema.methods.getAvailablePredictions = function (): IGeneratedPrediction[] {
    return this.pricing.generatedPredictions?.filter(
        (p: IGeneratedPrediction) => p.isAvailable
    ) || [];
};

ContestSchema.methods.getTotalCostForPredictions = function (predictionValues: number[]): number {
    let totalCost = 0;

    predictionValues.forEach(value => {
        totalCost += this.getPriceForPrediction(value);
    });

    return totalCost;
};

ContestSchema.methods.getTotalCostForPredictions = function (predictionValues: number[]): number {
    let totalCost = 0;

    predictionValues.forEach(value => {
        totalCost += this.getPriceForPrediction(value);
    });

    return totalCost;
};

// Static Methods
ContestSchema.statics.getActiveContests = function () {
    return this.find({
        isActive: true,
        isDraft: false,
        startTime: { $lte: new Date() },
        endTime: { $gte: new Date() }
    }).populate('categoryId');
};

ContestSchema.statics.getUpcomingContests = function () {
    return this.find({
        isActive: true,
        isDraft: false,
        startTime: { $gt: new Date() }
    }).populate('categoryId');
};
ContestSchema.pre('save', function (next) {
    // Auto-generate tier IDs if missing
    this.pricing.tiers.forEach((tier, index) => {
        if (!tier.id) {
            tier.id = `tier_${index + 1}_${tier.name.replace(/\s/g, '_').toLowerCase()}`;
        }
    });

    // Check if key prediction fields have changed
    if (this.isModified('predictions.minPrediction') ||
        this.isModified('predictions.maxPredictions') ||
        this.isModified('predictions.increment') ||
        this.isModified('predictions.numberOfEntriesPerPrediction') ||
        this.isModified('pricing.tiers')) {

        console.log('Key prediction fields modified - clearing generated predictions');

        // Clear generated predictions to force regeneration
        this.predictions.generatedPredictions = [];

        // Reset total entries since predictions are being regenerated
        this.totalEntries = 0;

        // Mark as draft if it was published (since structure changed)
        if (this.status === 'Active') {
            console.log('Contest structure changed - reverting to Draft status');
            this.status = 'Draft';
        }
    }

    // Validate end time is after start time
    if (this.endTime <= this.startTime) {
        return next(new Error('End time must be after start time'));
    }

    // Validate tiers don't overlap and are in correct order
    const sortedTiers = this.pricing.tiers
        .filter(tier => tier.isActive)
        .sort((a, b) => a.min - b.min);

    for (let i = 0; i < sortedTiers.length - 1; i++) {
        if (sortedTiers[i].max >= sortedTiers[i + 1].min) {
            return next(new Error(`Pricing tiers overlap: ${sortedTiers[i].name} and ${sortedTiers[i + 1].name}`));
        }
    }

    next();
});
// Query Middleware
ContestSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

ContestSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

ContestSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});
export const Contest = mongoose.model<IContest>('Contest', ContestSchema);
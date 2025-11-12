import mongoose, { Schema } from "mongoose";
import { IContest, IGeneratedPrediction, IPredictionTier } from "./contest.interface";


const GeneratePrediction = new Schema<IGeneratedPrediction>({

    value: {
        type: Number,
        required: false,
    },
    tierId: {
        type: String,
        required: false,
    },
    price: {
        type: Number,
        required: false,
        default: 0,
    },
    currentEntries: {
        type: Number,
        default: 0,
    },
    maxEntries: {
        type: Number,
        required: false,
        default: 0,
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
})
const tierSchema = new Schema<IPredictionTier>(
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
        }
    }
)
const ContestMetadataSchema = new Schema({
    cryptoId: { type: String },
    stockSymbol: { type: String },
    playerId: { type: String },
    gameId: { type: String },
    league: { type: String },
    statType: { type: String },
    economicSeries: { type: String },
    movieId: { type: String },
    videoId: { type: String },
    metricType: { type: String },
    dataSource: { type: String },
    resultUnit: { type: String }
}, { _id: false });
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
    group: {
        type: String,
        required: [true, 'Group is required'],
        trim: true
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: [true, 'Group ID is required']
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
        },
        prizePool: {
            type: Number,
            required: [true, 'Prize pool is required'],
            min: [0, 'Prize pool cannot be negative']
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
        generatedPredictions: {
            type: [GeneratePrediction],
            default: []
        }
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
        tiers: {
            type: [tierSchema],
            default: []

        },
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
        enum: ['Draft', 'Active', 'Done', 'Deleted', 'Completed', 'Manual', 'Canceled'],
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
    popularity: {
        type: Number,
        default: 0,
        min: [0, 'Popularity cannot be negative']
    },
    metadata: {
        type: ContestMetadataSchema,
        required: false
    },
    results: {
        actualValue: { type: Number, default: undefined },
        winningPredictions: [{
            type: Schema.Types.ObjectId,
            ref: 'Order'
        }],
        prizeDistributed: {
            type: Boolean,
            default: false
        },
        endedAt: { type: Date, default: null },
        winnerSelectionMode: {
            type: String,
            enum: ['auto', 'manual'],
            default: 'auto'
        },
        autoSelectionAttempted: {
            type: Boolean,
            default: false
        },
        autoSelectionFailedAt: {
            type: Date,
            default: null
        },
        manualSelectionBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
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
// ContestSchema.methods.generatePredictions = async function (): Promise<IContest> {
//     const generatedPredictions: IGeneratedPrediction[] = [];
//     const start = this.predictions.minPrediction;
//     const end = this.predictions.maxPrediction;
//     const increment = this.predictions.increment;
//     // Generate all possible predictions based on predictionType
//     for (let value = start; value <= end; value += increment) {
//         let prediction: IGeneratedPrediction | null = null;
//         switch (this.pricing.predictionType) {
//             case 'priceOnly':
//                 // For priceOnly type, use flatPrice for all predictions
//                 console.log(`  PriceOnly mode: Using flatPrice ${this.pricing.flatPrice}`);
//                 prediction = {
//                     value,
//                     tierId: 'flat_price', // Simple tierId for priceOnly
//                     price: this.pricing.flatPrice,
//                     currentEntries: 0,
//                     maxEntries: this.predictions.numberOfEntriesPerPrediction,
//                     isAvailable: true
//                 };
//                 break;
//             case 'percentage':
//                 // For percentage type, find the appropriate tier based on percentage ranges
//                 const percentageTier = this.pricing.tiers.find((t: IPredictionTier) => {
//                     const inRange = t.isActive && value >= t.min && value <= t.max;
//                     console.log(`  Percentage Tier ${t.name} (${t.min}%-${t.max}%): ${inRange ? 'MATCH' : 'NO MATCH'}`);
//                     return inRange;
//                 });

//                 if (percentageTier) {
//                     prediction = {
//                         value,
//                         tierId: percentageTier.id || `percentage_tier_${percentageTier.name.replace(/\s/g, '_')}`,
//                         price: percentageTier.pricePerPrediction,
//                         currentEntries: 0,
//                         maxEntries: this.predictions.numberOfEntriesPerPrediction,
//                         isAvailable: true
//                     };
//                 } else {
//                     console.log(`  ✗ No percentage tier found for value: ${value}%`);
//                 }
//                 break;

//             case 'tier':
//                 // For tier type, find the appropriate tier (existing logic)
//                 const tier = this.pricing.tiers.find((t: IPredictionTier) => {
//                     const inRange = t.isActive && value >= t.min && value <= t.max;
//                     console.log(`  Tier ${t.name} (${t.min}-${t.max}): ${inRange ? 'MATCH' : 'NO MATCH'}`);
//                     return inRange;
//                 });

//                 if (tier) {
//                     prediction = {
//                         value,
//                         tierId: tier.id || `tier_${tier.name.replace(/\s/g, '_')}`,
//                         price: tier.pricePerPrediction,
//                         currentEntries: 0,
//                         maxEntries: this.predictions.numberOfEntriesPerPrediction,
//                         isAvailable: true
//                     };
//                 } else {
//                     console.log(`  ✗ No tier found for value: ${value}`);
//                 }
//                 break;

//             default:
//                 console.log(`  ✗ Invalid prediction type: ${this.pricing.predictionType}`);
//         }

//         // Add prediction if it was created
//         if (prediction) {
//             generatedPredictions.push(prediction);
//             console.log(`  ✓ Added prediction: ${value} with price ${prediction.price}`);
//         }
//     }
//     this.predictions.generatedPredictions = generatedPredictions;
//     return this.save();
// };
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
        this.predictions.generatedPredictions = [];
        this.totalEntries = 0;

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
        if (sortedTiers[i].max > sortedTiers[i + 1].min) {
            return next(new Error(`Pricing tiers overlap: ${sortedTiers[i].name} and ${sortedTiers[i + 1].name}`));
        }
    }

    next();
});
// // Pre-save middleware to auto-increment serial
// ContestSchema.pre('save', async function (next) {
//     // Only set serial if it's a new document and serial is not already set
//     if (this.isNew && !this.serial) {
//         try {
//             // Find the highest serial number and increment by 1
//             const lastContest = await Contest.findOne({}, {}, { sort: { serial: -1 } });
//             this.serial = lastContest ? lastContest.serial + 1 : 1;
//         } catch (error) {
//             return next(error as Error);
//         }
//     }
//     next();
// });

// // Post-delete middleware to reorder serials
// ContestSchema.post('findOneAndDelete', async function (doc) {
//     if (doc && doc.serial) {
//         try {
//             // Update all documents with serial greater than the deleted one
//             await Contest.updateMany(
//                 { serial: { $gt: doc.serial } },
//                 { $inc: { serial: -1 } }
//             );
//         } catch (error) {
//             console.error('Error reordering serials after deletion:', error);
//         }
//     }
// });

// ContestSchema.post('deleteOne', async function () {
//     // Handle deleteOne as well
//     const deletedDoc = await Contest.findOne(this.getFilter());
//     if (deletedDoc && deletedDoc.serial) {
//         try {
//             await Contest.updateMany(
//                 { serial: { $gt: deletedDoc.serial } },
//                 { $inc: { serial: -1 } }
//             );
//         } catch (error) {
//             console.error('Error reordering serials after deletion:', error);
//         }
//     }
// });
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
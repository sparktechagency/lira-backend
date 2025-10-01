import { model, Schema } from 'mongoose';
import { IPayment } from './payments.interface';

const paymentSchema = new Schema<IPayment>(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        // Added for contest orders
        contestId: {
            type: Schema.Types.ObjectId,
            ref: 'Contest',
            required: false,
            index: true,
        },
        // Added to track prediction IDs in contest orders
        predictionIds: [
            {
                type: Schema.Types.ObjectId,
                required: false,
            },
        ],
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            default: 'usd',
        },
        paymentMethod: {
            type: String,
            enum: ['stripe', 'paypal', 'other'],
            required: true,
        },
        paymentIntentId: {
            type: String,
            required: false,
        },
        paymentSessionId: {
            type: String,
            required: false,
            unique: true,
            sparse: true, // Allows multiple null values
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'paid', 'failed', 'refunded', 'cancelled'],
            default: 'pending',
        },
        // Metadata to store additional info
        metadata: {
            type: {
                type: {
                    type: String,
                    enum: ['product_order', 'contest_order'],
                    required: false,
                },
                orderId: {
                    type: String,
                    required: false,
                },
                contestName: {
                    type: String,
                    required: false,
                },
                promoCode: {
                    type: String,
                    required: false,
                },
            },
            required: false,
        },
        refundAmount: {
            type: Number,
            required: false,
        },
        refundReason: {
            type: String,
            required: false,
        },
        refundedAt: {
            type: Date,
            required: false,
        },
        paidAt: {
            type: Date,
            required: false,
        },
        // Track when payment was completed
        completedAt: {
            type: Date,
            required: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
paymentSchema.index({ paymentSessionId: 1 });
paymentSchema.index({ contestId: 1, status: 1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ 'metadata.type': 1 });

// Query Middleware
paymentSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

paymentSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

paymentSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});

// Virtual for payment type
paymentSchema.virtual('paymentType').get(function () {
    return this.metadata?.type || 'unknown';
});

// Instance method to check if payment is successful
paymentSchema.methods.isSuccessful = function () {
    return this.status === 'completed' || this.status === 'paid';
};

// Instance method to check if payment is pending
paymentSchema.methods.isPending = function () {
    return this.status === 'pending';
};

// Static method to get user payments for contests
paymentSchema.statics.getUserContestPayments = function (userId: string) {
    return this.find({
        userId,
        'metadata.type': 'contest_order',
    })
        .populate('contestId', 'name category prize')
        .sort({ createdAt: -1 });
};

// Static method to get contest revenue
paymentSchema.statics.getContestRevenue = function (contestId: string) {
    return this.aggregate([
        {
            $match: {
                contestId: contestId,
                status: { $in: ['completed', 'paid'] },
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: '$contestId',
                totalRevenue: { $sum: '$amount' },
                totalPayments: { $sum: 1 },
            },
        },
    ]);
};

export const Payment = model<IPayment>('Payment', paymentSchema);
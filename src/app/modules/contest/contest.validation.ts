import { z } from "zod";

// Define the Zod schema for predictions tier
const TierSchema = z.object({
    id: z.string().min(1, "Tier ID is required"),
    name: z.string().min(1, "Tier name is required"),
    min: z.number().min(0, "Tier min value must be at least 0"),
    max: z.number().min(0, "Tier max value must be at least 0"),
    pricePerPrediction: z.number().min(0, "Price per prediction must be non-negative"),
    isActive: z.boolean().default(true),
});

// Define the Zod schema for the `prize` object
const PrizeSchema = z.object({
    title: z.string().min(1, "Prize title is required"),
    type: z.string().min(1, "Prize type is required"),
    amount: z.number().min(0, "Prize amount must be at least 0"),  // You can skip this if not necessary
});

// Define the Zod schema for the contest `predictions`
const PredictionSchema = z.object({
    increment: z.number().min(1, "Increment must be at least 1"),
    unit: z.string().min(1, "Unit is required"),
    numberOfEntriesPerPrediction: z.number().min(1, "Number of entries must be at least 1"),
    predictionType: z.string().optional(),
    dataSource: z.string().optional(),
    tiers: z.array(TierSchema),
    generatedPredictions: z.array(z.object({
        value: z.number(),
        tierId: z.string(),
        currentEntries: z.number().min(0, "Current entries cannot be negative"),
        maxEntries: z.number().min(1, "Max entries must be at least 1"),
        isAvailable: z.boolean(),
    })).optional(),
});

const contestSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Contest name is required").max(200, "Contest name cannot exceed 200 characters"),
        category: z.string().min(1, "Category is required"),
        categoryId: z.string().min(1, "Category ID is required"),
        description: z.string().min(1, "Description is required").max(1000, "Description cannot exceed 1000 characters"),
        prize: PrizeSchema,
        predictions: PredictionSchema,
        image: z.string().optional(),
        isActive: z.boolean().default(true),
        isDraft: z.boolean().default(true),

        totalEntries: z.number().min(0, "Total entries cannot be negative"),
        maxEntries: z.number().min(1, "Max entries must be at least 1"),
        createdBy: z.string().min(1, "CreatedBy is required"),

        results: z.object({
            actualValue: z.number().optional(),
            winningPredictions: z.array(z.string()).optional(),
            prizeDistributed: z.boolean().default(false),
            endedAt: z.string().optional().nullable(),
        }).optional(),
    })
});

export const ContestValidation = {
    contestSchema,
}
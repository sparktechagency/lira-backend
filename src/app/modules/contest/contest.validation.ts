import { z } from "zod";
    

// Define the Zod schema for the `prize` object
const PrizeSchema = z.object({
    title: z.string().min(1, "Prize title is required"),
    type: z.string().min(1, "Prize type is required"),
});


// Define the Zod schema for the contest `predictions`
const PredictionSchema = z.object({
    increment: z.number().min(1, "Increment must be at least 1"),
    maxPrediction: z.number().min(0, "Max prediction must be at least 0"),
    minPrediction: z.number().min(0, "Min prediction must be at least 0"),
    unit: z.string(),
    numberOfEntriesPerPrediction: z.number().min(1, "Number of entries must be at least 1"),
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
    })
});

export const ContestValidation = {
    contestSchema,
}
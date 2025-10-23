import { z } from 'zod';

// Add Card Schema
const addCardSchema = z.object({
     body: z.object({
          paymentMethodId: z
               .string({
                    required_error: 'Payment method ID is required',
               })
               .min(1, 'Payment method ID cannot be empty'),
     }),
});

// Request Withdrawal Schema
const requestWithdrawalSchema = z.object({
     body: z.object({
          amount: z
               .number({
                    required_error: 'Amount is required',
               })
               .min(10, 'Minimum withdrawal amount is $10')
               .max(10000, 'Maximum withdrawal amount is $10,000'),
          cardId: z.string().optional(),
          withdrawalMethod: z.enum(['card', 'bank']).default('card'),
     }),
});

// Approve Withdrawal Schema
const approveWithdrawalSchema = z.object({
     body: z.object({
          payoutMethod: z.enum(['instant', 'standard']).default('instant'),
          adminNote: z.string().optional(),
     }),
});

// Reject Withdrawal Schema
const rejectWithdrawalSchema = z.object({
     body: z.object({
          reason: z
               .string({
                    required_error: 'Rejection reason is required',
               })
               .min(10, 'Reason must be at least 10 characters long')
               .max(500, 'Reason cannot exceed 500 characters'),
     }),
});

export const WithdrawalValidation = {
     addCardSchema,
     requestWithdrawalSchema,
     approveWithdrawalSchema,
     rejectWithdrawalSchema,
};
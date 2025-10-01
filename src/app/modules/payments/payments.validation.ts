import { z } from 'zod';

const createPaymentZodSchema = z.object({
     body: z.object({
          orderId: z.string({ required_error: 'Order ID is required' }),
          userId: z.string({ required_error: 'User ID is required' }),
          productIds: z.array(z.string({ required_error: 'Product ID is required' })),
          amount: z
               .union([z.string(), z.number()])
               .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
               .refine((val) => !isNaN(val), {
                    message: 'Amount must be a valid number.',
               }),
          currency: z.string().default('usd'),
          paymentMethod: z.enum(['stripe', 'paypal', 'other'], {
               required_error: 'Payment method is required',
          }),
          metadata: z.record(z.any()).optional(),
     }),
});

const updatePaymentZodSchema = z.object({
     body: z.object({
          status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
          paymentIntentId: z.string().optional(),
          paymentSessionId: z.string().optional(),
          refundAmount: z
               .union([z.string(), z.number()])
               .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
               .refine((val) => !isNaN(val), {
                    message: 'Refund amount must be a valid number.',
               })
               .optional(),
          refundReason: z.string().optional(),
          metadata: z.record(z.any()).optional(),
     }),
});

export const PaymentValidation = {
     createPaymentZodSchema,
     updatePaymentZodSchema,
};

import { z } from 'zod';

const createProductOrderZodSchema = z.object({
     body: z.object({
          products: z.array(
               z.object({
                    productId: z.string(),
               }),
          ),
     }),
});

const updateProductOrderZodSchema = z.object({
     body: z.object({
          status: z.enum(['pending', 'processing', 'shipping', 'delivered']).optional(),
     }),
});

export const ProductOrderValidation = {
     createProductOrderZodSchema,
     updateProductOrderZodSchema,
};

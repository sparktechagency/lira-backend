import { z } from 'zod';

const createGroupZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Group name is required' }),
     }),
});

const updateGroupZodSchema = z.object({
     body: z.object({
          name: z.string().optional(),
     }),
});

export const GroupValidation = {
     createGroupZodSchema,
     updateGroupZodSchema,
};

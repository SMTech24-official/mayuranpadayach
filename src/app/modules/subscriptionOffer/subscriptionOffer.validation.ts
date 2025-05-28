import { z } from 'zod';

const createSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    price: z.number().min(1, 'Price is required'),
    duration: z.number().min(1, 'Duration is required'),
    }),
});

const updateSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    price: z.number().min(1, 'Price is required'),
    duration: z.number().min(1, 'Duration is required'),
    }),
});

export const subscriptionOfferValidation = {
createSchema,
updateSchema,
};
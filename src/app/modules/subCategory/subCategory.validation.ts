import { z } from 'zod';

const createSchema = z.object({

    name: z.string().min(1, 'Name is required'),
    categoryId: z.string().min(1, 'Category ID is required'),

});

const updateSchema = z.object({

    name: z.string().optional()

});

export const subCategoryValidation = {
createSchema,
updateSchema,
};
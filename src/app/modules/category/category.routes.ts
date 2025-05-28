import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { categoryController } from './category.controller';
import { categoryValidation } from './category.validation';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpars/fileUploader';

const router = express.Router();

router.post(
'/',
auth(UserRole.ADMIN),
fileUploader.uploadSingle,
//validateRequest(categoryValidation.createSchema),
categoryController.createCategory,
);

router.get('/', auth(), categoryController.getCategoryList);

router.get('/:id', auth(), categoryController.getCategoryById);

router.put(
'/:id',
auth(UserRole.ADMIN),
fileUploader.uploadSingle,
//validateRequest(categoryValidation.updateSchema),
categoryController.updateCategory,
);

router.delete('/:id', auth(UserRole.ADMIN), categoryController.deleteCategory);

export const categoryRoutes = router;
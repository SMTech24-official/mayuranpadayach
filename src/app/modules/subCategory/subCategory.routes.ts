import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { subCategoryController } from './subCategory.controller';
import { subCategoryValidation } from './subCategory.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/',
auth(UserRole.ADMIN),
validateRequest(subCategoryValidation.createSchema),
subCategoryController.createSubCategory,
);

router.get('/', auth(), subCategoryController.getSubCategoryList);

router.get('/:id', auth(), subCategoryController.getSubCategoryById);

router.put(
'/:id',
auth(UserRole.ADMIN),
validateRequest(subCategoryValidation.updateSchema),
subCategoryController.updateSubCategory,
);

router.delete('/:id', auth(UserRole.ADMIN), subCategoryController.deleteSubCategory);

export const subCategoryRoutes = router;
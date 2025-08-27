import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { businessController } from './business.controller';
import { businessValidation } from './business.validation';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpars/fileUploader';

const router = express.Router();

router.post(
'/create',
auth(UserRole.PROFESSIONAL),
fileUploader.uploadSingle,
//validateRequest(businessValidation.createSchema),
businessController.createBusiness,
);

router.post('/opennings/:businessId',auth(UserRole.PROFESSIONAL),businessController.createOppenningsMap);

router.get('/opennings/:businessId',auth(),businessController.getOpenningMap);


router.get('/', auth(), businessController.getBusinessList);

router.get('/admin', auth(UserRole.ADMIN), businessController.getListForAdmin);

router.get('/user', auth(UserRole.PROFESSIONAL), businessController.getOneByUserId);

router.get('/:id', auth(), businessController.getBusinessById);

router.put(
    '/:id',
    auth(UserRole.ADMIN, UserRole.PROFESSIONAL),
    fileUploader.uploadSingle,
    //validateRequest(businessValidation.updateSchema),
    businessController.updateBusiness,
);

router.put('/opennings/:businessId',auth(UserRole.PROFESSIONAL),businessController.updateOpenningMap);
router.delete('/:id', auth(UserRole.ADMIN), businessController.deleteBusiness);

export const businessRoutes = router;
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { serviceController } from './service.controller';
import { serviceValidation } from './service.validation';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpars/fileUploader';

const router = express.Router();

router.post(
'/',
auth(UserRole.PROFESSIONAL),
//validateRequest(serviceValidation.createSchema),
fileUploader.uploadSingle,
serviceController.createService,
);

router.get('/all/:id', auth(), serviceController.getServiceList);

router.get('/:id', auth(), serviceController.getServiceById);

router.put(
'/:id',
auth(UserRole.PROFESSIONAL, UserRole.ADMIN),
//validateRequest(serviceValidation.updateSchema),
fileUploader.uploadSingle,
serviceController.updateService,
);

router.delete('/:id', auth(UserRole.ADMIN, UserRole.PROFESSIONAL), serviceController.deleteService);

export const serviceRoutes = router;
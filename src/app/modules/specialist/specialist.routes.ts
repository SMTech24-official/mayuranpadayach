import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { specialistController } from './specialist.controller';
import { specialistValidation } from './specialist.validation';
import { fileUploader } from '../../../helpars/fileUploader';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/',
auth(UserRole.PROFESSIONAL),
//validateRequest(specialistValidation.createSchema),
fileUploader.uploadSingle,
specialistController.createSpecialist,
);

router.get('/', auth(UserRole.USER), specialistController.getListForUser);

router.get('/all', auth(UserRole.PROFESSIONAL, UserRole.ADMIN), specialistController.getSpecialistList);

router.get('/:id', auth(UserRole.PROFESSIONAL, UserRole.ADMIN), specialistController.getSpecialistById);

router.put(
'/:id',
auth(UserRole.PROFESSIONAL, UserRole.ADMIN),
//validateRequest(specialistValidation.updateSchema),
fileUploader.uploadSingle,
specialistController.updateSpecialist,
);

router.delete('/:id', auth(UserRole.PROFESSIONAL, UserRole.ADMIN), specialistController.deleteSpecialist);

export const specialistRoutes = router;
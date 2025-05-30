import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { favoriteSpecialistController } from './favoriteSpecialist.controller';
import { favoriteSpecialistValidation } from './favoriteSpecialist.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/:specialistId',
auth(UserRole.USER),
favoriteSpecialistController.createFavoriteSpecialist,
);

router.get('/', auth(UserRole.USER), favoriteSpecialistController.getFavoriteSpecialistList);


export const favoriteSpecialistRoutes = router;
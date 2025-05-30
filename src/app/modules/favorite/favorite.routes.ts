import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { favoriteController } from './favorite.controller';
import { favoriteValidation } from './favorite.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/:businessId',
auth(UserRole.USER),
favoriteController.createFavorite,
);

router.get('/', auth(UserRole.USER), favoriteController.getFavoriteList);


export const favoriteRoutes = router;
import express from 'express';
import auth from '../../middlewares/auth';
import { reviewController } from './review.controller';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/',
auth(UserRole.USER),
reviewController.createReview,
);

router.get('/business/:businessId', auth(UserRole.PROFESSIONAL, UserRole.ADMIN), reviewController.getReviewList);

router.get('/:id', auth(), reviewController.getReviewById);

export const reviewRoutes = router;
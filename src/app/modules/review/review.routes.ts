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

router.get('/business/:businessId', auth(), reviewController.getReviewList);

router.get('/specialist/:specialistId', auth(), reviewController.getReviewListForSpecialist);

router.get('/:id', auth(), reviewController.getReviewById);

export const reviewRoutes = router;
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { subscriptionOfferController } from './subscriptionOffer.controller';
import { subscriptionOfferValidation } from './subscriptionOffer.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/',
auth(UserRole.ADMIN),
subscriptionOfferController.createSubscriptionOffer,
);

router.get('/', auth(), subscriptionOfferController.getSubscriptionOfferList);

router.get('/:id', auth(), subscriptionOfferController.getSubscriptionOfferById);

router.put(
'/:id',
//validateRequest(subscriptionOfferValidation.updateSchema),
auth(UserRole.ADMIN),
subscriptionOfferController.updateSubscriptionOffer,
);

router.delete('/:id', auth(UserRole.ADMIN), subscriptionOfferController.deleteSubscriptionOffer);

export const subscriptionOfferRoutes = router;
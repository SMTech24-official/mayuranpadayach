import express from 'express';
import auth from '../../middlewares/auth';
import { userSubscriptionController } from './userSubscription.controller';

const router = express.Router();

router.post(
'/',
auth(),
userSubscriptionController.createUserSubscription,
);

router.get('/', auth(), userSubscriptionController.getUserSubscriptionList);

router.get('/admin', auth(), userSubscriptionController.getUserSubscriptionListByAdmin);

router.get('/:id', auth(), userSubscriptionController.getUserSubscriptionById);


export const userSubscriptionRoutes = router;
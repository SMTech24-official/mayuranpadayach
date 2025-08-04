import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { paymentController } from './payment.controller';
import { paymentValidation } from './payment.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();
// Routes for payment operations
router.post('/save-card', auth(), paymentController.saveCard);
router.post('/authorize-payment', auth(), paymentController.authorizePayment);
router.post('/request-completion', auth(), paymentController.requestCompletion);
router.post('/confirm-completion', auth(), paymentController.confirmCompletion);
router.post('/refund-payment', auth(), paymentController.refundPayment);
router.post('/create-account', auth(UserRole.PROFESSIONAL), paymentController.createAccount);
router.post('/create-new-account/:userId', auth(), paymentController.createNewAccount);
router.get('/saved-cards/:userId', auth(), paymentController.getSavedCards);
router.delete('/delete-card/:authorizationCode', auth(), paymentController.deleteCard);
router.get('/banks', auth(), paymentController.getBanks);

export const paymentRoutes = router;
import express from 'express';

import { UserRole } from '@prisma/client';
import { paymentController } from './payment.controller';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentValidation } from './payment.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

// Initialize payment (USER only)
router.post(
  '/initialize',
  auth(UserRole.USER),
  //validateRequest(PaymentValidation.initializePayment),
  paymentController.initializePayment
);

// PayFast ITN (Instant Transaction Notification) - No auth required
router.post(
  '/payfast-notify',
  paymentController.handlePayFastNotification
);

// Payment return URLs (No auth required as these are redirects from PayFast)
router.get('/payment-return', paymentController.handlePaymentReturn);
router.get('/payment-cancel', paymentController.handlePaymentCancel);

// Request completion (PROFESSIONAL only)
router.post(
  '/request-completion',
  auth(UserRole.PROFESSIONAL),
  //validateRequest(PaymentValidation.requestCompletion),
  paymentController.requestCompletion
);

// Confirm completion and release payment (USER only)
router.post(
  '/confirm-completion',
  auth(UserRole.USER),
  //validateRequest(PaymentValidation.confirmCompletion),
  paymentController.confirmCompletion
);

// Refund payment (ADMIN only)
router.post(
  '/refund',
  auth(UserRole.ADMIN),
  //validateRequest(PaymentValidation.refundPayment),
  paymentController.refundPayment
);

// Get payment status (USER or PROFESSIONAL)
router.get(
  '/status/:bookingId',
  auth(UserRole.USER, UserRole.PROFESSIONAL),
  paymentController.getPaymentStatus
);

// Verify payment signature (for additional security)
router.post(
  '/verify',
  auth(UserRole.USER, UserRole.PROFESSIONAL, UserRole.ADMIN),
  paymentController.verifyPayment
);

export const PaymentRoutes = router;
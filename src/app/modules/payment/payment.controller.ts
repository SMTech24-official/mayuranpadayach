import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { paymentService } from './payment.service';
import ApiError from '../../../errors/ApiErrors';

// Initialize payment with hold
const initializePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await paymentService.authorizedPaymentWithHoldFromPayfast(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment initialized successfully',
    data: result,
  });
});

// Handle PayFast ITN (Instant Transaction Notification)
const handlePayFastNotification = catchAsync(async (req: Request, res: Response) => {
  try {
    // PayFast sends data as form-encoded, so we need to handle it properly
    const notificationData = req.body;
    
    console.log('PayFast ITN received:', notificationData);
    
    const result = await paymentService.handlePayfastNotification(notificationData);
    
    // PayFast expects a 200 OK response for successful processing
    res.status(httpStatus.OK).send('OK');
  } catch (error: any) {
    console.error('PayFast ITN processing error:', error);
    // Still send OK to PayFast to prevent retries of invalid notifications
    res.status(httpStatus.OK).send('OK');
  }
});

// Request completion by professional
const requestCompletion = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await paymentService.requestCompletion(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Completion requested successfully',
    data: result,
  });
});

// Confirm completion and release payment
const confirmCompletion = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await paymentService.confirmCompletionAndReleasePayment(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment released successfully',
    data: result,
  });
});

// Refund payment
const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.refundPaymentToCustomer(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Refund initiated successfully',
    data: result,
  });
});

// Get payment status
const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const result = await paymentService.getPaymentStatus(bookingId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment status retrieved successfully',
    data: result,
  });
});

// Verify payment (for additional security checks)
const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const { signature, ...payloadData } = req.body;
  
  const isValid = await paymentService.verifyPaymentSignature(payloadData, signature);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: isValid ? 'Payment signature is valid' : 'Payment signature is invalid',
    data: { isValid },
  });
});

// Handle payment success return from PayFast
const handlePaymentReturn = catchAsync(async (req: Request, res: Response) => {
  // This endpoint handles users returning from PayFast after payment
  // You can extract payment details and redirect appropriately
  const { m_payment_id, payment_status } = req.query;
  
  console.log('Payment return:', { m_payment_id, payment_status });
  
  // Redirect to frontend with payment status
  const redirectUrl = payment_status === 'COMPLETE' 
    ? `${process.env.FRONTEND_BASE_URL}/payment-success?booking=${m_payment_id}`
    : `${process.env.FRONTEND_BASE_URL}/payment-failed?booking=${m_payment_id}`;
    
  res.redirect(redirectUrl);
});

// Handle payment cancellation
const handlePaymentCancel = catchAsync(async (req: Request, res: Response) => {
  const { m_payment_id } = req.query;
  
  console.log('Payment cancelled:', { m_payment_id });
  
  // Redirect to frontend
  res.redirect(`${process.env.FRONTEND_BASE_URL}/payment-cancelled?booking=${m_payment_id}`);
});

export const paymentController = {
  initializePayment,
  handlePayFastNotification,
  requestCompletion,
  confirmCompletion,
  refundPayment,
  getPaymentStatus,
  verifyPayment,
  handlePaymentReturn,
  handlePaymentCancel,
};
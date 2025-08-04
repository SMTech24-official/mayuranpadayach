import httpStatus from 'http-status';
import  catchAsync  from '../../../shared/catchAsync';
import  sendResponse  from '../../../shared/sendResponse';
import { paymentService } from './payment.service';
import ApiError from '../../../errors/ApiErrors';

// Save a USER's card and customer info
const saveCard = catchAsync(async (req, res) => {
    const payload = req.body;
    const user = req.user;
    const result = await paymentService.saveCardWithCustomerInfoIntoPaystack(payload, user);
    sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Card saved successfully',
    data: result,
  });
});

// Authorize a payment for a booking (USER)
const authorizePayment = catchAsync(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  }
  const result = await paymentService.authorizedPaymentWithSaveCardFromPaystack(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment authorized successfully',
    data: result,
  });
});

// PROFESSIONAL requests booking completion
const requestCompletion = catchAsync(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  }
  const result = await paymentService.requestCompletion(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Completion requested successfully',
    data: result,
  });
});

// USER confirms completion and captures payment
const confirmCompletion = catchAsync(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  }
  const result = await paymentService.confirmCompletionAndCapturePayment(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking completed and payment captured successfully',
    data: result,
  });
});

// ADMIN refunds a payment
const refundPayment = catchAsync(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  }
  const result = await paymentService.refundPaymentToCustomer(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment refunded successfully',
    data: result,
  });
});



// ADMIN creates a subaccount for a PROFESSIONAL
const createAccount = catchAsync(async (req, res) => {
  const userId = req.user.id as any;
    const { account_number, bank_code } = req.body;
    console.log("userId", userId);
    console.log("account_number", account_number);
    console.log("bank_code", bank_code);
    const result = await paymentService.createAccountIntoPaystack(userId, { account_number, bank_code });
    res.status(httpStatus.OK).json({
      success: true,
      data: result,
      message: 'Subaccount created successfully',
    });
});

// ADMIN creates a new subaccount, replacing the existing one
const createNewAccount = catchAsync(async (req, res) => {
  const { userId } = req.params;
    const { account_number, bank_code } = req.body;
    console.log("userId", userId);
    console.log("account_number", account_number);
    console.log("bank_code", bank_code);
    const result = await paymentService.createNewAccountIntoPaystack(userId, { account_number, bank_code });
    res.status(httpStatus.OK).json({
      success: true,
      data: result,
      message: 'New subAccount created successfully',
    });
  })

// USER retrieves saved cards
const getSavedCards = catchAsync(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }
  const result = await paymentService.getCustomerSavedCardsFromPaystack(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Saved cards retrieved successfully',
    data: result,
  });
});

// USER deletes a saved card
const deleteCard = catchAsync(async (req, res) => {
  const { authorizationCode } = req.params;
  if (!authorizationCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Authorization code is required');
  }
  const result = await paymentService.deleteCardFromCustomer(authorizationCode, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Card deleted successfully',
    data: result,
  });
});

// Fetch Paystack bank codes
const getBanks = catchAsync(async (req, res) => {
  const banks = await paymentService.paystackRequest('get', '/bank');
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bank codes retrieved successfully',
    data: banks,
  });
});

export const paymentController = {
  saveCard,
  authorizePayment,
  requestCompletion,
  confirmCompletion,
  refundPayment,
  createAccount,
  createNewAccount,
  getSavedCards,
  deleteCard,
  getBanks
};
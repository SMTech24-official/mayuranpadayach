import httpStatus from 'http-status';
import axios from 'axios';
import config from '../../../config';
import { PaymentStatus, bookingStatus, UserRole } from '@prisma/client';
import { notificationService } from '../notification/notification.service';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';

// Paystack API base URL and secret key
const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = config.paystack.secret_key;

// Helper function for Paystack API requests
const paystackRequest = async (method: any, endpoint: any, data = {}) => {
  try {
    const response = await axios({
      method,
      url: `${PAYSTACK_API_URL}${endpoint}`,
      data,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || 'Paystack API error');
  }
};


// Update createAccountIntoPaystack
const createAccountIntoPaystack = async (userId: string, bankDetails: { account_number: string; bank_code: string }) => {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, paystackSubaccountCode: true, paystackRecipientCode: true, paystackSubaccountUrl: true, role: true },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (userData.role !== UserRole.PROFESSIONAL) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only PROFESSIONALs can have subaccounts');
  }

  if (userData.paystackSubaccountCode && userData.paystackRecipientCode) {
    const subaccountDetails = {
      subaccountCode: userData.paystackSubaccountCode,
      recipientCode: userData.paystackRecipientCode,
      subaccountUrl: userData.paystackSubaccountUrl || `${process.env.FRONTEND_BASE_URL}/update-bank-details`,
    };

    await prisma.user.update({
      where: { id: userData.id },
      data: { paystackSubaccountUrl: subaccountDetails.subaccountUrl },
    });

    return subaccountDetails;
  }

  // Validate bank details
  if (!bankDetails?.account_number || !bankDetails?.bank_code) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Bank account number and bank code are required');
  }

  const recipient = await paystackRequest('post', '/transferrecipient', {
    type: 'nuban',
    name: userData.fullName || 'Professional',
    account_number: bankDetails.account_number,
    bank_code: bankDetails.bank_code,
    currency: 'NGN',
  });

  const subaccount = await paystackRequest('post', '/subaccount', {
    business_name: userData.fullName || 'Professional Business',
    bank_code: bankDetails.bank_code,
    account_number: bankDetails.account_number,
    percentage_charge: 10,
  });

  const subaccountUrl = `${process.env.FRONTEND_BASE_URL}/onboarding-success?subaccount=${subaccount.subaccount_code}`;

  const updateUser = await prisma.user.update({
    where: { id: userData.id },
    data: {
      paystackSubaccountCode: subaccount.subaccount_code,
      paystackRecipientCode: recipient.recipient_code,
      paystackSubaccountUrl: subaccountUrl,
    },
  });

  if (!updateUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Failed to save subaccount details');
  }

  return {
    subaccountCode: subaccount.subaccount_code,
    recipientCode: recipient.recipient_code,
    subaccountUrl,
  };
};

// Update createNewAccountIntoPaystack
const createNewAccountIntoPaystack = async (userId: string, bankDetails: { account_number: string; bank_code: string }) => {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, paystackSubaccountCode: true, paystackRecipientCode: true, role: true },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (userData.role !== UserRole.PROFESSIONAL) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only PROFESSIONALs can have subaccounts');
  }

  if (userData.paystackRecipientCode) {
    try {
      await paystackRequest('delete', `/transferrecipient/${userData.paystackRecipientCode}`);
    } catch (error: any) {
      console.warn('Failed to delete existing recipient:', error.message);
    }
  }

  if (!bankDetails?.account_number || !bankDetails?.bank_code) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Bank account number and bank code are required');
  }

  const newRecipient = await paystackRequest('post', '/transferrecipient', {
    type: 'nuban',
    name: userData.fullName || 'Professional',
    account_number: bankDetails.account_number,
    bank_code: bankDetails.bank_code,
    currency: 'NGN',
  });

  const newSubaccount = await paystackRequest('post', '/subaccount', {
    business_name: userData.fullName || 'Professional Business',
    bank_code: bankDetails.bank_code,
    account_number: bankDetails.account_number,
    percentage_charge: 10,
  });

  const subaccountUrl = `${process.env.FRONTEND_BASE_URL}/onboarding-success?subaccount=${newSubaccount.subaccount_code}`;

  await prisma.user.update({
    where: { id: userData.id },
    data: {
      paystackSubaccountCode: newSubaccount.subaccount_code,
      paystackRecipientCode: newRecipient.recipient_code,
      paystackSubaccountUrl: subaccountUrl,
    },
  });

  return {
    subaccountCode: newSubaccount.subaccount_code,
    recipientCode: newRecipient.recipient_code,
    subaccountUrl,
  };
};

// Include other Paystack service functions (unchanged from previous response)
const saveCardWithCustomerInfoIntoPaystack = async (payload: any, user: any) => {
  try {
    const { email } = payload;

    let existCustomer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { paystackCustomerCode: true, fullName: true, email: true },
    });

    if (!existCustomer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not found');
    }

    let customerCode = existCustomer.paystackCustomerCode;

    if (!customerCode) {
      const customer = await paystackRequest('post', '/customer', {
        email: existCustomer.email,
        first_name: existCustomer.fullName.split(' ')[0] || 'User',
        last_name: existCustomer.fullName.split(' ').slice(1).join(' ') || 'User',
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { paystackCustomerCode: customer.customer_code },
      });

      customerCode = customer.customer_code;
    }

    const transaction = await paystackRequest('post', '/transaction/initialize', {
      email: existCustomer.email,
      amount: 100 * 100, // Minimum 100 NGN in kobo
      customer_code: customerCode,
    });

    return {
      customerCode,
      authorizationUrl: transaction.authorization_url,
      reference: transaction.reference,
    };
  } catch (error: any) {
    console.error('Error in saveCardWithCustomerInfoIntoPaystack:', error);
    throw new ApiError(httpStatus.CONFLICT, error.message);
  }
};

const authorizedPaymentWithSaveCardFromPaystack = async (userId: string, payload: any) => {
  const { bookingId } = payload;

  const customer = await prisma.user.findUnique({
    where: { id: userId },
    select: { paystackCustomerCode: true, email: true, role: true },
  });

  if (!customer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (customer.role !== UserRole.USER) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only USERs can authorize payments');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: { select: { userId: true } },
      service: { select: { price: true } },
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking not found');
  }

  if (booking.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User not authorized for this booking');
  }

  if (booking.bookingStatus !== bookingStatus.PENDING) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is not in PENDING status');
  }

  const professional = await prisma.user.findUnique({
    where: { id: booking.business.userId },
    select: { paystackSubaccountCode: true, paystackRecipientCode: true },
  });

  if (!professional || !professional.paystackSubaccountCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Professional subaccount not found');
  }

  const amount = booking.totalPrice * 100;
  const adminCommission = Math.round(amount * 0.17);
  const professionalAmount = amount - adminCommission;

  const existingPayment = await prisma.payment.findFirst({
    where: { paystackCustomerCodeProvider: customer.paystackCustomerCode, status: PaymentStatus.REQUIRES_CAPTURE },
    select: { authorizationCode: true },
  });

  let transaction;
  if (existingPayment?.authorizationCode) {
    transaction = await paystackRequest('post', '/transaction/charge_authorization', {
      email: customer.email,
      amount,
      authorization_code: existingPayment.authorizationCode,
      metadata: { bookingId, professionalId: booking.business.userId },
      subaccount: professional.paystackSubaccountCode,
    });
  } else {
    transaction = await paystackRequest('post', '/transaction/initialize', {
      email: customer.email,
      amount,
      customer_code: customer.paystackCustomerCode,
      authorization_type: 'preauth',
      metadata: { bookingId, professionalId: booking.business.userId },
      subaccount: professional.paystackSubaccountCode,
    });
  }

  const payment = await prisma.payment.create({
    data: {
      paymentId: transaction.reference,
      paymentAmount: booking.totalPrice,
      bookingId,
      paystackCustomerCodeProvider: customer.paystackCustomerCode,
      paystackSubaccountCodeReceiver: professional.paystackSubaccountCode,
      authorizationCode: transaction.authorization?.authorization_code,
      status: PaymentStatus.REQUIRES_CAPTURE,
    },
  });

  if (!payment) {
    throw new ApiError(httpStatus.CONFLICT, 'Failed to save payment information');
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: true },
  });

  // const notificationTitle = 'New Booking Payment Held';
  // const notificationBody = `A payment of ${booking.totalPrice} NGN has been held for booking #${bookingId}.`;
  // await notificationService.sendNotification(
  //   professional.fcmToken || '',
  //   notificationTitle,
  //   notificationBody,
  //   booking.business.userId,
  // );

  return { authorizationUrl: transaction.authorization_url, reference: transaction.reference };
};

const requestCompletion = async (userId: string, payload: any) => {
  const { bookingId } = payload;

  const professional = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!professional || professional.role !== UserRole.PROFESSIONAL) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only PROFESSIONALs can request completion');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: { select: { userId: true } } },
  });

  if (!booking) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking not found');
  }

  if (booking.business.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Professional not authorized for this booking');
  }

  if (booking.bookingStatus !== bookingStatus.PENDING) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is not in PENDING status');
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: bookingStatus.COMPLETE_REQUEST },
  });

  const user = await prisma.user.findUnique({
    where: { id: booking.userId },
    select: { fcmToken: true },
  });

  // const notificationTitle = 'Booking Completion Requested';
  // const notificationBody = `The professional has requested completion for booking #${bookingId}. Please confirm.`;
  // await notificationService.sendNotification(
  //   user.fcmToken || '',
  //   notificationTitle,
  //   notificationBody,
  //   booking.userId,
  // );

  return updatedBooking;
};

const confirmCompletionAndCapturePayment = async (userId: string, payload: any) => {
  const { bookingId } = payload;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, fcmToken: true },
  });

  if (!user || user.role !== UserRole.USER) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only USERs can confirm completion');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: { select: { userId: true } } },
  });

  if (!booking) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking not found');
  }

  if (booking.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User not authorized for this booking');
  }

  if (booking.bookingStatus !== bookingStatus.COMPLETE_REQUEST) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is not in COMPLETE_REQUEST status');
  }

  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    select: { paymentId: true, paymentAmount: true, paystackSubaccountCodeReceiver: true },
  });

  console.log('Payment details:', payment);

  if (!payment) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment not found');
  }

  let capture;
  try {
    capture = await paystackRequest('post', '/transaction/capture', {
      reference: payment.paymentId,
    });
    console.log('Capture response:', capture);
  } catch (error: any) {
    console.error('Capture error:', error.message, error.response?.data);
    throw new ApiError(httpStatus.BAD_REQUEST, `Payment capture failed: ${error.response?.data?.message || error.message}`);
  }

  if (!capture.status) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Payment capture failed: ${capture.message || 'Unknown error'}`);
  }

  const amount = payment.paymentAmount * 100; // Convert to kobo
  const adminCommission = Math.round(amount * 0.17);
  const professionalAmount = amount - adminCommission;

  const professional = await prisma.user.findUnique({
    where: { id: booking.business.userId },
    select: { paystackRecipientCode: true, fcmToken: true },
  });

  if (!professional || !professional.paystackRecipientCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Professional recipient code not found');
  }

  let transfer;
  try {
    transfer = await paystackRequest('post', '/transfer', {
      source: 'balance',
      amount: professionalAmount,
      recipient: professional.paystackRecipientCode,
      reason: `Payment for booking #${bookingId}`,
    });
    console.log('Transfer response:', transfer);
  } catch (error: any) {
    console.error('Transfer error:', error.message, error.response?.data);
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, `Transfer to professional failed: ${error.response?.data?.message || error.message}`);
  }

  if (!transfer.status) {
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, `Transfer to professional failed: ${transfer.message || 'Unknown error'}`);
  }

  const updatedPayment = await prisma.payment.update({
    where: { bookingId }, // Use bookingId as the unique identifier
    data: { status: PaymentStatus.COMPLETED },
  });

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: bookingStatus.COMPLETED },
  });

  // Uncomment when notificationService is ready
  // const notificationTitleUser = 'Booking Completed';
  // const notificationBodyUser = `Booking #${bookingId} has been completed. Payment released.`;
  // await notificationService.sendNotification(
  //   user.fcmToken || '',
  //   notificationTitleUser,
  //   notificationBodyUser,
  //   userId
  // );

  // const notificationTitlePro = 'Payment Received';
  // const notificationBodyPro = `Payment of ${(professionalAmount / 100).toFixed(2)} NGN received for booking #${bookingId}.`;
  // await notificationService.sendNotification(
  //   professional.fcmToken || '',
  //   notificationTitlePro,
  //   notificationBodyPro,
  //   booking.business.userId
  // );

  return { booking: updatedBooking, payment: updatedPayment };
};

const refundPaymentToCustomer = async (payload: any) => {
  const { bookingId } = payload;

  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    select: { paymentId: true, status: true },
  });

  if (!payment) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment not found');
  }

  if (payment.status !== PaymentStatus.REQUIRES_CAPTURE) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment cannot be refunded');
  }

  const refund = await paystackRequest('post', '/refund', {
    transaction: payment.paymentId,
  });

  const updatedPayment = await prisma.payment.update({
    where: { bookingId },
    data: { status: PaymentStatus.FAILED },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: bookingStatus.CANCELLED, paymentStatus: false },
  });

  return refund;
};

const getCustomerSavedCardsFromPaystack = async (userId: string) => {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { paystackCustomerCode: true, role: true },
  });

  if (!userData || !userData.paystackCustomerCode) {
    return { message: 'User data or customer code not found' };
  }

  if (userData.role !== UserRole.USER) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only USERs can view saved cards');
  }

  const payments = await prisma.payment.findMany({
    where: { paystackCustomerCodeProvider: userData.paystackCustomerCode },
    select: { authorizationCode: true },
  });

  return { paymentMethods: payments.map(p => ({ authorization_code: p.authorizationCode })) };
};

const deleteCardFromCustomer = async (authorizationCode:any, userId:string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, paystackCustomerCode: true },
  });

  if (!user || user.role !== UserRole.USER) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only USERs can delete cards');
  }

  try {
    await paystackRequest('post', '/customer/deactivate_authorization', {
      authorization_code: authorizationCode,
    });

    await prisma.payment.updateMany({
      where: { authorizationCode, paystackCustomerCodeProvider: user.paystackCustomerCode },
      data: { status: PaymentStatus.DEACTIVATED },
    });

    return { message: 'Card deactivated successfully' };
  } catch (error: any) {
    throw new ApiError(httpStatus.CONFLICT, error.message);
  }
};

export const paymentService = {
  paystackRequest,
  saveCardWithCustomerInfoIntoPaystack,
  authorizedPaymentWithSaveCardFromPaystack,
  requestCompletion,
  confirmCompletionAndCapturePayment,
  refundPaymentToCustomer,
  createAccountIntoPaystack,
  createNewAccountIntoPaystack,
  getCustomerSavedCardsFromPaystack,
  deleteCardFromCustomer,
};
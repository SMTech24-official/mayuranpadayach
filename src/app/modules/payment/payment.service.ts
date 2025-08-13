import httpStatus from 'http-status';
import axios from 'axios';
import crypto from 'crypto';
import config from '../../../config';
import { PaymentStatus, bookingStatus, UserRole } from '@prisma/client';
import { notificationService } from '../notification/notification.service';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';

// PayFast configuration
const PAYFAST_MERCHANT_ID = '31344227';
const PAYFAST_MERCHANT_KEY = 'lvymftdltfeca';
const PAYFAST_PASSPHRASE = 'TimelifyApp1';
const PAYFAST_SANDBOX = process.env.NODE_ENV !== 'production';
const PAYFAST_BASE_URL = PAYFAST_SANDBOX 
  ? 'https://sandbox.payfast.co.za' 
  : 'https://www.payfast.co.za';

// Helper function to generate PayFast signature
const generatePayFastSignature = (data: Record<string, any>, passphrase: string = ''): string => {
  let paramString = '';
  const sortedKeys = Object.keys(data).sort();
  
  for (const key of sortedKeys) {
    if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
      paramString += `${key}=${encodeURIComponent(data[key].toString().trim())}&`;
    }
  }
  
  paramString = paramString.slice(0, -1);
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }
  
  return crypto.createHash('md5').update(paramString).digest('hex');
};

// Helper function to verify PayFast signature
const verifyPayFastSignature = (data: Record<string, any>, signature: string, passphrase: string = ''): boolean => {
  const generatedSignature = generatePayFastSignature(data, passphrase);
  return generatedSignature === signature;
};

// Helper function for PayFast API requests
const payfastRequest = async (method: 'GET' | 'POST', endpoint: string, data: Record<string, any> = {}) => {
  try {
    const response = await axios({
      method,
      url: `${PAYFAST_BASE_URL}${endpoint}`,
      data: method === 'POST' ? data : undefined,
      params: method === 'GET' ? data : undefined,
      headers: {
        'Content-Type': 'application/json',
        'merchant-id': PAYFAST_MERCHANT_ID,
        'version': 'v1',
        'timestamp': new Date().toISOString(),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('PayFast API Error:', error.response?.data || error.message);
    throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || 'PayFast API error');
  }
};

// Create PayFast sub-merchant for professionals (placeholder, to be confirmed with PayFast)
const createPayfastSubMerchant = async (professionalId: string) => {
  const professional = await prisma.user.findUnique({
    where: { id: professionalId },
    select: { email: true, fullName: true, role: true, payfastMerchantId: true },
  });

  if (!professional) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Professional not found');
  }

  if (professional.role !== UserRole.PROFESSIONAL) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User is not a professional');
  }

  if (professional.payfastMerchantId) {
    return { payfastMerchantId: professional.payfastMerchantId };
  }

  // Placeholder: PayFast does not explicitly support sub-merchant accounts.
  const payfastMerchantId = `MERCHANT_${professionalId}_${Date.now()}`;

  await prisma.user.update({
    where: { id: professionalId },
    data: { payfastMerchantId },
  });

  return { payfastMerchantId };
};

// Create payment form data for PayFast
const createPaymentFormData = (bookingId: string, amount: number, userEmail: string, userName: string) => {
  const paymentData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
    cancel_url: `${process.env.FRONTEND_BASE_URL}/payment-cancel`,
    notify_url: `${process.env.BACKEND_BASE_URL}/api/v1/payments/payfast-notify`,
    name_first: userName.split(' ')[0] || 'User',
    name_last: userName.split(' ').slice(1).join(' ') || 'User',
    email_address: userEmail,
    m_payment_id: bookingId,
    amount: amount.toFixed(2),
    item_name: `Booking Payment - ${bookingId}`,
    item_description: `Payment for booking #${bookingId}`,
    custom_str1: bookingId,
    custom_str2: 'HOLD',
  };

  const signature = generatePayFastSignature(paymentData, PAYFAST_PASSPHRASE);
  
  return {
    ...paymentData,
    signature,
    payment_url: `${PAYFAST_BASE_URL}/eng/process`,
  };
};

// Initialize payment with hold status
const authorizedPaymentWithHoldFromPayfast = async (userId: string, payload: { bookingId: string }) => {
  const { bookingId } = payload;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true, role: true, payfastCustomerId: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (user.role !== UserRole.USER) {
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
    select: { id: true, email: true, payfastMerchantId: true },
  });

  if (!professional) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Professional not found');
  }

  // Create or fetch PayFast sub-merchant ID for professional
  const { payfastMerchantId } = await createPayfastSubMerchant(professional.id);

  // Generate placeholder payfastCustomerId if not exists
  let payfastCustomerId = user.payfastCustomerId;
  if (!payfastCustomerId) {
    payfastCustomerId = `CUST_${userId}_${Date.now()}`;
    await prisma.user.update({
      where: { id: userId },
      data: { payfastCustomerId },
    });
  }

  // Create payment form data
  const paymentFormData = createPaymentFormData(
    bookingId,
    booking.totalPrice,
    user.email,
    user.fullName
  );

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      paymentId: `PF_${bookingId}_${Date.now()}`,
      paymentAmount: booking.totalPrice,
      bookingId,
      payfastMPaymentId: paymentFormData.m_payment_id,
      payfastSignature: paymentFormData.signature,
      paymentMethod: 'PAYFAST',
      status: PaymentStatus.REQUIRES_CAPTURE,
      //paystackCustomerCodeProvider: user.email,
      //paystackSubaccountCodeReceiver: professional.id,
    },
  });

  if (!payment) {
    throw new ApiError(httpStatus.CONFLICT, 'Failed to save payment information');
  }

  // Update booking payment status
  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: true },
  });

  return {
    paymentFormData,
    paymentUrl: paymentFormData.payment_url,
    paymentId: payment.paymentId,
  };
};

// Handle PayFast ITN (Instant Transaction Notification)
const handlePayfastNotification = async (notificationData: Record<string, any>) => {
  try {
    console.log('PayFast ITN Data:', JSON.stringify(notificationData, null, 2)); // Log ITN data for debugging

    const { signature, ...dataWithoutSignature } = notificationData;
    
    if (!verifyPayFastSignature(dataWithoutSignature, signature, PAYFAST_PASSPHRASE)) {
      console.error('Invalid PayFast signature:', { received: signature, generated: generatePayFastSignature(dataWithoutSignature, PAYFAST_PASSPHRASE) });
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid PayFast signature');
    }

    const bookingId = notificationData.custom_str1;
    const paymentStatus = notificationData.payment_status;
    const customStr2 = notificationData.custom_str2;
    const payfastPaymentId = notificationData.pf_payment_id; // Ensure this matches PayFast's field name
    const payfastCustomerId = notificationData.token || notificationData.customer_id;

    if (!bookingId) {
      console.error('Missing bookingId in ITN:', notificationData);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID not found in notification');
    }

    const payment = await prisma.payment.findFirst({
      where: { 
        OR: [
          { paymentId: notificationData.m_payment_id },
          { bookingId: bookingId }
        ]
      },
      include: { booking: { select: { userId: true } } },
    });

    if (!payment) {
      console.error('Payment not found for bookingId:', bookingId);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment not found');
    }

    // Update user with payfastCustomerId if provided
    if (payfastCustomerId && payment.booking.userId) {
      await prisma.user.update({
        where: { id: payment.booking.userId },
        data: { payfastCustomerId },
      });
      console.log(`Updated payfastCustomerId for user ${payment.booking.userId}: ${payfastCustomerId}`);
    }

    // Update payment and booking based on PayFast status
    if (paymentStatus === 'COMPLETE') {
      if (customStr2 === 'HOLD') {
        const updateData: any = {
          status: PaymentStatus.REQUIRES_CAPTURE,
          payfastSignature: signature,
          payfastMPaymentId: notificationData.m_payment_id,
        };

        // Only update payfastPaymentId if it's provided
        if (payfastPaymentId) {
          updateData.payfastPaymentId = payfastPaymentId;
        } else {
          console.warn('No pf_payment_id in ITN data:', notificationData);
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: updateData,
        });

        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: true },
        });

        console.log(`Updated payment ${payment.id} with payfastPaymentId: ${payfastPaymentId}`);
      } else if (customStr2 === 'RELEASE') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.COMPLETED },
        });

        await prisma.booking.update({
          where: { id: bookingId },
          data: { bookingStatus: bookingStatus.COMPLETED },
        });

        console.log(`Completed payment ${payment.id} and booking ${bookingId}`);
      }
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: false },
      });

      console.log(`Marked payment ${payment.id} as FAILED for booking ${bookingId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('PayFast notification error:', error.message, error.stack);
    throw error;
  }
};

// Request completion by professional
const requestCompletion = async (userId: string, payload: { bookingId: string }) => {
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

  if (user?.fcmToken) {
    const notificationTitle = 'Booking Completion Requested';
    const notificationBody = `The professional has requested completion for booking #${bookingId}. Please confirm.`;
    await notificationService.sendNotification(
      user.fcmToken,
      notificationTitle,
      notificationBody,
      booking.userId
    );
  }

  return updatedBooking;
};

// Confirm completion and release payment
const confirmCompletionAndReleasePayment = async (userId: string, payload: { bookingId: string }) => {
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
    select: { id: true, paymentId: true, paymentAmount: true, status: true },
  });

  if (!payment) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment not found');
  }

  if (payment.status !== PaymentStatus.REQUIRES_CAPTURE) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment is not in held status');
  }

  const amount = payment.paymentAmount;
  const adminCommission = Math.round(amount * 0.17);
  const professionalAmount = amount - adminCommission;

  const professional = await prisma.user.findUnique({
    where: { id: booking.business.userId },
    select: { id: true, fcmToken: true, payfastMerchantId: true },
  });

  if (!professional) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Professional not found');
  }

  // Update payment and booking status
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.COMPLETED },
  });

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: bookingStatus.COMPLETED },
  });

  // Create payout record
  await prisma.payout.create({
    data: {
      professionalId: professional.id,
      bookingId,
      amount: professionalAmount,
      adminCommission,
      status: 'PENDING',
      paymentMethod: 'PAYFAST',
      payfastPayoutId: `PO_${bookingId}_${Date.now()}`,
    },
  });

  // Send notifications
  if (user.fcmToken) {
    const notificationTitle = 'Booking Completed';
    const notificationBody = `Booking #${bookingId} has been completed. Payment released.`;
    await notificationService.sendNotification(
      user.fcmToken,
      notificationTitle,
      notificationBody,
      userId
    );
  }

  if (professional.fcmToken) {
    const notificationTitle = 'Payment Released';
    const notificationBody = `Payment of ${professionalAmount.toFixed(2)} ZAR will be transferred for booking #${bookingId}.`;
    await notificationService.sendNotification(
      professional.fcmToken,
      notificationTitle,
      notificationBody,
      professional.id
    );
  }

  return { 
    booking: updatedBooking, 
    payment: updatedPayment,
    professionalPayout: professionalAmount,
    adminCommission,
  };
};

// Refund payment to customer
const refundPaymentToCustomer = async (payload: { bookingId: string; reason?: string }) => {
  const { bookingId, reason = 'Booking cancellation' } = payload;

  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    select: { id: true, paymentId: true, status: true, paymentAmount: true },
  });

  if (!payment) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment not found');
  }

  if (payment.status !== PaymentStatus.REQUIRES_CAPTURE) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment cannot be refunded');
  }

  let payfastRefundId: string | undefined;
  try {
    const refundResponse = await payfastRequest('POST', '/refunds', {
      payment_id: payment.paymentId,
      amount: payment.paymentAmount,
      reason,
    });
    payfastRefundId = refundResponse?.refund_id;
  } catch (error) {
    console.warn('PayFast refund API not available, process manually via merchant portal');
    payfastRefundId = `REFUND_${bookingId}_${Date.now()}`;
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.REFUNDED },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { 
      bookingStatus: bookingStatus.CANCELLED, 
      paymentStatus: false,
    },
  });

  await prisma.refund.create({
    data: {
      paymentId: payment.id,
      bookingId,
      amount: payment.paymentAmount,
      reason,
      status: 'PENDING',
      refundMethod: 'PAYFAST',
      payfastRefundId,
    },
  });

  return {
    success: true,
    message: 'Refund initiated. Check PayFast merchant portal if manual processing is required.',
    refundAmount: payment.paymentAmount,
  };
};

// Get payment status
const getPaymentStatus = async (bookingId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    include: {
      booking: {
        select: {
          bookingStatus: true,
          totalPrice: true,
        },
      },
    },
  });

  if (!payment) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment not found');
  }

  return {
    paymentId: payment.paymentId,
    status: payment.status,
    amount: payment.paymentAmount,
    bookingStatus: payment.booking.bookingStatus,
    createdAt: payment.createdAt
  };
};

// Verify payment signature
const verifyPaymentSignature = async (payload: Record<string, any>, signature: string) => {
  const { signature: _, ...dataWithoutSignature } = payload;
  return verifyPayFastSignature(dataWithoutSignature, signature, PAYFAST_PASSPHRASE);
};

export const paymentService = {
  createPayfastSubMerchant,
  authorizedPaymentWithHoldFromPayfast,
  handlePayfastNotification,
  requestCompletion,
  confirmCompletionAndReleasePayment,
  refundPaymentToCustomer,
  getPaymentStatus,
  verifyPaymentSignature,
  generatePayFastSignature,
  verifyPayFastSignature,
};
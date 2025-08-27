// import httpStatus from 'http-status';
// import axios from 'axios';
// import crypto from 'crypto';
// import config from '../../../config';
// import { PaymentStatus, bookingStatus, UserRole } from '@prisma/client';
// import { notificationService } from '../notification/notification.service';
// import ApiError from '../../../errors/ApiErrors';
// import prisma from '../../../shared/prisma';

// // PayFast configuration - MOVED TO ENVIRONMENT VARIABLES
// const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '31344227';
// const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || 'lvymftdltfeca';
// const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || 'TimelifyApp1';
// const PAYFAST_SANDBOX = process.env.NODE_ENV !== 'production';
// const PAYFAST_BASE_URL = PAYFAST_SANDBOX 
//   ? 'https://sandbox.payfast.co.za' 
//   : 'https://www.payfast.co.za';

// // Validate required configuration
// if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
//   throw new Error('PayFast configuration missing. Check environment variables.');
// }

// // Helper function to generate PayFast signature
// const generatePayFastSignature = (data: Record<string, any>, passphrase: string = ''): string => {
//   let paramString = '';
//   const sortedKeys = Object.keys(data).sort();
  
//   for (const key of sortedKeys) {
//     if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
//       paramString += `${key}=${encodeURIComponent(data[key].toString().trim())}&`;
//     }
//   }
  
//   paramString = paramString.slice(0, -1);
//   if (passphrase) {
//     paramString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
//   }
  
//   return crypto.createHash('md5').update(paramString).digest('hex');
// };

// // Helper function to verify PayFast signature
// const verifyPayFastSignature = (data: Record<string, any>, signature: string, passphrase: string = ''): boolean => {
//   const generatedSignature = generatePayFastSignature(data, passphrase);
//   return generatedSignature === signature;
// };

// // Encryption helpers for sensitive data
// const encrypt = (text: string): string => {
//   const algorithm = 'aes-256-cbc';
//   const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
//   const iv = crypto.randomBytes(16);
//   const cipher = crypto.createCipher(algorithm, key);
//   let encrypted = cipher.update(text, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
//   return `${iv.toString('hex')}:${encrypted}`;
// };

// const decrypt = (encryptedText: string): string => {
//   const algorithm = 'aes-256-cbc';
//   const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
//   const [ivHex, encrypted] = encryptedText.split(':');
//   const iv = Buffer.from(ivHex, 'hex');
//   const decipher = crypto.createDecipher(algorithm, key);
//   let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// };

// // Helper function for PayFast API requests
// const payfastRequest = async (method: 'GET' | 'POST', endpoint: string, data: Record<string, any> = {}) => {
//   try {
//     const timestamp = new Date().toISOString();
//     const signature = generatePayFastSignature({ ...data, timestamp }, PAYFAST_PASSPHRASE);
    
//     const response = await axios({
//       method,
//       url: `${PAYFAST_BASE_URL}${endpoint}`,
//       data: method === 'POST' ? data : undefined,
//       params: method === 'GET' ? data : undefined,
//       headers: {
//         'Content-Type': 'application/json',
//         'merchant-id': PAYFAST_MERCHANT_ID,
//         'version': 'v1',
//         'timestamp': timestamp,
//         'signature': signature,
//       },
//       timeout: 30000,
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error('PayFast API Error:', error.response?.data || error.message);
//     throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || 'PayFast API error');
//   }
// };

// // NEW: Add user payment method (card tokenization)
// const addUserPaymentMethod = async (userId: string, payload: {
//   cardNumber: string;
//   expiryMonth: string;
//   expiryYear: string;
//   cvv: string;
//   cardHolderName: string;
// }) => {
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { role: true, email: true, fullName: true }
//   });

//   if (!user || user.role !== UserRole.USER) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'Only users can add payment methods');
//   }

//   // Tokenize card with PayFast
//   const tokenizationData = {
//     merchant_id: PAYFAST_MERCHANT_ID,
//     merchant_key: PAYFAST_MERCHANT_KEY,
//     email_address: user.email,
//     name_first: user.fullName.split(' ')[0] || 'User',
//     name_last: user.fullName.split(' ').slice(1).join(' ') || 'User',
//     card_number: payload.cardNumber,
//     card_expiry_month: payload.expiryMonth,
//     card_expiry_year: payload.expiryYear,
//     card_cvv: payload.cvv,
//   };

//   try {
//     // For sandbox, create a mock token. In production, use PayFast tokenization API
//     const cardToken = PAYFAST_SANDBOX 
//       ? `token_${userId}_${Date.now()}`
//       : await payfastRequest('POST', '/api/v1/tokens', tokenizationData);

//     const cardLastFour = payload.cardNumber.slice(-4);
//     const cardType = detectCardType(payload.cardNumber);

//     // Store tokenized card in database
//     const paymentMethod = await prisma.userPaymentMethod.create({
//       data: {
//         userId,
//         payfastToken: typeof cardToken === 'string' ? cardToken : cardToken.token,
//         cardLastFour,
//         cardType,
//         cardHolderName: payload.cardHolderName,
//         expiryMonth: payload.expiryMonth,
//         expiryYear: payload.expiryYear,
//         isDefault: false,
//       }
//     });

//     return {
//       id: paymentMethod.id,
//       cardLastFour,
//       cardType,
//       expiryMonth: payload.expiryMonth,
//       expiryYear: payload.expiryYear,
//       isDefault: paymentMethod.isDefault,
//     };

//   } catch (error: any) {
//     console.error('Card tokenization failed:', error.message);
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to add payment method');
//   }
// };

// // NEW: Add professional bank account
// const addProfessionalBankAccount = async (professionalId: string, payload: {
//   accountNumber: string;
//   bankCode: string;
//   accountType: 'SAVINGS' | 'CURRENT';
//   accountHolderName: string;
//   branchCode?: string;
// }) => {
//   const professional = await prisma.user.findUnique({
//     where: { id: professionalId },
//     select: { role: true, fullName: true }
//   });

//   if (!professional || professional.role !== UserRole.PROFESSIONAL) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'Only professionals can add bank accounts');
//   }

//   // Basic validation for South African bank account
//   if (!/^\d{10,11}$/.test(payload.accountNumber)) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid account number format');
//   }

//   if (!/^\d{6}$/.test(payload.bankCode)) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid bank code format');
//   }

//   // Check if account already exists
//   const existingAccount = await prisma.professionalBankAccount.findFirst({
//     where: {
//       professionalId,
//       accountNumber: encrypt(payload.accountNumber),
//     }
//   });

//   if (existingAccount) {
//     throw new ApiError(httpStatus.CONFLICT, 'Bank account already added');
//   }

//   const bankAccount = await prisma.professionalBankAccount.create({
//     data: {
//       professionalId,
//       accountNumber: encrypt(payload.accountNumber),
//       bankCode: payload.bankCode,
//       accountType: payload.accountType,
//       accountHolderName: payload.accountHolderName,
//       branchCode: payload.branchCode,
//       verified: false, // Requires manual verification
//     }
//   });

//   return {
//     id: bankAccount.id,
//     accountLastFour: payload.accountNumber.slice(-4),
//     bankCode: payload.bankCode,
//     accountType: payload.accountType,
//     accountHolderName: payload.accountHolderName,
//     verified: bankAccount.verified,
//   };
// };

// // NEW: Get user payment methods
// const getUserPaymentMethods = async (userId: string) => {
//   const paymentMethods = await prisma.userPaymentMethod.findMany({
//     where: { userId },
//     select: {
//       id: true,
//       cardLastFour: true,
//       cardType: true,
//       cardHolderName: true,
//       expiryMonth: true,
//       expiryYear: true,
//       isDefault: true,
//       createdAt: true,
//     },
//     orderBy: { createdAt: 'desc' }
//   });

//   return paymentMethods;
// };

// // NEW: Get professional bank accounts
// const getProfessionalBankAccounts = async (professionalId: string) => {
//   const bankAccounts = await prisma.professionalBankAccount.findMany({
//     where: { professionalId },
//     select: {
//       id: true,
//       accountLastFour: true,
//       bankCode: true,
//       accountType: true,
//       accountHolderName: true,
//       verified: true,
//       createdAt: true,
//     },
//     orderBy: { createdAt: 'desc' }
//   });

//   return bankAccounts.map(account => ({
//     ...account,
//     accountLastFour: account.accountNumber ? decrypt(account.accountNumber).slice(-4) : 'N/A'
//   }));
// };

// // Create PayFast sub-merchant for professionals (enhanced)
// const createPayfastSubMerchant = async (professionalId: string) => {
//   const professional = await prisma.user.findUnique({
//     where: { id: professionalId },
//     select: { 
//       email: true, 
//       fullName: true, 
//       role: true, 
//       payfastMerchantId: true,
//       professionalBankAccounts: {
//         where: { verified: true },
//         take: 1,
//       }
//     },
//   });

//   if (!professional) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Professional not found');
//   }

//   if (professional.role !== UserRole.PROFESSIONAL) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'User is not a professional');
//   }

//   if (!professional.professionalBankAccounts.length) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Professional must have verified bank account');
//   }

//   if (professional.payfastMerchantId) {
//     return { payfastMerchantId: professional.payfastMerchantId };
//   }

//   // For now, create placeholder merchant ID. In production, integrate with PayFast's actual sub-merchant system
//   const payfastMerchantId = `SUB_${professionalId}_${Date.now()}`;

//   await prisma.user.update({
//     where: { id: professionalId },
//     data: { payfastMerchantId },
//   });

//   return { payfastMerchantId };
// };

// // ENHANCED: Payment with stored card
// const authorizedPaymentWithStoredCard = async (userId: string, payload: {
//   bookingId: string;
//   paymentMethodId: string;
// }) => {
//   const { bookingId, paymentMethodId } = payload;

//   // Get user's payment method
//   const paymentMethod = await prisma.userPaymentMethod.findFirst({
//     where: {
//       id: paymentMethodId,
//       userId,
//     }
//   });

//   if (!paymentMethod) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Payment method not found');
//   }

//   const booking = await prisma.booking.findUnique({
//     where: { id: bookingId },
//     include: {
//       business: { 
//         select: { 
//           userId: true,
//           user: {
//             select: {
//               professionalBankAccounts: {
//                 where: { verified: true },
//                 take: 1,
//               }
//             }
//           }
//         } 
//       },
//       service: { select: { price: true } },
//     },
//   });

//   if (!booking) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Booking not found');
//   }

//   if (booking.userId !== userId) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'User not authorized for this booking');
//   }

//   if (!booking.business.user.professionalBankAccounts.length) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Professional must have verified bank account');
//   }

//   // Create authorization (hold) for the payment
//   const chargeData = {
//     merchant_id: PAYFAST_MERCHANT_ID,
//     merchant_key: PAYFAST_MERCHANT_KEY,
//     token: paymentMethod.payfastToken,
//     amount: booking.totalPrice.toFixed(2),
//     item_name: `Booking Payment - ${bookingId}`,
//     m_payment_id: bookingId,
//     capture: false, // Hold the payment
//   };

//   try {
//     // For sandbox, simulate authorization. In production, use actual PayFast API
//     const authResponse = PAYFAST_SANDBOX 
//       ? { authorization_id: `auth_${bookingId}_${Date.now()}`, status: 'authorized' }
//       : await payfastRequest('POST', '/api/v1/charges', chargeData);

//     // Create payment record
//     const payment = await prisma.payment.create({
//       data: {
//         paymentId: `PF_${bookingId}_${Date.now()}`,
//         paymentAmount: booking.totalPrice,
//         bookingId,
//         payfastAuthorizationId: authResponse.authorization_id,
//         payfastToken: paymentMethod.payfastToken,
//         paymentMethod: 'PAYFAST_CARD',
//         status: PaymentStatus.REQUIRES_CAPTURE,
//         userPaymentMethodId: paymentMethodId,
//         professionalBankAccountId: booking.business.user.professionalBankAccounts[0].id,
//       },
//     });

//     await prisma.booking.update({
//       where: { id: bookingId },
//       data: { paymentStatus: true },
//     });

//     return {
//       paymentId: payment.paymentId,
//       authorizationId: authResponse.authorization_id,
//       amount: booking.totalPrice,
//       cardLastFour: paymentMethod.cardLastFour,
//     };

//   } catch (error: any) {
//     console.error('Card authorization failed:', error.message);
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Payment authorization failed');
//   }
// };

// // Original payment form data creation (kept for backward compatibility)
// const createPaymentFormData = (bookingId: string, amount: number, userEmail: string, userName: string) => {
//   const paymentData = {
//     merchant_id: PAYFAST_MERCHANT_ID,
//     merchant_key: PAYFAST_MERCHANT_KEY,
//     return_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
//     cancel_url: `${process.env.FRONTEND_BASE_URL}/payment-cancel`,
//     notify_url: `${process.env.BACKEND_BASE_URL}/api/v1/payments/payfast-notify`,
//     name_first: userName.split(' ')[0] || 'User',
//     name_last: userName.split(' ').slice(1).join(' ') || 'User',
//     email_address: userEmail,
//     m_payment_id: bookingId,
//     amount: amount.toFixed(2),
//     item_name: `Booking Payment - ${bookingId}`,
//     item_description: `Payment for booking #${bookingId}`,
//     custom_str1: bookingId,
//     custom_str2: 'HOLD',
//   };

//   const signature = generatePayFastSignature(paymentData, PAYFAST_PASSPHRASE);
  
//   return {
//     ...paymentData,
//     signature,
//     payment_url: `${PAYFAST_BASE_URL}/eng/process`,
//   };
// };

// // Original payment initialization (kept for backward compatibility)
// const authorizedPaymentWithHoldFromPayfast = async (userId: string, payload: { bookingId: string }) => {
//   const { bookingId } = payload;

//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { email: true, fullName: true, role: true, payfastCustomerId: true },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
//   }

//   if (user.role !== UserRole.USER) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'Only USERs can authorize payments');
//   }

//   const booking = await prisma.booking.findUnique({
//     where: { id: bookingId },
//     include: {
//       business: { select: { userId: true } },
//       service: { select: { price: true } },
//     },
//   });

//   if (!booking) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Booking not found');
//   }

//   if (booking.userId !== userId) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'User not authorized for this booking');
//   }

//   if (booking.bookingStatus !== bookingStatus.PENDING) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is not in PENDING status');
//   }

//   const professional = await prisma.user.findUnique({
//     where: { id: booking.business.userId },
//     select: { 
//       id: true, 
//       email: true, 
//       payfastMerchantId: true,
//       professionalBankAccounts: {
//         where: { verified: true },
//         take: 1,
//       }
//     },
//   });

//   if (!professional) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Professional not found');
//   }

//   if (!professional.professionalBankAccounts.length) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Professional must have verified bank account');
//   }

//   // Create or fetch PayFast sub-merchant ID for professional
//   const { payfastMerchantId } = await createPayfastSubMerchant(professional.id);

//   // Generate placeholder payfastCustomerId if not exists
//   let payfastCustomerId = user.payfastCustomerId;
//   if (!payfastCustomerId) {
//     payfastCustomerId = `CUST_${userId}_${Date.now()}`;
//     await prisma.user.update({
//       where: { id: userId },
//       data: { payfastCustomerId },
//     });
//   }

//   // Create payment form data
//   const paymentFormData = createPaymentFormData(
//     bookingId,
//     booking.totalPrice,
//     user.email,
//     user.fullName
//   );

//   // Create payment record
//   const payment = await prisma.payment.create({
//     data: {
//       paymentId: `PF_${bookingId}_${Date.now()}`,
//       paymentAmount: booking.totalPrice,
//       bookingId,
//       payfastMPaymentId: paymentFormData.m_payment_id,
//       payfastSignature: paymentFormData.signature,
//       paymentMethod: 'PAYFAST',
//       status: PaymentStatus.REQUIRES_CAPTURE,
//       professionalBankAccountId: professional.professionalBankAccounts[0].id,
//     },
//   });

//   if (!payment) {
//     throw new ApiError(httpStatus.CONFLICT, 'Failed to save payment information');
//   }

//   // Update booking payment status
//   await prisma.booking.update({
//     where: { id: bookingId },
//     data: { paymentStatus: true },
//   });

//   return {
//     paymentFormData,
//     paymentUrl: paymentFormData.payment_url,
//     paymentId: payment.paymentId,
//   };
// };

// // Handle PayFast ITN (enhanced with better error handling)
// const handlePayfastNotification = async (notificationData: Record<string, any>) => {
//   try {
//     console.log('PayFast ITN Data:', JSON.stringify(notificationData, null, 2));

//     const { signature, ...dataWithoutSignature } = notificationData;
    
//     if (!verifyPayFastSignature(dataWithoutSignature, signature, PAYFAST_PASSPHRASE)) {
//       console.error('Invalid PayFast signature:', { 
//         received: signature, 
//         generated: generatePayFastSignature(dataWithoutSignature, PAYFAST_PASSPHRASE) 
//       });
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid PayFast signature');
//     }

//     const bookingId = notificationData.custom_str1;
//     const paymentStatus = notificationData.payment_status;
//     const customStr2 = notificationData.custom_str2;
//     const payfastPaymentId = notificationData.pf_payment_id;
//     const payfastCustomerId = notificationData.token || notificationData.customer_id;

//     if (!bookingId) {
//       console.error('Missing bookingId in ITN:', notificationData);
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID not found in notification');
//     }

//     const payment = await prisma.payment.findFirst({
//       where: { 
//         OR: [
//           { paymentId: notificationData.m_payment_id },
//           { bookingId: bookingId }
//         ]
//       },
//       include: { 
//         booking: { select: { userId: true } },
//         professionalBankAccount: true,
//       },
//     });

//     if (!payment) {
//       console.error('Payment not found for bookingId:', bookingId);
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Payment not found');
//     }

//     // Update user with payfastCustomerId if provided
//     if (payfastCustomerId && payment.booking.userId) {
//       await prisma.user.update({
//         where: { id: payment.booking.userId },
//         data: { payfastCustomerId },
//       });
//       console.log(`Updated payfastCustomerId for user ${payment.booking.userId}: ${payfastCustomerId}`);
//     }

//     // Update payment and booking based on PayFast status
//     if (paymentStatus === 'COMPLETE') {
//       if (customStr2 === 'HOLD') {
//         const updateData: any = {
//           status: PaymentStatus.REQUIRES_CAPTURE,
//           payfastSignature: signature,
//           payfastMPaymentId: notificationData.m_payment_id,
//         };

//         if (payfastPaymentId) {
//           updateData.payfastPaymentId = payfastPaymentId;
//         }

//         await prisma.payment.update({
//           where: { id: payment.id },
//           data: updateData,
//         });

//         await prisma.booking.update({
//           where: { id: bookingId },
//           data: { paymentStatus: true },
//         });

//         console.log(`Payment held successfully: ${payment.id}`);
//       } else if (customStr2 === 'RELEASE') {
//         await releasePaymentToProfessional(bookingId);
//         console.log(`Payment released: ${payment.id}`);
//       }
//     } else {
//       await prisma.payment.update({
//         where: { id: payment.id },
//         data: { status: PaymentStatus.FAILED },
//       });

//       await prisma.booking.update({
//         where: { id: bookingId },
//         data: { paymentStatus: false },
//       });

//       console.log(`Payment failed: ${payment.id}`);
//     }

//     return { success: true };
//   } catch (error: any) {
//     console.error('PayFast notification error:', error.message, error.stack);
//     throw error;
//   }
// };

// // ENHANCED: Release payment to professional with actual payout
// const releasePaymentToProfessional = async (bookingId: string) => {
//   const payment = await prisma.payment.findUnique({
//     where: { bookingId },
//     include: {
//       professionalBankAccount: true,
//       booking: {
//         include: {
//           business: {
//             select: {
//               userId: true,
//               user: {
//                 select: { fcmToken: true }
//               }
//             }
//           }
//         }
//       }
//     }
//   });

//   if (!payment) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Payment not found');
//   }

//   if (payment.status !== PaymentStatus.REQUIRES_CAPTURE) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Payment cannot be released');
//   }

//   if (!payment.professionalBankAccount) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Professional bank account not found');
//   }

//   const amount = payment.paymentAmount;
//   const adminCommission = Math.round(amount * 0.17);
//   const professionalAmount = amount - adminCommission;

//   try {
//     // 1. Capture the held payment if it's a card payment
//     if (payment.payfastAuthorizationId) {
//       const captureData = {
//         merchant_id: PAYFAST_MERCHANT_ID,
//         merchant_key: PAYFAST_MERCHANT_KEY,
//         authorization_id: payment.payfastAuthorizationId,
//         amount: amount.toFixed(2),
//       };

//       if (!PAYFAST_SANDBOX) {
//         await payfastRequest('POST', `/api/v1/charges/${payment.payfastAuthorizationId}/capture`, captureData);
//       }
//     }

//     // 2. Initiate payout to professional's bank account
//     const payoutData = {
//       merchant_id: PAYFAST_MERCHANT_ID,
//       merchant_key: PAYFAST_MERCHANT_KEY,
//       amount: professionalAmount.toFixed(2),
//       recipient_account: decrypt(payment.professionalBankAccount.accountNumber),
//       recipient_bank_code: payment.professionalBankAccount.bankCode,
//       recipient_name: payment.professionalBankAccount.accountHolderName,
//       reference: `Payout_${bookingId}`,
//     };

//     let payoutId: string;
//     if (PAYFAST_SANDBOX) {
//       payoutId = `PO_SANDBOX_${bookingId}_${Date.now()}`;
//       console.log('Sandbox payout simulated:', payoutData);
//     } else {
//       const payoutResponse = await payfastRequest('POST', '/api/v1/payouts', payoutData);
//       payoutId = payoutResponse.payout_id;
//     }

//     // Update payment status
//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: { 
//         status: PaymentStatus.COMPLETED,
//         payfastPayoutId: payoutId,
//       },
//     });

//     // Update booking status
//     await prisma.booking.update({
//       where: { id: bookingId },
//       data: { bookingStatus: bookingStatus.COMPLETED },
//     });

//     // Create payout record
//     await prisma.payout.create({
//       data: {
//         professionalId: payment.booking.business.userId,
//         bookingId,
//         amount: professionalAmount,
//         adminCommission,
//         status: 'COMPLETED',
//         paymentMethod: 'BANK_TRANSFER',
//         payfastPayoutId: payoutId,
//       },
//     });

//     // Send notification to professional
//     if (payment.booking.business.user.fcmToken) {
//       await notificationService.sendNotification(
//         payment.booking.business.user.fcmToken,
//         'Payment Released',
//         `Payment of ${professionalAmount.toFixed(2)} ZAR has been transferred to your account for booking #${bookingId}.`,
//         payment.booking.business.userId
//       );
//     }

//     return {
//       success: true,
//       professionalAmount,
//       adminCommission,
//       payoutId,
//     };

//   } catch (error: any) {
//     console.error('Payment release failed:', error.message);
    
//     // Mark as failed and create manual processing record
//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: { status: PaymentStatus.FAILED },
//     });
    
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to release payment');
//   }
// };

// // Rest of your existing functions (requestCompletion, confirmCompletionAndReleasePayment, etc.)
// const requestCompletion = async (userId: string, payload: { bookingId: string }) => {
//   const { bookingId } = payload;

//   const professional = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { role: true },
//   });

//   if (!professional || professional.role !== UserRole.PROFESSIONAL) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'Only PROFESSIONALs can request completion');
//   }

//   const booking = await prisma.booking.findUnique({
//     where: { id: bookingId },
//     include: { business: { select: { userId: true } } },
//   });

//   if (!booking) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Booking not found');
//   }

//   if (booking.business.userId !== userId) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'Professional not authorized for this booking');
//   }

//   if (booking.bookingStatus !== bookingStatus.PENDING) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is not in PENDING status');
//   }

//   const updatedBooking = await prisma.booking.update({
//     where: { id: bookingId },
//     data: { bookingStatus: bookingStatus.COMPLETE_REQUEST },
//   });

//   const user = await prisma.user.findUnique({
//     where: { id: booking.userId },
//     select: { fcmToken: true },
//   });

//   if (user?.fcmToken) {
//     const notificationTitle = 'Booking Completion Requested';
//     const notificationBody = `The professional has requested completion
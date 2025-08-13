import { z } from 'zod';

const initializePayment = z.object({
  body: z.object({
    bookingId: z.string({
      required_error: 'Booking ID is required',
    }).min(1, 'Booking ID cannot be empty'),
  }),
});

const requestCompletion = z.object({
  body: z.object({
    bookingId: z.string({
      required_error: 'Booking ID is required',
    }).min(1, 'Booking ID cannot be empty'),
  }),
});

const confirmCompletion = z.object({
  body: z.object({
    bookingId: z.string({
      required_error: 'Booking ID is required',
    }).min(1, 'Booking ID cannot be empty'),
  }),
});

const refundPayment = z.object({
  body: z.object({
    bookingId: z.string({
      required_error: 'Booking ID is required',
    }).min(1, 'Booking ID cannot be empty'),
    reason: z.string().optional().default('Booking cancellation'),
  }),
});

const verifyPayment = z.object({
  body: z.object({
    signature: z.string({
      required_error: 'Signature is required',
    }).min(1, 'Signature cannot be empty'),
    // PayFast notification fields
    m_payment_id: z.string().optional(),
    pf_payment_id: z.string().optional(),
    payment_status: z.string().optional(),
    item_name: z.string().optional(),
    amount_gross: z.string().optional(),
    amount_fee: z.string().optional(),
    amount_net: z.string().optional(),
    custom_str1: z.string().optional(),
    custom_str2: z.string().optional(),
    custom_str3: z.string().optional(),
    custom_str4: z.string().optional(),
    custom_str5: z.string().optional(),
    custom_int1: z.string().optional(),
    custom_int2: z.string().optional(),
    custom_int3: z.string().optional(),
    custom_int4: z.string().optional(),
    custom_int5: z.string().optional(),
    name_first: z.string().optional(),
    name_last: z.string().optional(),
    email_address: z.string().optional(),
  }),
});

// Validation for PayFast ITN (more lenient as it comes from PayFast)
const payfastNotification = z.object({
  body: z.object({
    m_payment_id: z.string(),
    pf_payment_id: z.string(),
    payment_status: z.enum(['COMPLETE', 'CANCELLED', 'FAILED']),
    item_name: z.string(),
    item_description: z.string().optional(),
    amount_gross: z.string(),
    amount_fee: z.string(),
    amount_net: z.string(),
    custom_str1: z.string().optional(), // booking ID
    custom_str2: z.string().optional(), // HOLD or RELEASE
    custom_str3: z.string().optional(),
    custom_str4: z.string().optional(),
    custom_str5: z.string().optional(),
    custom_int1: z.string().optional(),
    custom_int2: z.string().optional(),
    custom_int3: z.string().optional(),
    custom_int4: z.string().optional(),
    custom_int5: z.string().optional(),
    name_first: z.string(),
    name_last: z.string(),
    email_address: z.string().email(),
    merchant_id: z.string(),
    signature: z.string(),
  }),
});

export const PaymentValidation = {
  initializePayment,
  requestCompletion,
  confirmCompletion,
  refundPayment,
  verifyPayment,
  payfastNotification,
};
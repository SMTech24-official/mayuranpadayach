import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { bookingController } from './booking.controller';
import { bookingValidation } from './booking.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/',
auth(UserRole.USER),
//validateRequest(bookingValidation.createSchema),
bookingController.createBooking,
);

router.get('/', auth(UserRole.ADMIN), bookingController.getBookingList);

router.get(
'/user-bookings',
auth(UserRole.USER, UserRole.PROFESSIONAL),
bookingController.getListForUser,
);

router.get(
'/time-slots',
auth(),
bookingController.getTimeSlots,
);

router.get('/:id', auth(), bookingController.getBookingById);

router.put(
'/:id',
auth(),
validateRequest(bookingValidation.updateSchema),
bookingController.updateBooking,
);

router.delete('/:id', auth(UserRole.ADMIN), bookingController.deleteBooking);

export const bookingRoutes = router;
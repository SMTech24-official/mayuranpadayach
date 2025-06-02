import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { bookingService } from './booking.service';
import pick from '../../../shared/pick';

export const bookingFilterableFields = [
  "bookingStatus",
  "searchTerm",
];
const getTimeSlots = catchAsync(async (req, res) => {
  const { serviceId, startTime, endTime } = req.query;

  if (!serviceId || typeof serviceId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid serviceId' });
  }

  const parsedStartTime = startTime ? new Date(startTime as string) : undefined;
  const parsedEndTime = endTime ? new Date(endTime as string) : undefined;

  const result = await bookingService.getTimeSlotsFromDb(
    serviceId,
    parsedStartTime,
    parsedEndTime
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Time slots retrieved successfully',
    data: result,
  });
});


const createBooking = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await bookingService.createIntoDb(userId,req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getBookingList = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
  const result = await bookingService.getListFromDb(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking list retrieved successfully',
    data: result,
  });
});

const getListForUser = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const filters = pick(req.query, bookingFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
  const result = await bookingService.getListForUserDB(userId, options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking list for user retrieved successfully',
    data: result,
  });
});

const getBookingById = catchAsync(async (req, res) => {
  const result = await bookingService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking details retrieved successfully',
    data: result,
  });
});

const updateBooking = catchAsync(async (req, res) => {
  const result = await bookingService.updateIntoDb(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking updated successfully',
    data: result,
  });
});

const deleteBooking = catchAsync(async (req, res) => {
  const result = await bookingService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking deleted successfully',
    data: result,
  });
});

export const bookingController = {
  getTimeSlots,
  createBooking,
  getBookingList,
  getListForUser,
  getBookingById,
  updateBooking,
  deleteBooking,
};
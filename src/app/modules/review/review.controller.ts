import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { reviewService } from './review.service';

const createReview = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await reviewService.createIntoDb(userId,req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getReviewList = catchAsync(async (req, res) => {
  const businessId = req.params.businessId;
  const result = await reviewService.getListFromDb(businessId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review list retrieved successfully',
    data: result,
  });
});

const getReviewById = catchAsync(async (req, res) => {
  const result = await reviewService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review details retrieved successfully',
    data: result,
  });
});


export const reviewController = {
  createReview,
  getReviewList,
  getReviewById
};
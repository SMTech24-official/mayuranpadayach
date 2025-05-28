import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { userSubscriptionService } from './userSubscription.service';

const createUserSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id as any;
  const result = await userSubscriptionService.createUserSubscriptionIntoDb(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'UserSubscription created successfully',
    data: result,
  });
});

const getUserSubscriptionList = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await userSubscriptionService.getUserSubscriptionListFromDb(user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My Subscription list retrieved successfully',
    data: result,
  });
});

const getUserSubscriptionListByAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userSubscriptionService.getUserSubscriptionListByAdminFromDb();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'UserSubscription list retrieved successfully',
    data: result,
  });
});

const getUserSubscriptionById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await userSubscriptionService.getUserSubscriptionByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'UserSubscription details retrieved successfully',
    data: result,
  });
});





export const userSubscriptionController = {
  createUserSubscription,
  getUserSubscriptionList,
  getUserSubscriptionListByAdmin,
  getUserSubscriptionById,
};
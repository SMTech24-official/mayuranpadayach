import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { businessService } from './business.service';
import { businessFilterableFields } from './business.constant';
import pick from '../../../shared/pick';

const createBusiness = catchAsync(async (req, res) => {
  const result = await businessService.createIntoDb(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Business created successfully',
    data: result,
  });
});

const getBusinessList = catchAsync(async (req, res) => {
  const filters = pick(req.query, businessFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])
  const result = await businessService.getListFromDb(options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business list retrieved successfully',
    data: result,
  });
});

const getListForAdmin = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await businessService.getListForAdminFromDb(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business list for admin retrieved successfully',
    data: result,
  });
});

const getBusinessById = catchAsync(async (req, res) => {
  const result = await businessService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business details retrieved successfully',
    data: result,
  });
});

const getOneByUserId = catchAsync(async (req, res) => {
  const userId = req.user.id as any;
  const result = await businessService.getOneByUserIdFromDb(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business details for user retrieved successfully',
    data: result,
  });
});


const updateBusiness = catchAsync(async (req, res) => {
  const result = await businessService.updateIntoDb(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business updated successfully',
    data: result,
  });
});

const deleteBusiness = catchAsync(async (req, res) => {
  const result = await businessService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business deleted successfully',
    data: result,
  });
});

export const businessController = {
  createBusiness,
  getBusinessList,
  getListForAdmin,
  getBusinessById,
  getOneByUserId,
  updateBusiness,
  deleteBusiness,
};
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { specialistService } from './specialist.service';
import pick from '../../../shared/pick';
import { specialistFilterableFields } from './specialist.constant';

const createSpecialist = catchAsync(async (req, res) => {
  const result = await specialistService.createIntoDb(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Specialist created successfully',
    data: result,
  });
});

const getListForUser = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, specialistFilterableFields);
  const result = await specialistService.getListForUserFromDb(options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Specialist list for user retrieved successfully',
    data: result,
  });
});

const getSpecialistList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await specialistService.getAllListFromDb(userId,options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Specialist list retrieved successfully',
    data: result,
  });
});

const getSpecialistListByBusinessId = catchAsync(async (req, res) => {
  const businessId = req.params.businessId;
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await specialistService.getAllByBusinessIdFromDb(businessId, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Specialist list by business ID retrieved successfully',
    data: result,
  });
});

const getSpecialistById = catchAsync(async (req, res) => {
  const result = await specialistService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Specialist details retrieved successfully',
    data: result,
  });
});

const updateSpecialist = catchAsync(async (req, res) => {
  const result = await specialistService.updateIntoDb(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Specialist updated successfully',
    data: result,
  });
});

const deleteSpecialist = catchAsync(async (req, res) => {
  const result = await specialistService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Specialist deleted successfully',
    data: result,
  });
});

export const specialistController = {
  createSpecialist,
  getSpecialistList,
  getListForUser,
  getSpecialistListByBusinessId,
  getSpecialistById,
  updateSpecialist,
  deleteSpecialist,
};
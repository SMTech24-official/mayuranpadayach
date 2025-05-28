import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { subCategoryService } from './subCategory.service';

const createSubCategory = catchAsync(async (req, res) => {
  const result = await subCategoryService.createIntoDb(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'SubCategory created successfully',
    data: result,
  });
});

const getSubCategoryList = catchAsync(async (req, res) => {
  const result = await subCategoryService.getListFromDb();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategory list retrieved successfully',
    data: result,
  });
});

const getSubCategoryById = catchAsync(async (req, res) => {
  const result = await subCategoryService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategory details retrieved successfully',
    data: result,
  });
});

const updateSubCategory = catchAsync(async (req, res) => {
  const result = await subCategoryService.updateIntoDb(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategory updated successfully',
    data: result,
  });
});

const deleteSubCategory = catchAsync(async (req, res) => {
  const result = await subCategoryService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategory deleted successfully',
    data: result,
  });
});

export const subCategoryController = {
  createSubCategory,
  getSubCategoryList,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
};
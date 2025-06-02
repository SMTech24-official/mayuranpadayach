import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { searchHistoryService } from './searchHistory.service';

const createSearchHistory = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await searchHistoryService.createIntoDb(userId,req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'SearchHistory created successfully',
    data: result,
  });
});

const getSearchHistoryList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await searchHistoryService.getListFromDb(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SearchHistory list retrieved successfully',
    data: result,
  });
});

const getSearchHistoryById = catchAsync(async (req, res) => {
  const result = await searchHistoryService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SearchHistory details retrieved successfully',
    data: result,
  });
});

const deleteSearchHistory = catchAsync(async (req, res) => {
  const result = await searchHistoryService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SearchHistory deleted successfully',
    data: result,
  });
});

export const searchHistoryController = {
  createSearchHistory,
  getSearchHistoryList,
  getSearchHistoryById,
  deleteSearchHistory,
};
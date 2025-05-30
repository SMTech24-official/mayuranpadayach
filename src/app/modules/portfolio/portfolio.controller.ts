import httpStatus from 'http-status';
import sendResponse from '../../utils/sendResponse';
import catchAsync from '../../utils/catchAsync';
import { portfolioService } from './portfolio.service';

const createPortfolio = catchAsync(async (req, res) => {
  const result = await portfolioService.createIntoDb(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Portfolio created successfully',
    data: result,
  });
});

const getPortfolioList = catchAsync(async (req, res) => {
  const result = await portfolioService.getListFromDb();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Portfolio list retrieved successfully',
    data: result,
  });
});

const getPortfolioById = catchAsync(async (req, res) => {
  const result = await portfolioService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Portfolio details retrieved successfully',
    data: result,
  });
});

const updatePortfolio = catchAsync(async (req, res) => {
  const result = await portfolioService.updateIntoDb(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Portfolio updated successfully',
    data: result,
  });
});

const deletePortfolio = catchAsync(async (req, res) => {
  const result = await portfolioService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Portfolio deleted successfully',
    data: result,
  });
});

export const portfolioController = {
  createPortfolio,
  getPortfolioList,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
};
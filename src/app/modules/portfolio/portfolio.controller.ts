import httpStatus from 'http-status';
import  catchAsync  from '../../../shared/catchAsync';
import  sendResponse  from '../../../shared/sendResponse';
import { portfolioService } from './portfolio.service';

const createPortfolio = catchAsync(async (req, res) => {
  const result = await portfolioService.createIntoDb(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Portfolio created successfully',
    data: result,
  });
});

const getPortfolioList = catchAsync(async (req, res) => {
  const { businessId, specialistId } = req.query;
  const result = await portfolioService.getListFromDb(businessId as any, specialistId as any);
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
  const result = await portfolioService.updateIntoDb(req);
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
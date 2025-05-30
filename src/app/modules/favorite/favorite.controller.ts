import httpStatus from 'http-status';
import  catchAsync  from '../../../shared/catchAsync';
import  sendResponse  from '../../../shared/sendResponse';
import { favoriteService } from './favorite.service';

const createFavorite = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await favoriteService.toggleFavorite(userId,req.params.businessId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Favorite created successfully',
    data: result,
  });
});

const getFavoriteList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await favoriteService.getListFromDb(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Favorite list retrieved successfully',
    data: result,
  });
});

export const favoriteController = {
  createFavorite,
  getFavoriteList,
};
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { favoriteSpecialistService } from './favoriteSpecialist.service';

const createFavoriteSpecialist = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const specialistId = req.params.specialistId;
  const result = await favoriteSpecialistService.toggleFavorite(userId, specialistId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'FavoriteSpecialist created successfully',
    data: result,
  });
});

const getFavoriteSpecialistList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await favoriteSpecialistService.getListFromDb(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'FavoriteSpecialist list retrieved successfully',
    data: result,
  });
});


export const favoriteSpecialistController = {
  createFavoriteSpecialist,
  getFavoriteSpecialistList,
};
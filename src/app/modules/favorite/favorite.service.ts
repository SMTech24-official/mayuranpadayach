import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const toggleFavorite = async (userId: string, businessId: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });
    if (!existingUser) {
      throw new ApiError(httpStatus.NOT_FOUND,'User not found');
    }
    if (!businessId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Business ID is required');
    }
   
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId, isDeleted: false },
    });
    if (!existingBusiness) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Business not found');
    }

    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: existingUser.id,
        businessId: existingBusiness.id,
      },
    });
    if (!existingFavorite) {
      const result = await prisma.favorite.create({
      data: {
        userId: existingUser.id,
        businessId: existingBusiness.id,
        isFavorite: true
      },
    });
    return result;
  } else {
    if (existingFavorite.isFavorite === true) {
      const updatedFavorite = await prisma.favorite.update({
      where: { id: existingFavorite.id },
      data: {
        isFavorite: false
      }
    })
    return updatedFavorite;
  } else {
    const updatedFavorite = await prisma.favorite.update({
      where: { id: existingFavorite.id },
      data: {
        isFavorite: true
      }
    });
    return updatedFavorite;
    }
  }
  });
  return transaction;
};

const getListFromDb = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
  });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  
    const result = await prisma.favorite.findMany({where: { isFavorite: true, userId: existingUser.id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            image: true,
            address: true,
            category:{
              select: {
                name: true,
              },
            },
            overallRating: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return result;
};

export const favoriteService = {
toggleFavorite,
getListFromDb,
};
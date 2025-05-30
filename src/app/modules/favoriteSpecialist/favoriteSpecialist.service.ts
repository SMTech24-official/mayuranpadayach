import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const toggleFavorite = async (userId: string, specialistId: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });
    if (!existingUser) {
      throw new ApiError(httpStatus.NOT_FOUND,'User not found');
    }
    if (!specialistId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Specialist ID is required');
    }
   
    const existingSpecialist = await prisma.specialist.findUnique({
      where: { id: specialistId, isDeleted: false },
    });
    if (!existingSpecialist) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Specialist not found');
    }

    const existingFavorite = await prisma.favoriteSpecialist.findFirst({
      where: {
        userId: existingUser.id,
        specialistId: existingSpecialist.id,
      },
    });
    if (!existingFavorite) {
      const result = await prisma.favoriteSpecialist.create({
      data: {
        userId: existingUser.id,
        specialistId: existingSpecialist.id,
        isFavorite: true
      },
    });
    return result;
  } else {
    if (existingFavorite.isFavorite === true) {
      const updatedFavorite = await prisma.favoriteSpecialist.update({
      where: { id: existingFavorite.id },
      data: {
        isFavorite: false
      }
    })
    return updatedFavorite;
  } else {
    const updatedFavorite = await prisma.favoriteSpecialist.update({
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
  
    const result = await prisma.favoriteSpecialist.findMany({where: { isFavorite: true, userId: existingUser.id },
      include: {
        specialist: {
          select: {
            fullName: true,
            profileImage: true,
            specialization: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    return result;
};

export const favoriteSpecialistService = {
toggleFavorite,
getListFromDb,
};
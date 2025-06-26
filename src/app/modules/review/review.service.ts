import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";


const createIntoDb = async (userId: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });
    if (!existingUser) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const existingBusiness = await prisma.business.findUnique({
      where: { id: data.businessId, isDeleted: false },
    });
    if (!existingBusiness) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Business not found');
    }
    const existingSpecialist = await prisma.specialist.findUnique({
      where: { id: data.specialistId, isDeleted: false },
    });
    if (!existingSpecialist) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Specialist not found');
    }
    if (existingBusiness.id !== existingSpecialist.businessId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Specialist does not belong to the business');
    }
    if (data.rating < 1 || data.rating > 5) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Rating must be between 1 and 5');
    }
    const result = await prisma.review.create({
      data: {
        userId: existingUser.id,
        rating: data.rating,
        comment: data.comment,
        businessId: existingBusiness.id,
        specialistId: existingSpecialist.id,
      },
    });

    await prisma.business.update({
      where: { id: existingBusiness.id },
      data: {
        overallRating: Math.round(
          (
            (
              await prisma.review.aggregate({
                where: { businessId: existingBusiness.id },
                _avg: { rating: true },
              })
            )._avg.rating || 0
          )
        ),
      },
    });

    await prisma.specialist.update({
      where: { id: existingSpecialist.id },
      data: {
        totalRating: Math.round(
          (
            (
              await prisma.review.aggregate({
                where: { specialistId: existingSpecialist.id },
                _avg: { rating: true },
              })
            )._avg.rating || 0
          )
        ),
      },
    });
    return result;
  });

  return transaction;
};

const getListFromDb = async (businessId: string) => {

    if (!businessId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Business ID is required');
    }
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId, isDeleted: false },
    });
    if (!existingBusiness) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Business not found');
    }
  
    const result = await prisma.review.findMany(
      {
        where: { businessId},
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true
            },
          },
          specialist: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              specialization: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }
    );
    return result;
};

const getListForSpecialistFromDb = async (specialistId: string) => {
    if (!specialistId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Specialist ID is required');
    }
    const existingSpecialist = await prisma.specialist.findUnique({
      where: { id: specialistId, isDeleted: false },
    });
    if (!existingSpecialist) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Specialist not found');
    }
    const result = await prisma.review.findMany(
      {
        where: { specialistId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true
            },
          }
        },
        orderBy: { createdAt: 'desc' },
      }
    );
    return result;
}

const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.review.findUnique({ where: { id } });
    if (!result) {
      throw new Error('Review not found');
    }
    return result;
  };

export const reviewService = {
createIntoDb,
getListFromDb,
getListForSpecialistFromDb,
getByIdFromDb,
};
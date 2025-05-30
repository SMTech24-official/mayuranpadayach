import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { fileUploader } from "../../../helpars/fileUploader";

const createIntoDb = async (req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const data = req.body.data;
    const file = req.file;
    
    if (!data) {
      throw new ApiError(httpStatus.NOT_FOUND,'Missing data');
    }
    if (!file) {
      throw new ApiError(httpStatus.NOT_FOUND,'Missing file');
    }
    const parsedData = JSON.parse(data);
    const existingBusiness = await prisma.business.findUnique({
      where: { id: parsedData.businessId },
    });
    if (!existingBusiness) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Business not found');
    }
    const existingSpecialist = await prisma.specialist.findUnique({
      where: { id: parsedData.specialistId },
    });
    if (!existingSpecialist) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Specialist not found');
    }
    if (existingBusiness.id !== existingSpecialist.businessId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Specialist does not belong to the business');
    }
    let image: string | undefined;
    if (file) {
      try {
        const res = await fileUploader.uploadToDigitalOcean(file);
        image = res.Location;
      } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload image');
      }
    }
    const result = await prisma.portfolio.create({
      data: {
        title: parsedData.title,
        specialistId: existingSpecialist.id,
        businessId: existingBusiness.id,
        image: image || '',
      },
    });
    return result;
  });

  return transaction;
};

const getListFromDb = async (businessId?: string, specialistId?: string) => {
  
    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (specialistId) where.specialistId = specialistId;

    const result = await prisma.portfolio.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        specialist: {
          select: {
            fullName: true,
            profileImage: true,
          },
        },
        business: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return result;
};

const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.portfolio.findUnique({ where: { id } });
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND,'Portfolio not found');
    }
    return result;
  };



const updateIntoDb = async ( req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const data = req.body.data;
    const file = req.file;
    const id = req.params.id;
    if (!id) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Missing portfolio ID');
    }

    if (!data) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Missing data');
    }

    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id },
    });
    if (!existingPortfolio) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Portfolio not found');
    }

    const parsedData = JSON.parse(data);
    let image: string | undefined;
    if (file) {
      try {
        const res = await fileUploader.uploadToDigitalOcean(file);
        image = res.Location;
      } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload image');
      }
    }

    const result = await prisma.portfolio.update({
      where: { id },
      data: {
        title: parsedData.title || existingPortfolio.title,
        specialistId: parsedData.specialistId || existingPortfolio.specialistId,
        image: image || existingPortfolio.image,
      },
    });

    return result;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.portfolio.delete({
      where: { id },
    });

    if (!deletedItem) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Portfolio not found');
    }
    return deletedItem;
  });

  return transaction;
};
;

export const portfolioService = {
createIntoDb,
getListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};
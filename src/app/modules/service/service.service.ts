import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import prisma from "../../../shared/prisma";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";



const createIntoDb = async (req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const data = req.body.data;
    const file = req.file;

    const parsedData = JSON.parse(data);
    // Check if the user exists
    const business = await prisma.business.findUnique({
      where: { id: parsedData.businessId, isDeleted: false },
    });
    if (!business) {
      throw new Error('Business not found');
    }
    let image: string | undefined;
    if (file) {
      try {
        const res = await fileUploader.uploadToDigitalOcean(file);
        image = res.Location;
      } catch (error) {
        throw new Error('Failed to upload image');
      }
    }

    const result = await prisma.service.create({
      data: {
        name: parsedData.name,
        price: parsedData.price,
        businessId: business.id,
        interval: parsedData.interval,
        image: image || "",
      },
  });
    return result;   
  });
  return transaction;
};

const getListByBusinessIdFromDb = async (id: string, options:IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const business = await prisma.business.findUnique({
      where: { id, isDeleted: false },
    });
    if (!business) {
      throw new ApiError(httpStatus.NOT_FOUND,'Business not found');
    }
    const result = await prisma.service.findMany({
      where: { businessId: id, isDeleted: false },
      skip,
      take: limit,
      include: {
        business: {
          select: {
            name: true,
            image: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
        const total = await prisma.service.count({
        where:{ businessId: id, isDeleted: false },
    });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result,
    };
};

const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.service.findUnique({ where: { id, isDeleted: false },
      include: {
        business: {
          select: {
            name: true,
            image: true,
          }
        },
      },
    });
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND,'Service not found');
    }
    return result;
  };



const updateIntoDb = async ( req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const data = req.body.data;
    const file = req.file;
    const id = req.params.id;


    const parsedData = JSON.parse(data);
    // Check if the service exists
    const existingService = await prisma.service.findUnique({
      where: { id, isDeleted: false },
    });
    if (!existingService) {
      throw new Error('Service not found');
    }

    let image: string | undefined;
    if (file) {
      try {
        const res = await fileUploader.uploadToDigitalOcean(file);
        image = res.Location;
      } catch (error) {
        throw new Error('Failed to upload image');
      }
    }


    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: parsedData.name || existingService.name,
        description: parsedData.description || existingService.description,
        price: parsedData.price || existingService.price,
        image: image || existingService.image,
        interval: parsedData.interval || existingService.interval,
        isActive: parsedData.isActive || existingService.isActive,
        isOffered: parsedData.isOffered || existingService.isOffered,
        offeredPercent: parsedData.offeredPercent || existingService.offeredPercent,
      },
    });

    return updatedService;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.service.update({
      where: { id },
      data: { isDeleted: true },
    });
    return deletedItem;
  });

  return transaction;
};

export const serviceService = {
createIntoDb,
getListByBusinessIdFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};
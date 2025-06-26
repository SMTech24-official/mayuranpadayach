import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import prisma from "../../../shared/prisma";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { ISpecialistFilterRequest } from "./specialist.interface";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { specialistSearchableFields } from "./specialist.constant";

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
    const existingService = await prisma.service.findUnique({
      where: { id: parsedData.serviceId },
    });
    if (!existingService) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }
    if (existingBusiness.id !== existingService.businessId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service does not belong to the business');
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

    const result = await prisma.specialist.create({
      data: {
        fullName: parsedData.fullName,
        phoneNumber: parsedData.phoneNumber,
        specialization: parsedData.specialization,
        businessId: existingBusiness.id,
        serviceId: existingService.id,
        experience: parsedData.experience,
        profileImage: image || '',
      },
  });
    return result;
  }
  );
  return transaction;
};

const getListForUserFromDb = async (options: IPaginationOptions, params: ISpecialistFilterRequest) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions: any[] = [];
    
      if (searchTerm) {
        andConditions.push({
          OR: specialistSearchableFields.map((field) => ({
            [field]: { contains: searchTerm, mode: "insensitive" },
          })),
        });
      }

  // Filtering by business and service (need to join with related tables)
  if (filterData.business) {
    andConditions.push({
      business: { name: { equals: filterData.business, mode: "insensitive" } },
    });
  }
  if (filterData.service) {
    andConditions.push({
      service: { name: { equals: filterData.service, mode: "insensitive" } },
    });
  }
  if (filterData.specialization) {
    andConditions.push({
      specialization: { contains: filterData.specialization, mode: "insensitive" },
    });
  }
  if (filterData.fullName) {
    andConditions.push({
      fullName: { contains: filterData.fullName, mode: "insensitive" },
    });
  }
  // Combine all conditions
  const whereConditions: any = {
    isDeleted: false,
    isAvailable: true,
    status: 'ACTIVE',
    ...(andConditions.length > 0 && { AND: andConditions }),
  };
  const result = await prisma.specialist.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      business: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const total = await prisma.specialist.count({
    where: whereConditions,
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


const getAllByBusinessIdFromDb = async (businessId: string, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const whereCondition: any = {
    isDeleted: false,
    businessId,
  };
  const result = await prisma.specialist.findMany({
    where: whereCondition,
    skip,
    take: limit,
    include: {
      business: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const total = await prisma.specialist.count({
    where: whereCondition,
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

const getAllListFromDb = async (userId: string, options: IPaginationOptions) => {
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  let whereCondition: any = { isDeleted: false };

  if (user.role === 'PROFESSIONAL') {
    // Find the business owned by this professional
    const business = await prisma.business.findFirst({
      where: { userId: user.id, isDeleted: false },
    });
    if (business) {
      whereCondition.businessId = business.id;
    } 
  }

  const result = await prisma.specialist.findMany({
    where: whereCondition,
    skip,
    take: limit,
    include: {
      business: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.specialist.count({
    where: whereCondition,
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
  
    const result = await prisma.specialist.findUnique({ where: { id , isDeleted: false} });
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND,'Specialist not found');
    }
    return result;
  };



const updateIntoDb = async (req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const data = req.body.data;
    const id = req.params.id;
    const file = req.file;

    if (!data) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Missing data');
    }

    const existingSpecialist = await prisma.specialist.findUnique({
      where: { id },
    });
    if (!existingSpecialist) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Specialist not found');
    }

    const parsedData = JSON.parse(data);
    let image: string | undefined;
    if (file) {
      try {
        const res = await fileUploader.uploadToDigitalOcean(file);
        image = res.Location;
      } catch (error) {
        throw new Error('Failed to upload image');
      }
    }

    const updatedSpecialist = await prisma.specialist.update({
      where: { id },
      data: {
        fullName: parsedData.fullName,
        phoneNumber: parsedData.phoneNumber,
        specialization: parsedData.specialization,
        experience: parsedData.experience,
        profileImage: image || existingSpecialist.profileImage,
        status: parsedData.status || existingSpecialist.status,
      },
    });

    return updatedSpecialist;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.specialist.update({
      where: { id },
      data: { isDeleted: true },
    });

    return deletedItem;
  });

  return transaction;
};
;

export const specialistService = {
createIntoDb,
getListForUserFromDb,
getAllByBusinessIdFromDb,
getAllListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};
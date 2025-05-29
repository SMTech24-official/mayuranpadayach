import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import prisma from "../../../shared/prisma";
import { IBusinessFilterRequest } from "./business.interface";
import { businessSearchableFields } from "./business.constant";



const createIntoDb = async (req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const data = req.body.data;
    const file = req.file;
    const userId = req.user.id;


    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    if (!data) {
      throw new Error('Missing business data');
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId, isAllowed: true },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const parsedData = JSON.parse(data);
    const existingCategory = await prisma.category.findUnique({
      where: { id: parsedData.categoryId },
    });
    if (!existingCategory) {
      throw new Error('Category not found');
    }
    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id: parsedData.subCategoryId },
    });
    if (!existingSubCategory) {
      throw new Error('SubCategory not found');
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

    const result = await prisma.business.create({
      data: {
        name: parsedData.name,
        categoryId: existingCategory.id,
        subCategoryId: existingSubCategory.id,
        latitude: parsedData.latitude,
        longitude: parsedData.longitude,
        address: parsedData.address,
        openingHours: parsedData.openingHours,
        closingHours: parsedData.closingHours,
        image: image || '', 
        userId: user.id, 
      },
    });

    return result;
  });

  return transaction;
};

const getListFromDb = async (options: IPaginationOptions, params: IBusinessFilterRequest) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: any[] = [];

    
    if (searchTerm) {
        andConditions.push({
            OR: businessSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    // Filtering by name, address
    if (filterData.name) {
        andConditions.push({
            name: {
                equals: filterData.name,
                mode: "insensitive",
            },
        });
    }
    if (filterData.address) {
        andConditions.push({
            address: {
                equals: filterData.address,
                mode: "insensitive",
            },
        });
    }

    // Filtering by categoryName and subCategoryName (need to join with related tables)
    if (filterData.category) {
        andConditions.push({
            category: {
                name: {
                    equals: filterData.category,
                    mode: "insensitive",
                },
            },
        });
    }
    if (filterData.subCategory) {
        andConditions.push({
            subCategory: {
                name: {
                    equals: filterData.subCategory,
                    mode: "insensitive",
                },
            },
        });
    }

    const whereConditions = {
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
      isDeleted: false,
    };

    const result = await prisma.business.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            createdAt: "desc",
        },
        include: {
            category: true,
            subCategory: true,
        },
    });

    const total = await prisma.business.count({
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

const getListForAdminFromDb = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const result = await prisma.business.findMany({
    where: { isDeleted: false },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      category: true,
      subCategory: true,
    }
  });
  const total = await prisma.business.count();
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
  
    const result = await prisma.business.findUnique({ where: { id , isDeleted: false},
      include: {
        category: true,
        subCategory: true,
      },
      });
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND,'Business not found');
    }
    return result;
  };

const getOneByUserIdFromDb = async (userId: any) => {
  
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND,'User not found');
    }
    const result = await prisma.business.findFirst({ where: { userId: user.id, isDeleted: false },
      include: {
        category: true,
        subCategory: true,
      },
      });
    if (!result) {
      throw new Error('Business not found');
    }
    return result;
  };


const updateIntoDb = async (req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const data = req.body.data;
    const file = req.file;
    const userId = req.user.id;
    const id = req.params.id;
    const existingBusiness = await prisma.business.findUnique({
      where: { id , isDeleted: false},
    });
    if (!existingBusiness) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Business not found with id: ' + id);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, isAllowed: true },
    });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const parsedData = JSON.parse(data);

    const existingCategory = await prisma.category.findUnique({
      where: { id: parsedData.categoryId },
    });
    if (!existingCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }

    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id: parsedData.subCategoryId },
    });
    if (!existingSubCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
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

    const result = await prisma.business.update({
      where: { id },
      data: {
        name: parsedData.name || existingBusiness.name,
        categoryId: existingCategory.id || existingBusiness.categoryId,
        subCategoryId: existingSubCategory.id || existingBusiness.subCategoryId,
        latitude: parsedData.latitude || existingBusiness.latitude,
        longitude: parsedData.longitude || existingBusiness.longitude,
        address: parsedData.address || existingBusiness.address,
        openingHours: parsedData.openingHours || existingBusiness.openingHours,
        closingHours: data.closingHours || existingBusiness.closingHours,
        image: image || existingBusiness.image,
        status: parsedData.status || existingBusiness.status,
        openStatus: parsedData.openStatus || existingBusiness.openStatus,
      },
    });

    return result;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.business.update({
      where: { id },
      data: { isDeleted: true },
    });
    return deletedItem;
  });

  return transaction;
};

export const businessService = {
createIntoDb,
getListFromDb,
getListForAdminFromDb,
getByIdFromDb,
getOneByUserIdFromDb,
updateIntoDb,
deleteItemFromDb,
};
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { fileUploader } from "../../../helpars/fileUploader";



const createIntoDb = async (req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const data = req.body.data
    const file = req.file;

    if (!data) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing category data');
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

    const result = await prisma.category.create({
      data: {
        name: parsedData.name,
        image: image || '', // Use the uploaded image URL or undefined if not provided
      },
    });

    return result;

  });

  return transaction;
};

const getListFromDb = async () => {
  
    const result = await prisma.category.findMany();
    return result;
};

const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.category.findUnique({ where: { id } });
    if (!result) {
      throw new Error('Category not found');
    }
    return result;
  };



const updateIntoDb = async (id: string, req: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const file = req.file;
    const data = req.body.data;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found with id: ' + id);
    }

    if (!data) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing category data');
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

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: parsedData.name || existingCategory.name,
        image: image || existingCategory.image, 
      },
    });

    return updatedCategory;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.category.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
;

export const categoryService = {
createIntoDb,
getListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const createIntoDb = async (data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const name = data.name;
    const categoryId = data.categoryId;

    if (!name || !categoryId) {
      throw new Error('Missing required fields: name or categoryId');
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!existingCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    const result = await prisma.subCategory.create({ data });
    return result;
  });

  return transaction;
};

const getListFromDb = async () => {
  
    const result = await prisma.subCategory.findMany({where: { isDeleted: false }});
    return result;
};

const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.subCategory.findUnique({ where: { id , isDeleted: false} });
    if (!result) {
      throw new Error('SubCategory not found');
    }
    return result;
  };



const updateIntoDb = async (id: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const result = await prisma.subCategory.update({
      where: { id , isDeleted: false },
      data,
    });
    return result;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const existingItem = await prisma.subCategory.findUnique({
      where: { id, isDeleted: false },
    });
    if (!existingItem) {
      throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found with id: ' + id);
    }
    const deletedItem = await prisma.subCategory.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
;

export const subCategoryService = {
createIntoDb,
getListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};
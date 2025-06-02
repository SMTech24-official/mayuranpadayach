import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";



const createIntoDb = async (userId: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });
    if (!existingUser) {
      throw new ApiError(httpStatus.NOT_FOUND,'User not found');
    }
    const result = await prisma.searchHistory.create({ data:{userId: existingUser.id, searchTerm: data.searchTerm} });
    return result;
  });

  return transaction;
};

const getListFromDb = async (userId: string) => {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });
    if (!existingUser) {
      throw new ApiError(httpStatus.NOT_FOUND,'User not found');
    }
    const result = await prisma.searchHistory.findMany({where:{userId: existingUser.id}});
    return result;
};

const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.searchHistory.findUnique({ where: { id } });
    if (!result) {
      throw new Error('SearchHistory not found');
    }
    return result;
  };

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.searchHistory.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
;

export const searchHistoryService = {
createIntoDb,
getListFromDb,
getByIdFromDb,
deleteItemFromDb,
};
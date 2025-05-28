import prisma from "../../../shared/prisma";
import { UserRole, UserStatus } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';


const createSubscriptionOfferIntoDb = async (userId: string, data: any) => {
  
    const result = await prisma.subscriptionOffer.create({ 
    data: {
      ...data,
      createdBy: userId,
    },
  });
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'subscriptionOffer not created');
  }
    return result;
};

const getSubscriptionOfferListFromDb = async () => {
  
    const result = await prisma.subscriptionOffer.findMany({
      where:{isDeleted: false},
      select:{
      id: true,
      title: true,
      price: true,
      duration: true,
      status: true,
      platformFee: true,       
      features: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      creator: {select:{id: true, fullName: true, email: true, role: true, profileImage: true, }}
    },orderBy : {createdAt: 'desc'}});
    
    return result;
};

const getSubscriptionOfferByIdFromDb = async (subscriptionOfferId: string) => {
  
    const result = await prisma.subscriptionOffer.findUnique({ 
    where: {
      id: subscriptionOfferId,
    },
    select:{
      id: true,
      title: true,
      price: true,
      duration: true,
      status: true,
      platformFee: true,       
      features: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      creator: {select:{id: true, fullName: true, email: true, role: true, profileImage: true, }}
    }
   });
    if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND,'subscriptionOffer not found');
  }
    return result;
  };



const updateSubscriptionOfferIntoDb = async (userId: string, subscriptionOfferId: string, data: any) => {
  
    const result = await prisma.subscriptionOffer.update({
      where:  {
        id: subscriptionOfferId,
        createdBy: userId,
    },
    data: {
      ...data,
    },
  });
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'subscriptionOfferId, not updated');
  }
    return result;
  };

const deleteSubscriptionOfferItemFromDb = async (userId: string, subscriptionOfferId: string) => {
    const deletedItem = await prisma.subscriptionOffer.update({
      where: {
      id: subscriptionOfferId,
      createdBy: userId,
    },
    data: {
      isDeleted: true,
    },
  });
  if (!deletedItem) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'subscriptionOfferId, not deleted');
  }

    return deletedItem;
  };

export const subscriptionOfferService = {
createSubscriptionOfferIntoDb,
getSubscriptionOfferListFromDb,
getSubscriptionOfferByIdFromDb,
updateSubscriptionOfferIntoDb,
deleteSubscriptionOfferItemFromDb,
};
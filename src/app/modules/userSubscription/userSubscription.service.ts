import prisma from "../../../shared/prisma";
import { PaymentStatus, SubscriptionStatus, UserRole, UserStatus } from '@prisma/client';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
import nodeCron from "node-cron";

const createUserSubscriptionIntoDb = async (userId: string, data: any) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      role: UserRole.PROFESSIONAL
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const subscriptionOffer = await prisma.subscriptionOffer.findUnique({
    where: {
      id: data.subscriptionOfferId,
    },
  });

  if (!subscriptionOffer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription offer not found');
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + subscriptionOffer.duration);
  const result = await prisma.userSubscription.create({
    data: {
      subscriptionOfferId: data.subscriptionOfferId,
      userId: userId,
      startDate: startDate,
      endDate: endDate,
      status: SubscriptionStatus.ACTIVE,
      paymentStatus: "COMPLETED",
      paymentId: data.paymentId,
    },
    include:{
      user: {select:{id: true, fullName: true, email: true, role: true, isAllowed:true }},
    }
  });

  if (result) {
    await prisma.user.update({
        where: { id: userId },
        data: { isAllowed: true, subscriptionEndsAt: result.endDate}, // Set isAllowed to true when payment is completed
      });
  }

  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'userSubscription not created');
  }

  return result;
};

const getUserSubscriptionListFromDb = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
  
    const result = await prisma.userSubscription.findMany({
      where: {
        userId: userId,
      },
      include: { 
        subscriptionOffer: {select:{id: true, title: true, price: true, duration: true, }}
      }
      });
    
    return result;
}

const getUserSubscriptionListByAdminFromDb = async () => {
  
    const result = await prisma.userSubscription.findMany({
      include: { 
        user: {select:{id: true, fullName: true, email: true, role: true, profileImage: true, }},
        subscriptionOffer: {select:{id: true, title: true, price: true, duration: true, creator:{select:{id: true, fullName: true, email: true, role: true, profileImage: true, }} }}
      }
      });
    
    return result;
};

const getUserSubscriptionByIdFromDb = async (userSubscriptionId: string) => {
  
    const result = await prisma.userSubscription.findUnique({ 
    where: {
      id: userSubscriptionId,
    },
    include: { 
      user: {select:{id: true, fullName: true, email: true, role: true, isAllowed:true, }},
      subscriptionOffer: {select:{id: true, title: true, price: true, duration: true, creator:{select:{id: true, fullName: true, email: true, role: true, profileImage: true, }} }}
    }
   });
    if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND,'userSubscription not found');
  }
    return result;
  };



// Schedule a daily check at midnight
const initializeCronJobs = () => {
nodeCron.schedule("0 0 * * *", async () => {
  try {
    const currentDate = new Date();
    
    // Update all ACTIVE subscriptions past their endDate
    await prisma.userSubscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: currentDate },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    // Set isAllowed to false for users with expired subscriptions
    await prisma.user.updateMany({
      where: {
        subscriptionOffer: {
          some: {
            status: SubscriptionStatus.EXPIRED,
          },
        },
      },
      data: { isAllowed: false },
    });
    
    console.log("Cron job: Subscription expirations updated.");
  } catch (error) {
    console.error("Cron job failed to update subscriptions:", error);
  }
});

};


export const userSubscriptionService = {
createUserSubscriptionIntoDb,
getUserSubscriptionListFromDb,
getUserSubscriptionListByAdminFromDb,
getUserSubscriptionByIdFromDb,
initializeCronJobs
};
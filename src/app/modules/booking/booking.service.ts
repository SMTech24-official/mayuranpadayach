import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import e from "express";
import { UserStatus } from "@prisma/client";


const getTimeSlotsFromDb = async (serviceId: string, startTime?: Date, endTime?: Date) => {
  const result = await prisma.timeSlot.findMany({
    where: {
      serviceId,
      isDeleted: false,
      ...(startTime && endTime && {
        startTime: {
          gte: startTime,
        },
        endTime: {
          lte: endTime,
        },
      }),
    },
  });
  return result;
};


const createIntoDb = async (userId: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const bookingDate = new Date(data.bookingDate);
    const timeSlots = data.timeSlot;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const existingBusiness = await prisma.business.findUnique({
      where: { id: data.businessId },
    });
    if (!existingBusiness) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Business not found');
    }
    const existingService = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });
    if (!existingService) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }
    const existingSpecialist = await prisma.specialist.findUnique({
      where: { id: data.specialistId },
    });
    if (!existingSpecialist) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Specialist not found');
    }

    // Conflict check (for each slot)
    for (const slot of timeSlots) {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      if (startTime >= endTime) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Start time must be before end time');
      }

      const conflicts = await getTimeSlotsFromDb(existingService.id, startTime, endTime);
      if (conflicts.length > 0) {
        throw new ApiError(httpStatus.CONFLICT, `Time slot is already booked`);
      }
    }
    // Create booking with time slots
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        businessId: existingBusiness.id,
        serviceId: existingService.id,
        specialistId: existingSpecialist.id,
        bookingDate,
        totalPrice: data.totalPrice,
        bookingStatus: data.status || 'PENDING',
        timeSlot: {
          create: timeSlots.map((slot: any) => ({
            serviceId: existingService.id,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
          })),
        },
      },
    });

    return booking;
  });

  return transaction;
};

const getListFromDb = async (options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const result = await prisma.booking.findMany({
      where: {
        isDeleted: false,
      },
      skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include:{
      user: {
        select: {
          fullName: true,
          profileImage: true,
        },
      },
      business: {
        select: {
          name: true,
          address: true,
        },
      },
      service: {
        select: {
          name: true,
          price: true,
          interval: true,
        },
      },
    }
    });

    const total = await prisma.booking.count({ where: { isDeleted: false } });
    return {
      meta: {
      page,
      limit,
      total,
    },
      result
    };
};


export const bookingSearchableFields = ['bookingStatus'];

const getListForUserDB = async (
  userId: string,
  options: IPaginationOptions,
  params: { searchTerm?: string }
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm } = params;
  const andConditions: any[] = [];

  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (searchTerm) {
    andConditions.push({
      OR: bookingSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

if (user.role === 'PROFESSIONAL') {
  const business = await prisma.business.findFirst({
    where: { userId, isDeleted: false },
  });
  if (!business) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Business not found for this user');
  }
  andConditions.push({ businessId: business.id });
} else if (user.role === 'USER') {
  // For regular users, we don't need to filter by business
  andConditions.push({ userId });
}

// Always filter by isDeleted: false
const whereConditions =
  andConditions.length > 0
    ? { AND: [...andConditions, { isDeleted: false }] }
    : { isDeleted: false };

  const result = await prisma.booking.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          fullName: true,
          profileImage: true,
        },
      },
      business: {
        select: {
          name: true,
          image: true,
          address: true,
          overallRating: true,
          userId: true, 
        },
      },
      service: {
        select: {
          name: true,
          price: true,
          interval: true,
        },
      },
      specialist: {
        select: {
          fullName: true,
          profileImage: true,
          specialization: true,
        },
      },
    },
  });

  const total = await prisma.booking.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
    },
    result,
  };
};


const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.booking.findUnique({
      where: { id },
      include: {
      user: {
        select: {
        fullName: true,
        profileImage: true,
        },
      },
      business: {
        select: {
        name: true,
        image: true,
        address: true,
        overallRating: true,
        },
      },
      service: {
        select: {
        name: true,
        price: true,
        interval: true,
        },
      },
      specialist: {
        select: {
        fullName: true,
        profileImage: true,
        specialization: true,
        },
      },
      timeSlot: {
        where: { isDeleted: false },
        select: {
        startTime: true,
        endTime: true,
        },
      },
      },
    });
    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND,'Booking not found');
    }
    return result;
  };

const updateIntoDb = async (id: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }


    const deleteTimeSlots = await prisma.timeSlot.updateMany({
      where: { bookingId: existingBooking.id, isDeleted: false },
      data: { isDeleted: true, updatedAt: new Date() },
    });
    if (!deleteTimeSlots) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete existing time slots');
    }
    const existingService = await prisma.service.findUnique({
      where: { id: existingBooking.serviceId},
    });
    if (!existingService) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }
    const timeSlots = data.timeSlot;
    // Conflict check (for each slot)
    for (const slot of timeSlots) {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      if (startTime >= endTime) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Start time must be before end time');
      }

      const conflicts = await getTimeSlotsFromDb(existingService.id, startTime, endTime);
      if (conflicts.length > 0) {
        throw new ApiError(httpStatus.CONFLICT, `Time slot is already booked`);
      }
    }
    // Update booking with new data
    const updatedBooking = await prisma.booking.update({
      where: { id, isDeleted: false },
      data: {
        bookingStatus: data.bookingStatus || existingBooking.bookingStatus,
        bookingDate: data.bookingDate || existingBooking.bookingDate,
        totalPrice: data.totalPrice || existingBooking.totalPrice,
        timeSlot: {
          create: data.timeSlot.map((slot: any) => ({
            serviceId: existingService.id,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
          })),
        },
      },
    });

    return {message: 'Booking updated successfully', updatedBooking};
  });

  return transaction;
};

const bookingStatusChangeDb = async (id: string, data: any) => {
  const existingBooking = await prisma.booking.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existingBooking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  await prisma.booking.update({
    where: { id, isDeleted: false },
    data: {
      bookingStatus: data.status || existingBooking.bookingStatus,
      updatedAt: new Date(),
    },
  });

  return { message: 'Booking status updated successfully' };
}


const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.booking.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
        timeSlot: {
          updateMany: {where: { bookingId: id }, data: { isDeleted: true } },
      },
    }
    });
    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
    });
  return transaction;
};

export const bookingService = {
createIntoDb,
getListFromDb,
getListForUserDB,
getByIdFromDb,
updateIntoDb,
bookingStatusChangeDb,
deleteItemFromDb,
getTimeSlotsFromDb
};
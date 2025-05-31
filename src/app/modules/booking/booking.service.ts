import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";


const getTimeSlotsFromDb = async (serviceId: string, startTime?: Date, endTime?: Date) => {
  const result = await prisma.timeSlot.findMany({
    where: {
      serviceId,
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

const getListFromDb = async () => {
  
    const result = await prisma.booking.findMany();
    return result;
};

const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.booking.findUnique({ where: { id } });
    if (!result) {
      throw new Error('Booking not found');
    }
    return result;
  };

const updateIntoDb = async (id: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const result = await prisma.booking.update({
      where: { id },
      data,
    });
    return result;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.booking.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};

export const bookingService = {
createIntoDb,
getListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
getTimeSlotsFromDb
};
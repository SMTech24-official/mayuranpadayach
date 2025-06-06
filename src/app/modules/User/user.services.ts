import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { IUser, IUserFilterRequest } from "./user.interface";
import * as bcrypt from "bcrypt";
import crypto from 'crypto';
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { Prisma, User, UserRole } from "@prisma/client";
import { userSearchAbleFields } from "./user.costant";
import config from "../../../config";
import httpStatus, { NOT_FOUND } from "http-status";
import { Request } from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import { Secret } from "jsonwebtoken";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { generateOtpEmail } from "../../../shared/emaiHTMLtext";
import emailSender from "../../../shared/emailSender";

// Create a new user in the database.
const createUserIntoDb = async (payload: User) => {
 const existingUser = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
  })

  const otp = Number(crypto.randomInt(1000, 9999));
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  if (existingUser) {
    if (existingUser.status === 'BLOCKED') {
      throw new ApiError(400, `User with email ${payload.email} is blocked.`);
    }

    if (existingUser.status === 'ACTIVE') {
      throw new ApiError(400, `User with email ${payload.email} is already active.`);
    }

    if (existingUser.status === 'INACTIVE') {
      const updatedData: Record<string, any> = {
        status: 'INACTIVE',
        expirationOtp: otpExpires,
        otp,
      };

      if (payload.password) {
        const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));
        updatedData.password = hashedPassword;
      }

      if (payload.fcmToken) {
        updatedData.fcmToken = payload.fcmToken;
      }

      if (payload.role){
        updatedData.role = payload.role;
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: updatedData,
      });
      const html = generateOtpEmail(otp);
      await emailSender(payload.email, html, 'OTP Verification');

      console.log("otp", otp);
      return { message: 'An OTP has been sent to your email. Please verify your account.' };
    }
  }

  if (!payload.password) {
    throw new ApiError(400, 'Password is required');
  }

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));

  const newUser = await prisma.user.create({
    data:{
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
      role: payload.role,
      status: 'INACTIVE',
      fcmToken: payload.fcmToken,
      otp,
      expirationOtp: otpExpires,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      role: true,
      otp: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!newUser) {
    throw new ApiError(500, 'Failed to create user');
  }

  const html = generateOtpEmail(otp);
  await emailSender(payload.email, html, 'OTP Verification');

  console.log("otp", otp);
  return { message: 'An OTP has been sent to your email. Please verify your account.' };
};

// reterive all users from the database also searcing anf filetering
const getUsersFromDb = async (
  params: IUserFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondions: Prisma.UserWhereInput[] = [];

  if (params.searchTerm) {
    andCondions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andCondions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }
  const whereConditons: Prisma.UserWhereInput = { 
    AND: [
      ...andCondions,
      { isDeleted: false }
    ]
  };

  const result = await prisma.user.findMany({
    where: whereConditons,
    skip,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const total = await prisma.user.count({
    where: whereConditons,
  });

  if (!result || result.length === 0) {
    throw new ApiError(NOT_FOUND, "No active users found");
  }
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

//get a user
const getUserFromDb = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// update profile by user won profile uisng token or email and id
const updateProfile = async (req: Request) => {
  console.log(req.file, req.body.data);
  const file = req.file;
  const stringData = req.body.data;
  let image;
  let parseData;
  const existingUser = await prisma.user.findFirst({
    where: {
      id: req.user.id,
    },
  });
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }
  if (file) {
    image = (await fileUploader.uploadToDigitalOcean(file)).Location;
  }
  if (stringData) {
    parseData = JSON.parse(stringData);
  }
  const result = await prisma.user.update({
    where: {
      id: existingUser.id, // Ensure `existingUser.id` is valid and exists
    },
    data: {
      fullName: parseData.fullName || existingUser.fullName,
      profileImage: image || existingUser.profileImage,
      phoneNumber: parseData.phoneNumber || existingUser.phoneNumber,
      updatedAt: new Date(), // Assuming your model has an `updatedAt` field
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
    },
  });

  return result;
};

// update user data into database by id fir admin
const updateUserIntoDb = async (payload: IUser, id: string) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
    },
  });
  if (!userInfo)
    throw new ApiError(httpStatus.NOT_FOUND, "User not found with id: " + id);

  const result = await prisma.user.update({
    where: {
      id: userInfo.id,
    },
    data: payload,
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!result)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update user profile"
    );

  return result;
};

const deleteUser = async (id: string) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
      isDeleted: false,
    },
  });
  if (!userInfo)
    throw new ApiError(httpStatus.NOT_FOUND, "User not found with id: " + id);

  const result = await prisma.user.update({
    where: {
      id: userInfo.id,
    },
    data: {
      isDeleted: true,
      updatedAt: new Date(),
    },
  });

  if (!result)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to delete user profile"
    );

  return result;
}

// delete users is 15days after isDeleted is true using cron job
const deleteUserCronJob = async () => {
}


export const userService = {
  createUserIntoDb,
  getUsersFromDb,
  getUserFromDb,
  updateProfile,
  updateUserIntoDb,
  deleteUser
};

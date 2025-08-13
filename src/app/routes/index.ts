import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { categoryRoutes } from "../modules/category/category.routes";
import { subCategoryRoutes } from "../modules/subCategory/subCategory.routes";
import { subscriptionOfferRoutes } from "../modules/subscriptionOffer/subscriptionOffer.routes";
import { userSubscriptionRoutes } from "../modules/userSubscription/userSubscription.routes";
import { businessRoutes } from "../modules/business/business.routes";
import { serviceRoutes } from "../modules/service/service.routes";
import { specialistRoutes } from "../modules/specialist/specialist.routes";
import { portfolioRoutes } from "../modules/portfolio/portfolio.routes";
import { favoriteRoutes } from "../modules/favorite/favorite.routes";
import { favoriteSpecialistRoutes } from "../modules/favoriteSpecialist/favoriteSpecialist.routes";
import { reviewRoutes } from "../modules/review/review.routes";
import { bookingRoutes } from "../modules/booking/booking.routes";
import { searchHistoryRoutes } from "../modules/searchHistory/searchHistory.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { PaymentRoutes } from "../modules/payment/payment.routes";



const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/categories",
    route: categoryRoutes,
  },
  {
    path: "/subCategories",
    route: subCategoryRoutes,
  },
  {
    path: "/subscriptionOffers",
    route: subscriptionOfferRoutes,
  },
  {
    path: "/userSubscriptions",
    route: userSubscriptionRoutes,
  },
  {
    path: "/businesses",
    route: businessRoutes,
  },
  {
    path: "/services",
    route: serviceRoutes,
  },
  {
    path: "/specialists",
    route: specialistRoutes,
  },
  {
    path: "/portfolios",  
    route: portfolioRoutes,
  },
  {
    path: "/favBusiness",  
    route: favoriteRoutes,
  },
  {
    path: "/favSpecialist",  
    route: favoriteSpecialistRoutes,
  },
  {
    path: "/reviews",  
    route: reviewRoutes,
  },
  {
    path: "/bookings",  
    route: bookingRoutes,
  },
  {
    path: "/searchHistories",  
    route: searchHistoryRoutes,
  },
  {
    path: "/notifications",  
    route: NotificationRoutes,
  },
  {
    path: "/payment",  
    route: PaymentRoutes,
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

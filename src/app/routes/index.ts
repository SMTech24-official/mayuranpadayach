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
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { categoryRoutes } from "../modules/category/category.routes";
import { subCategoryRoutes } from "../modules/subCategory/subCategory.routes";



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
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

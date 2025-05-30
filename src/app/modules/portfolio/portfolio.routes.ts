import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { portfolioController } from './portfolio.controller';
import { portfolioValidation } from './portfolio.validation';
import { fileUploader } from '../../../helpars/fileUploader';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
'/',
auth(UserRole.PROFESSIONAL),
//validateRequest(portfolioValidation.createSchema),
fileUploader.uploadSingle,
portfolioController.createPortfolio,
);

router.get('/all', auth(), portfolioController.getPortfolioList);

router.get('/:id', auth(), portfolioController.getPortfolioById);

router.put(
'/:id',
auth(UserRole.PROFESSIONAL),
//validateRequest(portfolioValidation.updateSchema),
fileUploader.uploadSingle,
portfolioController.updatePortfolio,
);

router.delete('/:id', auth(UserRole.PROFESSIONAL), portfolioController.deletePortfolio);

export const portfolioRoutes = router;
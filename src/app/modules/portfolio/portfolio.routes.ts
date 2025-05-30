import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { portfolioController } from './portfolio.controller';
import { portfolioValidation } from './portfolio.validation';

const router = express.Router();

router.post(
'/',
auth(),
validateRequest(portfolioValidation.createSchema),
portfolioController.createPortfolio,
);

router.get('/', auth(), portfolioController.getPortfolioList);

router.get('/:id', auth(), portfolioController.getPortfolioById);

router.put(
'/:id',
auth(),
validateRequest(portfolioValidation.updateSchema),
portfolioController.updatePortfolio,
);

router.delete('/:id', auth(), portfolioController.deletePortfolio);

export const portfolioRoutes = router;
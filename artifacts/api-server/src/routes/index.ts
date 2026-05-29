import { Router, type IRouter } from "express";
import healthRouter from "./health";
import instrumentsRouter from "./instruments";
import dashboardRouter from "./dashboard";
import anthropicRouter from "./anthropic";
import scenariosRouter from "./scenarios";
import livePricesRouter from "./live-prices";

const router: IRouter = Router();

router.use(healthRouter);
router.use(instrumentsRouter);
router.use(dashboardRouter);
router.use(anthropicRouter);
router.use(scenariosRouter);
router.use(livePricesRouter);

export default router;

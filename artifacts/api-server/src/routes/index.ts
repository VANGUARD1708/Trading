import { Router, type IRouter } from "express";
import healthRouter from "./health";
import instrumentsRouter from "./instruments";
import dashboardRouter from "./dashboard";
import anthropicRouter from "./anthropic";
import scenariosRouter from "./scenarios";

const router: IRouter = Router();

router.use(healthRouter);
router.use(instrumentsRouter);
router.use(dashboardRouter);
router.use(anthropicRouter);
router.use(scenariosRouter);

export default router;

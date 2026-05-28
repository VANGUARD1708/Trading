import { Router, type IRouter } from "express";
import healthRouter from "./health";
import instrumentsRouter from "./instruments";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(instrumentsRouter);
router.use(dashboardRouter);

export default router;

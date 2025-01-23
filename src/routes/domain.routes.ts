import express, { Router } from "express";
import { checkDomain, signOperator } from "../controllers/domain.controller.js";

const router: Router = express.Router();

router.post('/sign', signOperator);
router.post('/check', checkDomain);

export default router;
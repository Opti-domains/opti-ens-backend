import express, { Router } from "express";
import { signOperator } from "../controllers/domain.controller.js";

const router: Router = express.Router();

router.post('/sign', signOperator);

export default router;
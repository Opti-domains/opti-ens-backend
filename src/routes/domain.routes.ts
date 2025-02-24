import express, { Router } from "express";
import { checkDomain, signOperator, listDomainsByOwner } from "../controllers/domain.controller.js";

const router: Router = express.Router();

router.post('/sign', signOperator);
router.post('/check', checkDomain);
router.get('/list/:owner', listDomainsByOwner);

export default router;
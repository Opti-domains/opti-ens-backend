import express from 'express';
import cors from 'cors';
import { logger } from "./log.js";
import domainRouter from "./routes/domain.routes.js";
import { config } from "./config/index.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/domain', domainRouter);
app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
});
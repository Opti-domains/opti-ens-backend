import { Request, Response } from 'express';
import { Client } from "../client.js";
import { config } from "../config/config.js";
import { logger } from "../log.js";

const mock = true;
let currentNonce = 0n;
export const signOperator = async (req: Request, res: Response) => {
    const { domain, expiration, owner } = req.body;
    if (!domain || !expiration || !owner) {
        res.status(400).json({ message: "Domain, owner and expiration are required" });
        return;
    }
    logger.info(`Signing operator for domain ${domain} with expiration ${expiration} and owner ${owner}`);
    if (mock) {
        res.json({ signature: "0xdeadbeef", nonce: currentNonce.toString(), deadline: config.deadline.toString() });
        return;
    }

    const client = Client.getInstance();
    let nextNonce = currentNonce + 1n;
    let used = await client.checkUsedNonce(nextNonce)
    while (used) {
        nextNonce++;
        used = await client.checkUsedNonce(nextNonce);
    }
    currentNonce = nextNonce;

    const encodeSignature = await client.signOperator(domain, owner, config.deadline, nextNonce);


    res.json({ signature: encodeSignature, nonce: nextNonce.toString(), deadline: config.deadline.toString() });
};
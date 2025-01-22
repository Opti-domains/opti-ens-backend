import { Request, Response } from 'express';
import { Client } from "../client.js";
import { config } from "../config/config.js";
import { logger } from "../log.js";

const mock = false;
let currentNonce = 0n;
const client = Client.getInstance();
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
    // Check if the domain is already registered
    const addrDomain = await client.checkUsedDomainSeparator(domain);
    if (addrDomain.toLowerCase() !== "0x0000000000000000000000000000000000000000".toLowerCase()) {
        res.status(400).json({ message: `Domain ${domain} is registered` });
        return;
    }

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
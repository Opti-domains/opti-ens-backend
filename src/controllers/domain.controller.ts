import { Request, Response } from "express";
import { Client } from "../client.js";
import { config } from "../config/config.js";
import { logger } from "../log.js";
import { DB } from "../db/sqlite.js";

const mock = false;
let currentNonce = 0n;
const client = Client.getInstance();
const db = new DB();
const addrZero = "0x0000000000000000000000000000000000000000";
export const signOperator = async (req: Request, res: Response) => {
    const { domain, expiration, owner } = req.body;
    if (!domain || !expiration || !owner) {
        res.status(400).json({
            message: "Domain, owner and expiration are required",
        });
        return;
    }
    logger.info(
        `Signing operator for domain ${domain} with expiration ${expiration} and owner ${owner}`,
    );
    if (mock) {
        res.json({
            signature: "0xdeadbeef",
            nonce: currentNonce.toString(),
            deadline: config.deadline.toString(),
        });
        return;
    }
    // Check if the domain is already registered
    const addrDomain = await client.checkUsedDomainSeparator(domain);
    if (addrDomain.toLowerCase() !== addrZero.toLowerCase()) {
        res.status(400).json({ message: `Domain ${domain} is registered` });
        return;
    }

    let nextNonce = currentNonce + 1n;
    let used = await client.checkUsedNonce(nextNonce);
    while (used) {
        nextNonce++;
        used = await client.checkUsedNonce(nextNonce);
    }
    currentNonce = nextNonce;

    const encodeSignature = await client.signOperator(
        domain,
        owner,
        BigInt(Math.floor(Date.now() / 1000)) + config.deadline,
        nextNonce,
    );

    db.insertDomainInformation(
        domain,
        expiration,
        encodeSignature,
        Number(nextNonce),
        Number(config.deadline),
        owner,
        "signed",
    );

    res.json({
        signature: encodeSignature,
        nonce: nextNonce.toString(),
        deadline: config.deadline.toString(),
    });
};

export const checkDomain = async (req: Request, res: Response) => {
    try {
        const { domains } = req.body;
        if (!domains || !Array.isArray(domains) || domains.length === 0) {
            res.status(400).json({ message: "Domains are required" });
            return;
        }

        const domainList = db.getDomainsInList(domains);
        const result = [];
        for (let i = 0; i < domainList.length; i++) {
            const domain = domainList[i];
            if (domain.status === "signed") {
                const optDomain = await client.checkUsedDomainSeparator(
                    domain.label,
                );
                if (optDomain.toLowerCase() !== addrZero.toLowerCase()) {
                    db.updateDomainInformation(domain.label, "claimed");
                    domain.status = "claimed";
                }
            }
            result.push(domain);
        }

        logger.info("Checking domains", result);

        res.json(result);
    } catch (err) {
        logger.error("Error checking domain", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

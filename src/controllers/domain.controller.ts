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
    try {
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
    // Check if the domain is already signed
    const domainInfo = db.getDomainInformation(domain);
    if (domainInfo && domainInfo.status === "signed") {
        res.json({
            signature: domainInfo.signature,
            nonce: domainInfo.nonce,
            deadline: domainInfo.deadline,
        });
        return;
    }

    let nextNonce = currentNonce + 1n;
    let used = await client.checkUsedNonce(nextNonce);
    while (used) {
        nextNonce++;
        used = await client.checkUsedNonce(nextNonce);
    }
    currentNonce = nextNonce;
    const calculateExpiration = BigInt(Math.floor(Date.now() / 1000)) + config.deadline;

    const encodeSignature = await client.signOperator(
        domain,
        owner,
        calculateExpiration,
        nextNonce,
    );

    db.insertDomainInformation(
        domain,
        expiration,
        encodeSignature,
        Number(nextNonce),
        Number(calculateExpiration),
        owner,
        "signed",
    );

    res.json({
        signature: encodeSignature,
        nonce: nextNonce.toString(),
        deadline: calculateExpiration.toString(),
    });
    } catch (err) {
        logger.error(`Error signing operator: ${err}`);
        res.status(500).json({ message: "Internal server error" });
    }
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

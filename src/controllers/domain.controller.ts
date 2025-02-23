import { Request, Response } from "express";
import { Client } from "../client.js";
import { config } from "../config/config.js";
import { logger } from "../log.js";
import { DB } from "../db/sqlite.js";

const mock = false;
const client = Client.getInstance();
const db = new DB();
const addrZero = "0x0000000000000000000000000000000000000000";

export const checkEnsOwner = async (domain: string, owner: string) => {
    const query = `
        query GetDomainOwner($domain: String!) {
            domains(where: {name: $domain}) {
                owner {
                    id
                }
            }
            wrappedDomains(where: {name: $domain}) {
                owner {
                    id
                }
            }
        }
    `;

    try {
        const response = await fetch(config.graphUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                variables: { domain },
            }),
        });

        const data = await response.json();

        // Check ownership in either unwrapped or wrapped domains
        const unwrappedOwner = data.data?.domains[0]?.owner?.id;
        const wrappedOwner = data.data?.wrappedDomains[0]?.owner?.id;

        return (
            (unwrappedOwner &&
                unwrappedOwner.toLowerCase() === owner.toLowerCase()) ||
            (wrappedOwner && wrappedOwner.toLowerCase() === owner.toLowerCase())
        );
    } catch (error) {
        logger.error(`Error checking ENS owner: ${error}`);
        return false;
    }
};

export const signOperator = async (req: Request, res: Response) => {
    try {
        const { domain, expiration, owner } = req.body;
        if (!domain || !expiration || !owner) {
            res.status(400).json({
                message: "Domain, owner and expiration are required",
            });
            return;
        }
        const isOwner = await checkEnsOwner(domain, owner);
        if (!isOwner) {
            res.status(400).json({
                message: `Domain ${domain} is not owned by ${owner}`,
            });
            return;
        }
        logger.info(
            `Signing operator for domain ${domain} with expiration ${expiration} and owner ${owner}`,
        );
        if (mock) {
            res.json({
                signature: "0xdeadbeef",
                nonce: "0",
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

        let nextNonce = BigInt(Math.floor(Math.random() * 1000000000));
        let used = await client.checkUsedNonce(nextNonce);
        while (used) {
            nextNonce++;
            used = await client.checkUsedNonce(nextNonce);
        }
        const calculateExpiration =
            BigInt(Math.floor(Date.now() / 1000)) + config.deadline;

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

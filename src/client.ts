import {
    createPublicClient, http,
    nonceManager,
    padHex, PublicClient,
    toHex,
} from "viem";
import { base, localhost, optimism, optimismSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { logger } from "./log.js";
import { config } from "./config/config.js";
import { registryAbi } from "./abi/registry.abi.js";
import { domainAbi } from "./abi/domain.abi.js";

export class Client {
    private static instance: Client;
    public publicClient: PublicClient;

    private constructor() {
        let chain;
        switch (config.network) {
            case "optimism":
                chain = optimism;
                break;
            case "base":
                chain = base;
                break;
            case "local":
                chain = localhost;
                break;
            default:
                chain = optimismSepolia;
        }
        this.publicClient = createPublicClient({
            chain: chain,
            transport: http(config.rpcUrl),
        }) as PublicClient;
    }

    static getInstance() {
        if (!Client.instance) {
            Client.instance = new Client();
        }
        return Client.instance;
    }


    /**
     * Check if the nonce has been used
     * @param nonce Nonce to check
     * @returns True if the nonce has been used, false otherwise
     */
    async checkUsedNonce(nonce: bigint) {
        const hexValue = toHex(nonce);
        const byte32Value = padHex(hexValue, { size: 32 });
        const result = await this.publicClient.readContract({
            address: config.registryAddress as `0x${string}`,
            abi: registryAbi,
            functionName: "usedNonces",
            args: [byte32Value],
        });

        logger.info(`checkUsedNonce: ${result}`);
        return result;
    }

    /**
     * Get the hash of the struct with the given parameters for the registry contract
     * @param label the label of the domain
     * @param owner the owner of the domain
     * @param deadline the deadline of the expiration signature from operator
     * @param nonce the nonce of the signature from operator
     */
    async getStructHash(
        label: string,
        owner: `0x${string}`,
        deadline: bigint,
        nonce: bigint) {
        const nonceHex = toHex(nonce);
        const bytes32Nonce = padHex(nonceHex, { size: 32 });
        const result = await this.publicClient.readContract({
            address: config.registryAddress as `0x${string}`,
            abi: registryAbi,
            functionName: "getStructHash",
            args: [config.rootDomainAddress, label, owner, deadline, bytes32Nonce],
        });

        logger.info(`getStructHash: ${result}`);
        return result;
    }

    /**
     * Get the domain separator from the registry contract
     * @returns the domain separator
     */
    async getDomainSeparator() {
        const result = await this.publicClient.readContract({
            address: config.registryAddress as `0x${string}`,
            abi: registryAbi,
            functionName: "getDomainSeparator",
            args: [],
        });

        logger.info(`getDomainSeparator: ${result}`);
        return result;
    }

    /**
     * Check if the domain separator has been used
     * @param domainSeparator the domain separator to check
     * @returns address of the domain if it has been used, 0x0 otherwise
     */
    async checkUsedDomainSeparator(domainSeparator: string) {
        const result = await this.publicClient.readContract({
            address: config.rootDomainAddress as `0x${string}`,
            abi: domainAbi,
            functionName: "subdomains",
            args: [domainSeparator],
        });

        logger.info(`checkUsedDomainSeparator: ${result}`);
        return result as string;
    }

    /**
     * Sign the operator signature
     * @param label the label of the domain
     * @param owner the owner of the domain
     * @param deadline the deadline of the expiration signature from operator
     * @param nonce the nonce of the signature from operator
     * @returns the signature of the operator signature was encoded as r, s, v
     */
    async signOperator(
        label: string,
        owner: `0x${string}`,
        deadline: bigint,
        nonce: bigint,
    ) {
        const account = privateKeyToAccount(config.operatorKey as `0x${string}`, { nonceManager });
        logger.info(`signOperator-nonce: ${nonce}`);
        // EIP-712 domain data
        const domain = {
            name: "OptiPermissionedRegistry",
            version: "1.0.0",
            chainId: config.chainId,
            verifyingContract: config.registryAddress,
        };

        // EIP-712 types
        const types = {
            Register: [
                { name: "domain", type: "address" },
                { name: "label", type: "string" },
                { name: "owner", type: "address" },
                { name: "deadline", type: "uint256" },
                { name: "nonce", type: "bytes32" },
            ],
        };

        // EIP-712 message
        const nonceHex = toHex(nonce);
        const bytes32Nonce = padHex(nonceHex, { size: 32 });
        const message = {
            domain: config.rootDomainAddress,
            label: label,
            owner: owner,
            deadline: deadline,
            nonce: bytes32Nonce,
        };
        // Sign the typed data
        const signature = await account.signTypedData({
            domain,
            types,
            primaryType: "Register",
            message,
        });

        logger.info(`Signature:  ${signature}`);
        return signature;
    }
}
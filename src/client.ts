import {
    concat,
    createPublicClient,
    hexToBytes,
    http,
    keccak256,
    nonceManager,
    padHex,
    PublicClient,
    toBytes, toHex,
} from "viem";
import { base, optimism, optimismSepolia, localhost } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { logger } from "./log.js";
import { config } from "./config/config.js";
import { registryAbi } from "./abi/registry.abi.js";

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
        const structHash = await this.getStructHash(label, owner, deadline, nonce);
        const domainSeparator = await this.getDomainSeparator();
        const digest = keccak256(
            concat([
                toBytes("\x19\x01"), // EIP-712 prefix
                hexToBytes(domainSeparator as `0x${string}`), // Domain separator from contract
                hexToBytes(structHash as `0x${string}`), // Struct hash
            ])
        );
        const signature = await account.signMessage({ message: digest });
        const r = signature.slice(0, 66) as `0x${string}`; // first 32 bytes
        const s = '0x' + signature.slice(66, 130) as `0x${string}`; // second 32 bytes
        const v = parseInt(signature.slice(130, 132), 16); // last byte as integer

        return concat([r, s, `0x${v.toString(16).padStart(2, '0')}`]);
    }
}
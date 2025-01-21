import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env["PORT"] || 5000,
    env: process.env["NODE_ENV"] || 'development',
    network: process.env["NETWORK"] || 'sepolia',
    rpcUrl: process.env["RPC_URL"] || 'https://rpc.sepolia.io',
    registryAddress: process.env["REGISTRY_ADDRESS"] || '0x',
    rootDomainAddress: process.env["ROOT_DOMAIN_ADDRESS"] || '0x',
    operatorKey: process.env["OPERATOR_KEY"] || '0x',
    deadline: BigInt(process.env["DEADLINE"] || '10').valueOf(),
};
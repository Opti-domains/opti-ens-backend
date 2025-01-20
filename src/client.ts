// import {
//     createPublicClient,
//     createWalletClient,
//     http,
//     nonceManager,
//     PublicClient,
//     WalletClient,
// } from "viem";
// import { base, optimism, optimismSepolia } from "viem/chains";
// import { privateKeyToAccount } from "viem/accounts";
// import { NETWORK, PRIVATE_KEY, RPC_URL, WALLET_VERIFIER_ADDRESS } from "./env.js";
// import { WalletOptimisticVerifierABI } from "./abi/wallet.optimistic.verifier.js";
// import { logger } from "./log.js";
//
// export class Client {
//     private static instance: Client;
//     public publicClient: PublicClient;
//     private walletClient: WalletClient;
//
//     private constructor() {
//         let chain;
//         switch (NETWORK) {
//             case "optimism":
//                 chain = optimism;
//                 break;
//             case "base":
//                 chain = base;
//                 break;
//             default:
//                 chain = optimismSepolia;
//         }
//         this.publicClient = createPublicClient({
//             chain: chain,
//             transport: http(RPC_URL),
//         }) as PublicClient;
//
//         this.walletClient = createWalletClient({
//             chain: chain,
//             transport: http(RPC_URL),
//         }) as WalletClient;
//     }
//
//     static getInstance() {
//         if (!Client.instance) {
//             Client.instance = new Client();
//         }
//         return Client.instance;
//     }
//
//     // verifyAdd returns true if signature is invalid
//     // otherwise returns false
//     async verifyAdd(
//         fid: bigint,
//         verifyAddress: `0x${string}`,
//         publicKey: `0x${string}`,
//         signature: `0x${string}`,
//     ) {
//         try {
//             const result  = await this.publicClient.readContract({
//                 address: WALLET_VERIFIER_ADDRESS as `0x${string}`,
//                 abi: WalletOptimisticVerifierABI,
//                 functionName: "tryChallengeAdd",
//                 args: [
//                     fid,
//                     verifyAddress,
//                     publicKey,
//                     signature,
//                 ],
//             });
//
//             logger.info(`tryChallengeAdd: ${result}`);
//             return result;
//         } catch (err) {
//             logger.error(`tryChallengeAdd error: ${err}`);
//             return false;
//         }
//     }
//
//     // verifyRemove returns true if signature is invalid
//     // otherwise returns false
//     async verifyRemove(
//         fid: bigint,
//         verifyAddress: `0x${string}`,
//         publicKey: `0x${string}`,
//         signature: `0x${string}`,
//     ) {
//         try {
//             const result = await this.publicClient.readContract({
//                 address: WALLET_VERIFIER_ADDRESS as `0x${string}`,
//                 abi: WalletOptimisticVerifierABI,
//                 functionName: "tryChallengeRemove",
//                 args: [
//                     fid,
//                     verifyAddress,
//                     publicKey,
//                     signature,
//                 ],
//             });
//
//             logger.info(`tryChallengeRemove: ${result}`);
//             return result;
//         } catch (err) {
//             logger.error(`tryChallengeRemove error: ${err}`);
//             return false;
//         }
//     }
//
//     async challengeAdd(
//         fid: bigint,
//         verifyAddress: `0x${string}`,
//         publicKey: `0x${string}`,
//         signature: `0x${string}`,
//     ) {
//         const { request } = await this.publicClient.simulateContract({
//             address: WALLET_VERIFIER_ADDRESS as `0x${string}`,
//             abi: WalletOptimisticVerifierABI,
//             functionName: "challengeAdd",
//             args: [
//                 fid,
//                 verifyAddress,
//                 publicKey,
//                 signature,
//             ],
//             account: privateKeyToAccount(PRIVATE_KEY as `0x${string}`, { nonceManager }),
//         });
//
//         const txHash = await this.walletClient.writeContract(request);
//
//         logger.info(`Submitted proof to contract: ${txHash}`);
//         return txHash;
//     }
//
//     async challengeRemove(
//         fid: bigint,
//         verifyAddress: `0x${string}`,
//         publicKey: `0x${string}`,
//         signature: `0x${string}`,
//     ) {
//         const { request } = await this.publicClient.simulateContract({
//             address: WALLET_VERIFIER_ADDRESS as `0x${string}`,
//             abi: WalletOptimisticVerifierABI,
//             functionName: "challengeRemove",
//             args: [
//                 fid,
//                 verifyAddress,
//                 publicKey,
//                 signature,
//             ],
//             account: privateKeyToAccount(PRIVATE_KEY as `0x${string}`, { nonceManager }),
//         });
//
//         const txHash = await this.walletClient.writeContract(request);
//
//         logger.info(`Submitted proof to contract: ${txHash}`);
//         return txHash;
//     }
// }
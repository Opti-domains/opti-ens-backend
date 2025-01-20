# <h1 align="center"> Farcaster Challenge </h1>

# <p align="center">Challenge service will get submitted proof from contract and then verify. If have any invalid proof, challenger will call challenge to contract and get reward</p>

## How to use
```shell
git clone https://github.com/johnyupnode/simple-ai.git
cd farcaster-challenge
pnpm install
pnpm build
pnpm start
```

## Config environment
```shell
cp .env.example .env
```
After that, you need to fill in the environment variables in the `.env` file
- `NETWORK` - Network of blockchain that you want to connect to
- `RPC_URL` - RPC URL of blockchain that you want to connect to
- `PRIVATE_KEY` - Private key of the account that you want to use to interact with the contract
- `WALLET_VERIFIER_ADDRESS` - Address of the verifier wallet contract. That use to query event submit proof and call challenge
- `MAX_BEHIND_BLOCKS` - The maximum number of blocks that the service can be behind the current block
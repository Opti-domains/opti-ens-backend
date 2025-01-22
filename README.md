# <h1 align="center"> Singular Backend </h1>

# <p align="center">This service use to provider signature of operator.</p>

## How to use
```shell
git clone https://github.com/phanhoc/singular-be.git
cd singular-be
pnpm install
pnpm build
pnpm start
```

## Config environment
```shell
cp .env.example .env
```
After that, you need to fill in the environment variables in the `.env` file
- `PORT` - Port of server (default: 5100)
- `NETWORK` - Network of blockchain (default: localhost)
- `CHAIN_ID` - Chain id of blockchain (default: 31337)
- `RPC_URL` - RPC url of blockchain (default: http://localhost:8545)
- `REGISTRY_ADDRESS` - Address of registry contract (default: 0x)
- `ROOT_DOMAIN_ADDRESS` - Address of root domain contract (default: 0x)
- `OPERATOR_KEY` - Private key of operator use to sign transaction (default: 0x)
- `DEADLINE` - Deadline of signature example for 1h: 1737516606
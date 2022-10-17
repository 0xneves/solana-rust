### Hellow world aplication

## Building our program (smart contract)

```
cargo build-bpf
```

## Generating keys and stuff

```
solana-keygen new
solana config set --keypair /home/guilherme/.config/solana/id.json
solana config set --url devnet
```

## Airdroping SOL

Máximum of 1

```
solana airdrop 1
solana balance
```

## Deploy the program

```
solana program deploy hello-world/src/program/target/deploy/hello_solana.so
```

Above might not work, then try:

```
solana program deploy ../../dist/program/hello_solana.so
```

## Get programs info

```
solana program show --programs --config /home/guilherme/.config/solana/id.json --url devnet
```

## Deploy to a specific program id

```
solana program deploy --program-id <KEYPAIR_FILEPATH> <PROGRAM_FILEPATH>
```

## Start Solana Cluster

```
solana-test-validator
solana logs | grep "<PROGRAM_ID>"
```

## Clean and Build

```
pnpm run reset-and-build
pnpm run example:sum
pnpm run example:square
```

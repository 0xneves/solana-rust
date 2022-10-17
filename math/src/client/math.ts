import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { createKeypairFromFile } from './util'
import fs from 'mz/fs'
import os from 'os'
import path from 'path'
import yaml from 'yaml'
import * as borsh from 'borsh'

/*
Paht to Solana CLI config file
*/
const CONFIG_FILE_PATH = path.join(
  os.homedir(),
  '.config',
  'solana',
  'cli',
  'config.yml',
)

let connection: Connection
let localKeypair: Keypair
let programKeypair: Keypair
let programId: PublicKey
let clientPubKey: PublicKey

const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program')

export async function connect(): Promise<void> {
  connection = new Connection('https://api.devnet.solana.com', 'confirmed')
  console.log('Connecting to devnet')
}

export async function getLocalAccount(): Promise<void> {
  const configYml = await fs.readFile(CONFIG_FILE_PATH, { encoding: 'utf8' })
  const keypairPath = await yaml.parse(configYml).keypair_path
  localKeypair = await createKeypairFromFile(keypairPath)
  const airdropRequest = await connection.requestAirdrop(
    localKeypair.publicKey,
    LAMPORTS_PER_SOL,
  )
  // const latestBlockHash = await connection.getLatestBlockhash()
  // await connection.confirmTransaction({
  //   blockhash: latestBlockHash.blockhash,
  //   lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  //   signature: airdropRequest,
  // })
  await connection.confirmTransaction(airdropRequest)
  console.log('Local account loaded successfully')
  console.log('Local accounts address is:')
  console.log(`     ${localKeypair.publicKey}`)
}

export async function loadProgram(programName: string): Promise<void> {
  programKeypair = await createKeypairFromFile(
    path.join(PROGRAM_PATH, programName + '-keypair.json'),
  )
  programId = programKeypair.publicKey
  console.log(`Program ${programName} successfully`)
  console.log('Program address(ID) is:')
  console.log(`     ${programId.toBase58()}`)
}

export async function configureClientAccount(
  accountSpaceSize: number,
  programName: string,
): Promise<void> {
  const SEED = 'math'
  clientPubKey = await PublicKey.createWithSeed(
    localKeypair.publicKey,
    SEED,
    programId,
  )

  const clientAccount = await connection.getAccountInfo(clientPubKey)

  if (clientAccount === null) {
    console.log('Creating account', clientPubKey.toBase58())

    const lamports = await connection.getMinimumBalanceForRentExemption(
      accountSpaceSize,
    )

    const createAccountTransaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: localKeypair.publicKey,
        basePubkey: localKeypair.publicKey,
        seed: SEED,
        newAccountPubkey: clientPubKey,
        lamports,
        space: accountSpaceSize,
        programId,
      }),
    )
    await sendAndConfirmTransaction(connection, createAccountTransaction, [
      localKeypair,
    ])
    console.log('Client account created successfully')
  } else {
    console.log('Client account already exists')
  }
  return
}

export async function pingProgram(programName: string): Promise<void> {
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: clientPubKey, isSigner: false, isWritable: true }],
    programId,
    data: Buffer.alloc(0),
  })
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [localKeypair],
  )
  console.log(`Ping sent to ${programName}`)
}

export async function example(programName: string, accountSpaceSize: number) {
  await connect()
  await getLocalAccount()
  await loadProgram(programName)
  await configureClientAccount(accountSpaceSize, programName)
  await pingProgram(programName)
}

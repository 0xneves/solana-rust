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

export async function connect() {
  connection = new Connection('https://api.devnet.solana.com', 'confirmed')
  console.log('Connecting to devnet')
}

export async function getLocalAccount() {
  const configYml = await fs.readFile(CONFIG_FILE_PATH, { encoding: 'utf8' })
  const keypairPath = await yaml.parse(configYml).keypair_path
  localKeypair = await createKeypairFromFile(keypairPath)
  const airdropRequest = await connection.requestAirdrop(
    localKeypair.publicKey,
    LAMPORTS_PER_SOL,
  )
  const latestBlockHash = await connection.getLatestBlockhash()
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: airdropRequest,
  })
  console.log('Local account loaded successfully')
  console.log('Local accounts address is:')
  console.log(`     ${localKeypair.publicKey}`)
}

export async function loadProgram(programName: string) {
  programKeypair = await createKeypairFromFile(
    path.join(PROGRAM_PATH, programName + '-keypair.json'),
  )
  programId = programKeypair.publicKey
  console.log(`Program ${programName} successfully`)
  console.log('Program address(ID) is:')
  console.log(`     ${programId.toBase58()}`)
}

export async function configureClientAccount(accountSpaceSize: number) {
  const SEED = 'test1'
  clientPubKey = await PublicKey.createWithSeed(
    localKeypair.publicKey,
    SEED,
    programId,
  )
  console.log('The generated address is:')
  console.log(`     ${clientPubKey.toBase58()}`)

  const clientAccount = await connection.getAccountInfo(clientPubKey)
  if (clientAccount === null) {
    console.log('Creating client account...')
    const createAccountTransaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: localKeypair.publicKey,
        basePubkey: localKeypair.publicKey,
        seed: SEED,
        newAccountPubkey: clientPubKey,
        lamports: LAMPORTS_PER_SOL,
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

export async function pingProgram(programName: string) {
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
  await configureClientAccount(accountSpaceSize)
  await pingProgram(programName)
}

import {
  Keypair,
  Connection,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import fs from 'mz/fs'
import path from 'path'

const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program')

const PROGRAM_KEYPAIR_PATH = path.join(
  PROGRAM_PATH,
  'hello_solana-keypair.json',
)
const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'helloworld.so')

async function main() {
  console.log('Launching client...')

  /*
  Connect to Solana Devnet
  */
  let connection = new Connection('http://127.0.0.1:8899', 'confirmed')

  /*
  Get our program's public key
  */
  let programKeypair = await Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        (
          await fs.readFile(PROGRAM_KEYPAIR_PATH, { encoding: 'utf8' })
        ).toString(),
      ),
    ),
  )
  let programId: PublicKey = programKeypair.publicKey

  /*
  Generate an account (keypair) to transact with our program
  */
  const latestBlockHash = await connection.getLatestBlockhash()
  const triggerKeypair = Keypair.generate()
  const airdropRequest = await connection.requestAirdrop(
    triggerKeypair.publicKey,
    LAMPORTS_PER_SOL,
  )
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: airdropRequest,
  })

  /*
  Check if the program has been deployed
  */
  const programInfo = await connection.getAccountInfo(programId)
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error(
        'Program needs to be deployed with `solana program deploy ../../dist/program/hello_solana.so`',
      )
    } else {
      throw new Error('Program needs to be built and deployed')
    }
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`)
  }
  console.log(`Using program ${programId.toBase58()}`)

  /*
    Create a transaction to invoke our program
  */
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: triggerKeypair.publicKey, isSigner: true, isWritable: true },
    ],
    programId,
    data: Buffer.alloc(0),
  })
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [triggerKeypair],
  )
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err)
    process.exit(-1)
  },
)

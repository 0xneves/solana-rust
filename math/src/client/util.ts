import { Keypair } from '@solana/web3.js'
import fs from 'mz/fs'

export async function createKeypairFromFile(
  filePath: string,
): Promise<Keypair> {
  return await Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(await fs.readFile(filePath, { encoding: 'utf8' })),
    ),
  )
}

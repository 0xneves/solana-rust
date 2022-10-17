import * as borsh from 'borsh'
import * as math from './math'

class SquareCounter {
  square = 0
  constructor(fields: { square?: number } = {}) {
    this.square = fields.square || 0
  }
}

const MathStuffSquareSchema = new Map([
  [SquareCounter, { kind: 'struct', fields: [['square', 'u32']] }],
])

const MATH_STUFF_SIZE = borsh.serialize(
  MathStuffSquareSchema,
  new SquareCounter(),
).length

async function main() {
  await math.example('square', MATH_STUFF_SIZE)
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err)
    process.exit(-1)
  },
)

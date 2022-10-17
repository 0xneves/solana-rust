import * as borsh from 'borsh'
import * as math from './math'

class SumCounter {
  sum = 0
  constructor(fields: { sum?: number } = {}) {
    this.sum = fields.sum || 0
  }
}

const MathStuffSumSchema = new Map([
  [SumCounter, { kind: 'struct', fields: [['sum', 'u32']] }],
])

const MATH_STUFF_SIZE = borsh.serialize(MathStuffSumSchema, new SumCounter())
  .length

async function main() {
  await math.example('sum', MATH_STUFF_SIZE)
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err)
    process.exit(-1)
  },
)

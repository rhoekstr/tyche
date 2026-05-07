import type { AnimationMode, PackItem } from '@/types/pack'
import SlotMachine from './SlotMachine'
import CoinAnimation from './CoinAnimation'
import DiceAnimation from './DiceAnimation'
import CardAnimation from './CardAnimation'
import RPSAnimation from './RPSAnimation'

interface Props {
  mode: AnimationMode
  pool: PackItem[]
  result: PackItem | null
  spinId: number
  isSpinning: boolean
  onComplete: () => void
  durationMs?: number
}

export default function AnimationStage(props: Props) {
  switch (props.mode) {
    case 'coin':
      return <CoinAnimation {...props} />
    case 'dice':
      return <DiceAnimation {...props} />
    case 'card':
      return <CardAnimation {...props} />
    case 'rps':
      return <RPSAnimation {...props} />
    default:
      return <SlotMachine {...props} />
  }
}

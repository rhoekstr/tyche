import { Routes, Route } from 'react-router-dom'
import Shell from '@/components/layout/Shell'
import Home from '@/components/layout/Home'
import About from '@/components/layout/About'
import Settings from '@/components/layout/Settings'
import Randomizer from '@/components/randomizer/Randomizer'
import MultiSlot from '@/components/randomizer/MultiSlot'
import CustomPackBuilder from '@/components/browser/CustomPackBuilder'
import CoinFlip from '@/components/utilities/CoinFlip'
import DiceRoll from '@/components/utilities/DiceRoll'
import RPS from '@/components/utilities/RPS'
import CardDraw from '@/components/utilities/CardDraw'
import SlotPicker from '@/components/utilities/SlotPicker'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pack/:id" element={<Randomizer />} />
        <Route path="/multi" element={<MultiSlot />} />
        <Route path="/custom" element={<CustomPackBuilder />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="/utility/coin" element={<CoinFlip />} />
        <Route path="/utility/dice" element={<DiceRoll />} />
        <Route path="/utility/rps" element={<RPS />} />
        <Route path="/utility/card" element={<CardDraw />} />
        <Route path="/utility/slot" element={<SlotPicker />} />
      </Routes>
    </Shell>
  )
}

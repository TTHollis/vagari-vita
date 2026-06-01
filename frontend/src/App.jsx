import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LocalMode from './pages/LocalMode'
import NomadMode from './pages/NomadMode'
import Saved from './pages/Saved'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/local" element={<LocalMode />} />
      <Route path="/nomad" element={<NomadMode />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}

import React from 'react'
import Header from './Header'
import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import Help from './Help'

export default function App() {
  return (
    <div>
      <Header/>
      <Routes>
      <Route path='/' element={<Home />} />
      <Route path="/help" element={<Help />} />
      </Routes>
    </div>
  )
}

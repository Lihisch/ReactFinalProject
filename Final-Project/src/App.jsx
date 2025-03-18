import React from 'react'
import Header from './components/Header'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Help from './components/Help'
import Info from './components/Info'
import Grades from './components/Grades'
import Courses from './components/Courses'
import Forms from './components/Forms'
import Management from './components/Management'




export default function App() {
  return (
    <div>
      <Header/>
      <Routes>
      <Route path='/' element={<Home />} />
      <Route path="/help" element={<Help />} />
      <Route path="/info" element={<Info />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/grades" element={<Grades />} />
      <Route path="/forms" element={<Forms />} />
      <Route path="/management" element={<Management />} />
    
      </Routes>
    </div>
  )
}

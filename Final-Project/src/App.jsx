import React from 'react'
import Header from './components/Header'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Help from './components/Help'
import Info from './components/Info'
import Grades from './components/Grades'
import Courses from './components/Courses'
import CourseForm from './components/CourseForm'
import CourseManagement from './components/CourseManagement'
import Assignments from './components/Assignments'
import CourseList from './components/CourseList'


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
      <Route path="/courseform" element={<CourseForm />} />
      <Route path="/coursemanagement" element={<CourseManagement />} />
      <Route path="/assignments" element={<Assignments />} />
      <Route path="/courselist" element={<CourseList />} />
      </Routes>
    </div>
  )
}

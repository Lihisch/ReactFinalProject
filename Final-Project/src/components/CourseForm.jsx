import React from 'react'

export default function CourseForm() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      padding: '20px',
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Course List</h1>
      <div style={{
        width: '80%',
        maxWidth: '800px',
        backgroundColor: 'white',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}>
          {courses.map((course, index) => (
            <li key={index} style={{
              padding: '10px',
              textAlign: 'center',
              borderBottom: '1px solid #ddd',
            }}>
              {course}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={handleNewCourseClick}
        style={{
          marginTop: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        New Course
      </button>
    </div>
  );
}

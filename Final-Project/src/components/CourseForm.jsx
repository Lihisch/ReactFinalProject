import React, { useState } from 'react';

export default function CourseForm() {
  const [formData, setFormData] = useState({
    courseName: '',
    courseId: '',
    courseType: '',
    creditPoints: '',
    semester: '',
    professorsName: '',
    dayOfWeek: '',
    courseHours: '',
    description: '',
    startingDate: '',
    maxStudents: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Form submitted!", formData);

    // Retrieve existing courses from local storage or initialize an empty array
    const existingCourses = JSON.parse(localStorage.getItem("courses")) || [];

    // Add the new course to the array
    existingCourses.push(formData);

    // Save the updated array back to local storage
    localStorage.setItem("courses", JSON.stringify(existingCourses));

    // Optionally, you can reset the form after submission
    setFormData({
      courseName: '',
      courseId: '',
      courseType: '',
      creditPoints: '',
      semester: '',
      professorsName: '',
      dayOfWeek: '',
      courseHours: '',
      description: '',
      startingDate: '',
      maxStudents: '',
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box', // Ensure padding and border are included in the width
  };

  const selectStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    appearance: 'none', // Remove default arrow in some browsers
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        width: '800px',
        maxWidth: '95%',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Course Form</h1>
        <form onSubmit={handleSubmit}>
          {/* Course Name (Full Row) */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="courseName" style={labelStyle}>Course Name:</label>
            <input
              type="text"
              id="courseName"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Course ID & Course Type (Row 1) */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="courseId" style={labelStyle}>Course ID:</label>
              <input
                type="text"
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="courseType" style={labelStyle}>Course Type:</label>
              <select
                id="courseType"
                name="courseType"
                value={formData.courseType}
                onChange={handleChange}
                style={selectStyle}
                required
              >
                <option value="">Select Type</option>
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>
          </div>

          {/* Credit Points & Semester (Row 2) */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="creditPoints" style={labelStyle}>Credit Points:</label>
              <input
                type="number"
                id="creditPoints"
                name="creditPoints"
                value={formData.creditPoints}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="semester" style={labelStyle}>Semester:</label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                style={selectStyle}
                required
              >
                <option value="">Select Semester</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          {/* Professor's Name & Day of Week (Row 3) */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="professorsName" style={labelStyle}>Professor's Name:</label>
              <select
                id="professorsName"
                name="professorsName"
                value={formData.professorsName}
                onChange={handleChange}
                style={selectStyle}
                required
              >
                <option value="">Select Professor</option>
                <option value="Dr. Smith">Dr. Smith</option>
                <option value="Prof. Johnson">Prof. Johnson</option>
                <option value="Dr. Lee">Dr. Lee</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="dayOfWeek" style={labelStyle}>Day of Week:</label>
              <select
                id="dayOfWeek"
                name="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={handleChange}
                style={selectStyle}
                required
              >
                <option value="">Select Day</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
              </select>
            </div>
          </div>

          {/* Course Hours & Max Students (Row 4) */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="courseHours" style={labelStyle}>Course Hours:</label>
              <input
                type="time"
                id="courseHours"
                name="courseHours"
                value={formData.courseHours}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="maxStudents" style={labelStyle}>Max Students:</label>
              <input
                type="number"
                id="maxStudents"
                name="maxStudents"
                value={formData.maxStudents}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Description (Full Row) */}
          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="description" style={labelStyle}>Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
              required
            />
          </div>

          {/* Starting Date (Full Row) */}
          <div style={{ marginBottom: '30px' }}>
            <label htmlFor="startingDate" style={labelStyle}>Starting Date:</label>
            <input
              type="date"
              id="startingDate"
              name="startingDate"
              value={formData.startingDate}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Create Course
          </button>
        </form>
      </div>
    </div>
  );
}

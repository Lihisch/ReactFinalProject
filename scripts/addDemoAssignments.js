import { listCourses } from '../src/firebase/courses';
import { addAssignment, listAssignments } from '../src/firebase/assignments';

async function addAssignmentsForSemesters() {
  const courses = await listCourses();
  const assignments = await listAssignments();

  let assignmentCounter = assignments.length;

  // Handle Semester B (at least 4 assignments)
  const semesterBCourses = courses.filter(
    c => c.semester === 'B' || c.semesterName === 'B' || c.semester === 'סמסטר ב'
  );
  for (const course of semesterBCourses) {
    const courseAssignments = assignments.filter(a => a.courseId === course.courseId);
    const assignmentsToAdd = 4 - courseAssignments.length;
    for (let i = 0; i < assignmentsToAdd; i++) {
      assignmentCounter++;
      const nextId = assignmentCounter.toString().padStart(3, '0');
      const assignmentData = {
        assignmentId: nextId,
        courseId: course.courseId,
        courseName: course.courseName,
        assignmentName: `Auto Assignment ${course.courseId} #${i + 1}`,
        assignmentType: 'Individual',
        dueDate: '2024-07-01',
        weight: 10,
        description: 'Auto-generated assignment for Semester B',
        fileName: '',
        status: 'Pending'
      };
      await addAssignment(assignmentData);
      console.log(`Added assignment ${assignmentData.assignmentName} to course ${course.courseId}`);
    }
  }

  // Handle Semester A (at least 1 assignment)
  const semesterACourses = courses.filter(
    c => c.semester === 'A' || c.semesterName === 'A' || c.semester === 'סמסטר א'
  );
  for (const course of semesterACourses) {
    const courseAssignments = assignments.filter(a => a.courseId === course.courseId);
    if (courseAssignments.length < 1) {
      assignmentCounter++;
      const nextId = assignmentCounter.toString().padStart(3, '0');
      const assignmentData = {
        assignmentId: nextId,
        courseId: course.courseId,
        courseName: course.courseName,
        assignmentName: `Auto Assignment ${course.courseId} #1`,
        assignmentType: 'Individual',
        dueDate: '2024-07-01',
        weight: 10,
        description: 'Auto-generated assignment for Semester A',
        fileName: '',
        status: 'Pending'
      };
      await addAssignment(assignmentData);
      console.log(`Added assignment ${assignmentData.assignmentName} to course ${course.courseId}`);
    }
  }
  console.log('Done!');
}

addAssignmentsForSemesters(); 
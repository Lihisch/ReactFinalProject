import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { firestore } from './firebase-settings';

// Add a new course
export const addCourse = async (courseData) => {
  try {
    // Validate course data
    if (!courseData.courseId || !courseData.courseName) {
      throw new Error('Course ID and Course Name are required');
    }

    // Check if course ID already exists
    const existingCourse = await getCourseById(courseData.courseId);
    if (existingCourse) {
      throw new Error('Course ID already exists');
    }

    const docRef = await addDoc(collection(firestore, 'courses'), {
      ...courseData,
      startingDate: courseData.startingDate || new Date().toISOString().split('T')[0],
      courseHours: `${courseData.startTime || ''} - ${courseData.endTime || ''}`,
      semester: courseData.semester || 'A' // Default to Semester A if not specified
    });
    return courseData;
  } catch (error) {
    console.error("Error adding course:", error);
    throw error;
  }
};

// Get all courses
export const listCourses = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'courses'));
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error getting courses:", error);
    throw error;
  }
};

// Get a single course by ID
export const getCourseById = async (courseId) => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const courseQuery = query(collection(firestore, 'courses'), where('courseId', '==', courseId));
    const querySnapshot = await getDocs(courseQuery);
    
    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error("Error getting course:", error);
    throw error;
  }
};

// Update a course
export const updateCourse = async (courseId, courseData) => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Validate course data
    if (!courseData.courseName) {
      throw new Error('Course Name is required');
    }

    const courseQuery = query(collection(firestore, 'courses'), where('courseId', '==', courseId));
    const querySnapshot = await getDocs(courseQuery);
    
    if (querySnapshot.empty) {
      throw new Error('Course not found');
    }

    const docRef = doc(firestore, 'courses', querySnapshot.docs[0].id);
    await updateDoc(docRef, courseData);

    return courseData;
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
};

// Delete  course
export const deleteCourses = async (courseIds) => {
  try {
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new Error('Course IDs array is required');
    }

    const deletePromises = courseIds.map(async (courseId) => {
      if (!courseId) {
        console.warn('Invalid course ID provided for deletion');
        return;
      }

      const courseQuery = query(collection(firestore, 'courses'), where('courseId', '==', courseId));
      const querySnapshot = await getDocs(courseQuery);
      
      if (!querySnapshot.empty) {
        const docRef = doc(firestore, 'courses', querySnapshot.docs[0].id);
        await deleteDoc(docRef);
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting courses:", error);
    throw error;
  }
};

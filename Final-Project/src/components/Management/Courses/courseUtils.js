import { isPast, parseISO as dateFnsParseISO, isFuture, isToday } from 'date-fns';

export const parseDateSafe = (dateInput) => {
  if (!dateInput) return null;
  try {
    let date;
    if (typeof dateInput === 'string' && (dateInput.includes('T') || dateInput.match(/^\d{4}-\d{2}-\d{2}$/))) {
      date = dateFnsParseISO(dateInput);
    } else if (dateInput && typeof dateInput.seconds === 'number' && typeof dateInput.nanoseconds === 'number') {
      date = new Date(dateInput.seconds * 1000 + dateInput.nanoseconds / 1000000);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error("Error parsing date:", dateInput, e);
    return null;
  }
};

export const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = parseDateSafe(dateString);
    return date ? date.toLocaleDateString('en-CA') : 'Invalid Date';
  } catch (e) { return 'Invalid Date'; }
};

export const getCourseStatus = (startDateInput, endDateInput) => {
  const startDate = parseDateSafe(startDateInput);
  const endDate = parseDateSafe(endDateInput);
  const today = new Date();
  today.setHours(0,0,0,0);

  if (endDate && isPast(endDate) && !isToday(endDate)) {
    return { text: 'Completed', chipColor: 'default', chipVariant: 'outlined', textColor: 'text.secondary', sortOrder: 3 };
  }
  if (startDate && (isPast(startDate) || isToday(startDate))) {
    if (!endDate || isFuture(endDate) || isToday(endDate)) {
      return { text: 'Active', chipColor: 'success', chipVariant: 'outlined', textColor: 'success.main', sortOrder: 1 };
    }
  }
  if (startDate && isFuture(startDate)) {
    return { text: 'Future', chipColor: 'info', chipVariant: 'outlined', textColor: 'info.main', sortOrder: 2 };
  }
  return { text: 'Unknown', chipColor: 'default', chipVariant: 'outlined', textColor: 'text.disabled', sortOrder: 4 };
};

export const formatDateForInput = (dateInput) => {
  const date = parseDateSafe(dateInput);
  if (!date) return '';
  if (date instanceof Date && !isNaN(date)) {
    return date.toISOString().split('T')[0];
  }
  return '';
}; 
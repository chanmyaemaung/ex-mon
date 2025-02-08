export function getCurrentDate(): string {
  // Return current date in "YYYY-MM-DD" format
  return new Date().toISOString().split('T')[0];
}

export function convertToDate(dateString: string): Date {
  // Convert "DD/MM/YYYY" to Date object
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
}

export function formatDateString(date: string): string {
  // Convert "YYYY-MM-DD" to "DD/MM/YYYY"
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export function getPreviousDate(dateString: string): string | null {
  // Convert "DD/MM/YYYY" to Date object
  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);
  date.setDate(date.getDate() - 1);

  // Return in "YYYY-MM-DD" format
  return date.toISOString().split('T')[0];
}

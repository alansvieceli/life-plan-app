const pad = (value: number) => String(value).padStart(2, '0');

// For number fields: a typed "5" becomes "05"; a blank field stays blank.
export function padTwoDigits(text: string) {
  return text.trim() === '' ? text : text.trim().padStart(2, '0');
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h${pad(rest)}`;
}

export function formatTimeRange(startTime: string, durationMin: number) {
  const end = (timeToMinutes(startTime) + durationMin) % (24 * 60);
  return `${startTime}–${pad(Math.floor(end / 60))}:${pad(end % 60)}`;
}

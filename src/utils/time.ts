export function timePeriod(hhmm: string): string {
  const h = parseInt(hhmm.split(':')[0], 10);
  if (h >= 5 && h < 12) return 'בוקר';
  if (h >= 12 && h < 14) return 'צהריים';
  if (h >= 14 && h < 18) return 'אחה"צ';
  if (h >= 18 && h < 22) return 'ערב';
  return 'לילה';
}

export function buildTimeLabel(start: string, end: string): string {
  if (!start) return '';
  const period = timePeriod(start);
  return end ? `${period} | ${start}–${end}` : `${period} | ${start}`;
}

export function parseTimeStr(timeStr: string): { start: string; end: string } {
  if (!timeStr) return { start: '', end: '' };
  const pipe = timeStr.indexOf('|');
  if (pipe === -1) return { start: '', end: '' };
  const rest = timeStr.slice(pipe + 1).trim();
  const dash = rest.indexOf('–');
  if (dash === -1) return { start: rest.trim(), end: '' };
  return {
    start: rest.slice(0, dash).trim(),
    end: rest.slice(dash + 1).trim(),
  };
}

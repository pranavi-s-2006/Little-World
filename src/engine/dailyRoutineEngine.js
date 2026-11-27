// dailyRoutineEngine.js — suggests activities based on virtual hour
export const ROUTINE = [
  { hourStart: 6,  hourEnd: 8,  activity: 'wake',      room: 'bedroom',  label: 'Wake up & morning routine' },
  { hourStart: 8,  hourEnd: 9,  activity: 'breakfast',  room: 'kitchen',  label: 'Breakfast time' },
  { hourStart: 9,  hourEnd: 11, activity: 'study',      room: 'study',    label: 'Study time' },
  { hourStart: 11, hourEnd: 12, activity: 'play',       room: 'playroom', label: 'Play time' },
  { hourStart: 12, hourEnd: 13, activity: 'lunch',      room: 'kitchen',  label: 'Lunch time' },
  { hourStart: 13, hourEnd: 14, activity: 'rest',       room: 'bedroom',  label: 'Afternoon rest' },
  { hourStart: 14, hourEnd: 16, activity: 'study',      room: 'study',    label: 'Study time' },
  { hourStart: 16, hourEnd: 17, activity: 'garden',     room: 'garden',   label: 'Garden time' },
  { hourStart: 17, hourEnd: 18, activity: 'snack',      room: 'kitchen',  label: 'Snack time' },
  { hourStart: 18, hourEnd: 19, activity: 'play',       room: 'playroom', label: 'Play & hobbies' },
  { hourStart: 19, hourEnd: 20, activity: 'social',     room: 'living',   label: 'Family time' },
  { hourStart: 20, hourEnd: 21, activity: 'dinner',     room: 'kitchen',  label: 'Dinner time' },
  { hourStart: 21, hourEnd: 22, activity: 'bath',       room: 'bathroom', label: 'Bath & bedtime routine' },
  { hourStart: 22, hourEnd: 24, activity: 'sleep',      room: 'bedroom',  label: 'Sleep time' },
];

export function getSuggestedRoutine(virtualHour) {
  return ROUTINE.find(r => virtualHour >= r.hourStart && virtualHour < r.hourEnd) ?? null;
}

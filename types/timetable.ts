export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri";

export type TimetableSlot = {
  subject: string;
  room?: string;
  teacher?: string;
  items?: string;
  memo?: string;
  reminder?: boolean;
};

export type SchoolTimetable = {
  gradeClass: string;
  weekdays: Record<WeekdayKey, TimetableSlot[]>;
  afterSchoolNotes: Partial<Record<WeekdayKey, string>>;
  dayTimes: string[];
};

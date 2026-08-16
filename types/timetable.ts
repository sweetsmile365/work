export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri";

export type TimetableSlot = {
  subject: string;
  room?: string;
  teacher?: string;
  items?: string;
  memo?: string;
  reminder?: boolean;
};

export type TimetableDayOverride = {
  /** この日を「授業なし」として扱う */
  noSchool?: boolean;
  /** 「短縮授業」「定期テスト」など、その日の補足 */
  label?: string;
  /** この日だけ何限まで授業があるか。未指定なら通常時間割どおり */
  periodCount?: number;
  /**
   * 時限ごとの差分。
   * key は 0 始まりの時限 index。
   * null はその時限だけ休講。
   */
  slots?: Record<string, TimetableSlot | null>;
};

export type SchoolTimetable = {
  gradeClass: string;
  weekdays: Record<WeekdayKey, TimetableSlot[]>;
  afterSchoolNotes: Partial<Record<WeekdayKey, string>>;
  dayTimes: string[];

  /** Dashboard に時間割を表示するか */
  displayEnabled?: boolean;
  /** この日以降、通常時間割を Dashboard に表示する */
  displayFrom?: string;
  /** 日付ごとの臨時変更 */
  dailyOverrides?: Record<string, TimetableDayOverride>;
};

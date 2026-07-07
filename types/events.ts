export type CalendarType = "japan_holiday" | "china_reference_holiday" | "company" | "school" | "child_activity" | "family" | "personal";

export type EventType =
  | "japan_public_holiday"
  | "china_public_holiday_reference"
  | "china_adjusted_workday_reference"
  | "company_holiday"
  | "company_workday"
  | "remote_work"
  | "business_trip"
  | "company_meeting"
  | "school_holiday"
  | "school_event"
  | "exam"
  | "school_interview"
  | "deadline"
  | "badminton_practice"
  | "badminton_match"
  | "badminton_tournament"
  | "badminton_support"
  | "piano_lesson"
  | "english_lesson"
  | "chinese_lesson"
  | "family_event"
  | "travel"
  | "medical"
  | "personal_event"
  | "other";

export type Visibility = "private" | "family" | "parents_only";

export type FamilyEvent = {
  id: string;
  title: string;
  event_type: EventType;
  calendar_type: CalendarType;
  date: string;
  start_datetime?: string;
  end_datetime?: string;
  all_day?: boolean;
  location?: string;
  visibility: Visibility;
  is_day_off?: boolean;
  need_parent_action?: boolean;
  parent_task?: string;
  child_note?: string;
  route_id?: string;
  bus_timetable_id?: string;
  need_transport?: boolean;
  transport_owner?: string;
  planned_departure_time?: string;
  planned_arrival_time?: string;
  pickup_required?: boolean;
  dropoff_required?: boolean;
  created_by?: string;
  deleted_at?: string | null;
  deleted_by?: string;
};

export type EventDraft = Omit<FamilyEvent, "id">;

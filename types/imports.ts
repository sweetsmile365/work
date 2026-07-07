import type { EventType, CalendarType } from "./events";
import type { ServiceDayType } from "./busTimetable";

export type ImportRecord = {
  id: string;
  source_type: string;
  document_type: string;
  status: "uploaded" | "parsed" | "pending_confirmation" | "confirmed" | "ignored" | "failed";
  ocr_status: "not_started" | "running" | "success" | "failed" | "fallback_mock";
  raw_ocr_text: string;
  ocr_error_message?: string;
  created_at: string;
};

export type ImportCandidate = {
  id: string;
  import_id: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  title: string;
  raw_text_jp: string;
  event_type: EventType;
  calendar_type: CalendarType;
  confidence: number;
  date_parse_status: "ok" | "warning" | "failed";
  date_parse_note?: string;
  need_parent_action: boolean;
  confirmed?: boolean;
  ignored?: boolean;
};

export type BusTimetableCandidate = {
  id: string;
  import_id: string;
  route_id?: string;
  line_name: string;
  direction_name: string;
  from_label: string;
  to_label: string;
  service_day_type: ServiceDayType;
  departure_time: string;
  arrival_time?: string;
  estimated_minutes?: number;
  confidence: number;
  raw_text_jp: string;
  confirmed?: boolean;
  ignored?: boolean;
};

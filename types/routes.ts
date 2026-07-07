export type TransportMode = "walk" | "bicycle" | "car" | "train" | "bus" | "school_bus" | "mixed" | "other";

export type RoutePath = {
  id: string;
  name: string;
  from_label: string;
  to_label: string;
  transport_mode: TransportMode;
  estimated_minutes: number;
  buffer_minutes: number;
  default_departure_reminder_minutes: number;
  note?: string;
  active: boolean;
};

export type ServiceDayType = "weekday" | "saturday" | "sunday_holiday" | "school_day" | "school_holiday" | "special";

export type BusTimetable = {
  id: string;
  route_id: string;
  line_name: string;
  direction_name: string;
  from_label: string;
  to_label: string;
  service_day_type: ServiceDayType;
  departure_time: string;
  arrival_time: string;
  estimated_minutes: number;
  bus_type: "public_bus" | "school_bus" | "other";
  active: boolean;
};

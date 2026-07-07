export type UserRole = "admin" | "parent" | "child_editor";

export type AppRoute =
  | "/dashboard"
  | "/calendar"
  | "/add-event"
  | "/import-inbox"
  | "/child-schedule"
  | "/school"
  | "/company"
  | "/holidays"
  | "/routes"
  | "/bus-timetable"
  | "/conflicts"
  | "/backup"
  | "/settings"
  | "/settings/account"
  | "/account"
  | "/recycle-bin";

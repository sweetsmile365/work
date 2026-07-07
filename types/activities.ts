export type ActivityType = "school" | "badminton" | "piano" | "english" | "chinese" | "other";

export type ChildTask = {
  id: string;
  title: string;
  task_type: "homework" | "practice" | "bring_item" | "payment" | "transport" | "reply" | "makeup_lesson" | "exam_preparation" | "other";
  due_date?: string;
  status: "todo" | "done";
  completed_by_child?: boolean;
  note?: string;
};

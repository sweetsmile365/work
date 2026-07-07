import type { EventType, CalendarType } from "@/types/events";

const parentActionKeywords = ["保護者", "参加確認", "申込", "提出", "面談", "集合", "解散", "送迎", "弁当", "持参", "遠方", "宿泊", "ホテル", "交通費", "同意書", "家长", "提交", "面谈", "集合", "接送", "便当", "携带", "交通费", "同意书"];

export function classifyJapaneseEvent(rawText: string): { event_type: EventType; calendar_type: CalendarType; is_day_off?: boolean; need_parent_action: boolean } {
  const text = rawText || "";
  const need_parent_action = parentActionKeywords.some((word) => text.includes(word));
  if (/(大会|試合|県総体|地区大会|スウィングカップ|比赛|大会)/.test(text)) return { event_type: "badminton_tournament", calendar_type: "child_activity", need_parent_action: true };
  if (/(団体戦|個人戦|ダブルス|シングルス|团体赛|个人赛|双打|单打)/.test(text)) return { event_type: "badminton_match", calendar_type: "child_activity", need_parent_action };
  if (/(応援|補助|支援|协助)/.test(text)) return { event_type: "badminton_support", calendar_type: "child_activity", need_parent_action };
  if (/(バドミントン|バド部|練習|体育館|ラケット|シャトル|羽毛球|训练|体育馆|球拍)/.test(text)) return { event_type: "badminton_practice", calendar_type: "child_activity", need_parent_action };
  if (/(ピアノ|楽譜|钢琴|乐谱)/.test(text)) return { event_type: "piano_lesson", calendar_type: "child_activity", need_parent_action };
  if (/(英語|英検|English)/i.test(text)) return { event_type: "english_lesson", calendar_type: "child_activity", need_parent_action };
  if (/(中国語|中文|作文)/.test(text)) return { event_type: "chinese_lesson", calendar_type: "child_activity", need_parent_action };
  if (/(夏休み|夏季休業|冬休み|冬季休業|春休み|春季休業|休校|振替休日)/.test(text)) return { event_type: "school_holiday", calendar_type: "school", is_day_off: true, need_parent_action };
  if (/(定期考査|期末考査|中間考査|実力テスト|模試|試験|テスト)/.test(text)) return { event_type: "exam", calendar_type: "school", need_parent_action };
  if (/(保護者会|三者面談|二者面談|個人面談|家长会|三方面谈|二方面谈|个人面谈|学校面谈)/.test(text)) return { event_type: "school_interview", calendar_type: "school", need_parent_action: true };
  if (/(提出|締切|申込|持参|提交|截止|申请|携带)/.test(text)) return { event_type: "deadline", calendar_type: "school", need_parent_action: true };
  if (/(始業式|終業式|入学式|卒業式|遠足|校外学習|研修|宿泊学習|登校日)/.test(text)) return { event_type: "school_event", calendar_type: "school", need_parent_action };
  if (/(休日|休暇|夏季休暇|年末年始|一斉休暇|有休奨励日)/.test(text)) return { event_type: "company_holiday", calendar_type: "company", is_day_off: true, need_parent_action: false };
  if (/(出勤日|稼働日|勤務日|振替出勤|調整出勤日)/.test(text)) return { event_type: "company_workday", calendar_type: "company", is_day_off: false, need_parent_action: false };
  if (/(在宅勤務|リモート)/.test(text)) return { event_type: "remote_work", calendar_type: "company", need_parent_action: false };
  if (/(出張|移動)/.test(text)) return { event_type: "business_trip", calendar_type: "company", need_parent_action: false };
  if (/(会議|打合せ|面談)/.test(text)) return { event_type: "company_meeting", calendar_type: "company", need_parent_action: false };
  return { event_type: "other", calendar_type: "family", need_parent_action };
}

"use client";

import type { ChildTask } from "@/types/activities";
import type { BusTimetable } from "@/types/busTimetable";
import type { FamilyEvent, EventDraft } from "@/types/events";
import type { ImportCandidate, ImportRecord, BusTimetableCandidate } from "@/types/imports";
import type { UserRole } from "@/types/permissions";
import type { RoutePath } from "@/types/routes";
import { parseImportText } from "./importParser";
import { zhText } from "./displayText";

export type FamilyUser = {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  avatar?: string;
  color: string;
  timezone: string;
  preferred_language: string;
  notification_enabled: boolean;
};

export type AppState = {
  currentUser: FamilyUser | null;
  users: FamilyUser[];
  events: FamilyEvent[];
  routes: RoutePath[];
  busTimetables: BusTimetable[];
  imports: ImportRecord[];
  importCandidates: ImportCandidate[];
  busCandidates: BusTimetableCandidate[];
  tasks: ChildTask[];
};

const today = new Date();
const isoDate = (offset = 0) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const isoAt = (date: string, time: string) => `${date}T${time}:00+09:00`;

const dadCompanyDaysOff = [
  "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-10", "2026-01-11", "2026-01-12", "2026-01-17", "2026-01-18", "2026-01-24", "2026-01-25", "2026-01-31",
  "2026-02-01", "2026-02-07", "2026-02-08", "2026-02-11", "2026-02-14", "2026-02-15", "2026-02-21", "2026-02-22", "2026-02-23", "2026-02-28",
  "2026-03-01", "2026-03-07", "2026-03-08", "2026-03-14", "2026-03-15", "2026-03-20", "2026-03-21", "2026-03-22", "2026-03-28", "2026-03-29",
  "2026-04-04", "2026-04-05", "2026-04-11", "2026-04-12", "2026-04-18", "2026-04-19", "2026-04-25", "2026-04-26", "2026-04-29",
  "2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-09", "2026-05-10", "2026-05-16", "2026-05-17", "2026-05-23", "2026-05-24", "2026-05-30", "2026-05-31",
  "2026-06-06", "2026-06-07", "2026-06-13", "2026-06-14", "2026-06-20", "2026-06-21", "2026-06-27", "2026-06-28",
  "2026-07-04", "2026-07-05", "2026-07-11", "2026-07-12", "2026-07-18", "2026-07-19", "2026-07-20", "2026-07-25", "2026-07-26",
  "2026-08-01", "2026-08-02", "2026-08-08", "2026-08-09", "2026-08-11", "2026-08-14", "2026-08-15", "2026-08-16", "2026-08-22", "2026-08-23", "2026-08-29", "2026-08-30",
  "2026-09-05", "2026-09-06", "2026-09-12", "2026-09-13", "2026-09-19", "2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23", "2026-09-26", "2026-09-27",
  "2026-10-03", "2026-10-04", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-17", "2026-10-18", "2026-10-24", "2026-10-25", "2026-10-31",
  "2026-11-01", "2026-11-03", "2026-11-07", "2026-11-08", "2026-11-14", "2026-11-15", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-28", "2026-11-29",
  "2026-12-05", "2026-12-06", "2026-12-12", "2026-12-13", "2026-12-19", "2026-12-20", "2026-12-26", "2026-12-27", "2026-12-29", "2026-12-30", "2026-12-31",
  "2027-01-01", "2027-01-02", "2027-01-03", "2027-01-04", "2027-01-09", "2027-01-10", "2027-01-11", "2027-01-16", "2027-01-17", "2027-01-23", "2027-01-24", "2027-01-30", "2027-01-31",
  "2027-02-06", "2027-02-07", "2027-02-11", "2027-02-13", "2027-02-14", "2027-02-20", "2027-02-21", "2027-02-23", "2027-02-27", "2027-02-28",
  "2027-03-06", "2027-03-07", "2027-03-13", "2027-03-14", "2027-03-20", "2027-03-21", "2027-03-22", "2027-03-27", "2027-03-28"
];

const dadPaidLeaveEncouragedDays = ["2026-05-29", "2026-06-19", "2026-07-22", "2026-08-17", "2026-08-18", "2026-08-19", "2026-11-02", "2026-11-13", "2026-12-11", "2026-12-28", "2027-02-12", "2027-02-22"];
const dadShortVacationRecommendedDays = ["2026-04-30", "2026-07-21", "2026-08-10", "2026-08-12", "2026-08-13"];

function createDadCompanyCalendarEvents(): FamilyEvent[] {
  const events: FamilyEvent[] = dadCompanyDaysOff.map((date) => ({
    id: `dad-company-off-${date}`,
    title: "パパ会社休日",
    event_type: "company_holiday",
    calendar_type: "company",
    date,
    all_day: true,
    location: "三菱重工業 日立工場",
    visibility: "parents_only",
    is_day_off: true,
    need_parent_action: false,
    created_by: "dad"
  }));

  dadPaidLeaveEncouragedDays.forEach((date) => {
    events.push({
      id: `dad-company-paid-leave-${date}`,
      title: "パパ会社 有休取得奨励日",
      event_type: "company_holiday",
      calendar_type: "company",
      date,
      all_day: true,
      location: "三菱重工業 日立工場",
      visibility: "parents_only",
      is_day_off: false,
      need_parent_action: false,
      created_by: "dad"
    });
  });

  dadShortVacationRecommendedDays.forEach((date) => {
    events.push({
      id: `dad-company-short-vacation-${date}`,
      title: "パパ会社 ショートバケーション推奨日",
      event_type: "company_holiday",
      calendar_type: "company",
      date,
      all_day: true,
      location: "三菱重工業 日立工場",
      visibility: "parents_only",
      is_day_off: false,
      need_parent_action: false,
      created_by: "dad"
    });
  });

  return events;
}

const schoolYearEvents: Array<{
  date: string;
  title: string;
  event_type: FamilyEvent["event_type"];
  is_day_off?: boolean;
  need_parent_action?: boolean;
  parent_task?: string;
}> = [
  { date: "2026-04-07", title: "始業式・1年宿泊日", event_type: "school_event" },
  { date: "2026-04-08", title: "入学式", event_type: "school_event", need_parent_action: true },
  { date: "2026-04-14", title: "テストA", event_type: "exam" },
  { date: "2026-04-17", title: "教育実習開始", event_type: "school_event" },
  { date: "2026-04-20", title: "生徒総会", event_type: "school_event" },
  { date: "2026-04-23", title: "保護者会", event_type: "school_interview", need_parent_action: true, parent_task: "出席確認" },
  { date: "2026-04-30", title: "地区保護者会", event_type: "school_interview", need_parent_action: true, parent_task: "出席確認" },
  { date: "2026-05-01", title: "創立記念日", event_type: "school_holiday", is_day_off: true },
  { date: "2026-05-06", title: "振替休日", event_type: "school_holiday", is_day_off: true },
  { date: "2026-05-07", title: "生徒総会", event_type: "school_event" },
  { date: "2026-05-14", title: "テストA", event_type: "exam" },
  { date: "2026-05-23", title: "中国語学習会", event_type: "school_event" },
  { date: "2026-05-30", title: "地区保護者会", event_type: "school_interview", need_parent_action: true, parent_task: "出席確認" },
  { date: "2026-06-02", title: "英語テスト・授業参観", event_type: "exam", need_parent_action: true },
  { date: "2026-06-04", title: "文化祭準備", event_type: "school_event" },
  { date: "2026-06-06", title: "桐創祭", event_type: "school_event", need_parent_action: true },
  { date: "2026-06-08", title: "代休", event_type: "school_holiday", is_day_off: true },
  { date: "2026-06-10", title: "探検会", event_type: "school_event" },
  { date: "2026-06-23", title: "テストB", event_type: "exam" },
  { date: "2026-06-26", title: "家庭学習日", event_type: "school_holiday", is_day_off: true },
  { date: "2026-07-02", title: "英語テスト", event_type: "exam" },
  { date: "2026-07-03", title: "県南中体", event_type: "school_event" },
  { date: "2026-07-07", title: "代休", event_type: "school_holiday", is_day_off: true },
  { date: "2026-07-10", title: "保護者会", event_type: "school_interview", need_parent_action: true, parent_task: "出席確認" },
  { date: "2026-07-14", title: "芸術鑑賞", event_type: "school_event" },
  { date: "2026-07-17", title: "夏休み前 登校日", event_type: "school_event" },
  { date: "2026-07-20", title: "海の日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2026-07-21", title: "夏期講習", event_type: "school_event" },
  { date: "2026-07-23", title: "テストB", event_type: "exam" },
  { date: "2026-07-26", title: "家庭学習日", event_type: "school_holiday", is_day_off: true },
  { date: "2026-07-30", title: "県南中体", event_type: "school_event" },
  { date: "2026-08-19", title: "6年補習", event_type: "school_event" },
  { date: "2026-08-20", title: "6年三者面談", event_type: "school_interview", need_parent_action: true, parent_task: "面談時間確認" },
  { date: "2026-08-24", title: "AM全校集会", event_type: "school_event" },
  { date: "2026-08-25", title: "3年実力試験", event_type: "exam" },
  { date: "2026-08-28", title: "5年卒業生講演会", event_type: "school_event" },
  { date: "2026-09-01", title: "テストC", event_type: "exam" },
  { date: "2026-09-04", title: "1〜5年スポーツ大会", event_type: "school_event" },
  { date: "2026-09-07", title: "家庭学習日", event_type: "school_holiday", is_day_off: true },
  { date: "2026-09-12", title: "授業公開", event_type: "school_event", need_parent_action: true },
  { date: "2026-09-15", title: "生徒会選挙", event_type: "school_event" },
  { date: "2026-09-18", title: "4年保護者会", event_type: "school_interview", need_parent_action: true },
  { date: "2026-09-19", title: "敬老の日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2026-09-21", title: "国民の休日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2026-09-22", title: "秋分の日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2026-09-24", title: "4時間授業日", event_type: "school_event" },
  { date: "2026-09-25", title: "5年個人面談", event_type: "school_interview", need_parent_action: true },
  { date: "2026-09-30", title: "前期終業日", event_type: "school_event" },
  { date: "2026-10-01", title: "秋休み", event_type: "school_holiday", is_day_off: true },
  { date: "2026-10-04", title: "修学旅行", event_type: "school_event", need_parent_action: true, parent_task: "持ち物確認" },
  { date: "2026-10-06", title: "定期試験", event_type: "exam" },
  { date: "2026-10-07", title: "合唱コンクール", event_type: "school_event", need_parent_action: true },
  { date: "2026-10-10", title: "1年保護者会", event_type: "school_interview", need_parent_action: true },
  { date: "2026-10-13", title: "4年ステップアップ研修", event_type: "school_event" },
  { date: "2026-10-17", title: "2年保護者会", event_type: "school_interview", need_parent_action: true },
  { date: "2026-10-18", title: "修学旅行", event_type: "school_event", need_parent_action: true, parent_task: "持ち物確認" },
  { date: "2026-10-21", title: "中県新人", event_type: "school_event" },
  { date: "2026-10-24", title: "面談期間", event_type: "school_interview", need_parent_action: true, parent_task: "面談時間確認" },
  { date: "2026-10-31", title: "中県新人", event_type: "school_event" },
  { date: "2026-11-02", title: "IB最終試験", event_type: "exam" },
  { date: "2026-11-03", title: "文化の日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2026-11-05", title: "生徒総会", event_type: "school_event" },
  { date: "2026-11-07", title: "5年保護者会", event_type: "school_interview", need_parent_action: true },
  { date: "2026-11-12", title: "5年進路説明会", event_type: "school_event", need_parent_action: true },
  { date: "2026-11-17", title: "テストD", event_type: "exam" },
  { date: "2026-11-20", title: "家庭学習日", event_type: "school_holiday", is_day_off: true },
  { date: "2026-11-21", title: "3年研修旅行", event_type: "school_event", need_parent_action: true, parent_task: "持ち物確認" },
  { date: "2026-11-23", title: "中1キャンプ", event_type: "school_event" },
  { date: "2026-11-26", title: "中1代休", event_type: "school_holiday", is_day_off: true },
  { date: "2026-11-30", title: "高集会", event_type: "school_event" },
  { date: "2026-12-04", title: "6年特別授業", event_type: "school_event" },
  { date: "2026-12-08", title: "共通テスト直前指導", event_type: "exam" },
  { date: "2026-12-10", title: "北風祭", event_type: "school_event" },
  { date: "2026-12-18", title: "冬季休業開始", event_type: "school_holiday", is_day_off: true },
  { date: "2026-12-24", title: "中1・中3 AC代表", event_type: "school_event" },
  { date: "2026-12-29", title: "閉寮期間", event_type: "school_holiday", is_day_off: true },
  { date: "2027-01-01", title: "閉寮期間", event_type: "school_holiday", is_day_off: true },
  { date: "2027-01-06", title: "寮生帰寮日", event_type: "school_event" },
  { date: "2027-01-08", title: "共通テスト直前指導", event_type: "exam" },
  { date: "2027-01-11", title: "成人の日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2027-01-15", title: "家庭学習日", event_type: "school_holiday", is_day_off: true },
  { date: "2027-01-17", title: "共通テスト", event_type: "exam" },
  { date: "2027-01-18", title: "6年自己採点", event_type: "exam" },
  { date: "2027-01-22", title: "6年三者面談", event_type: "school_interview", need_parent_action: true, parent_task: "面談時間確認" },
  { date: "2027-01-25", title: "中央会", event_type: "school_event" },
  { date: "2027-01-26", title: "面談ゾーン", event_type: "school_interview", need_parent_action: true, parent_task: "面談時間確認" },
  { date: "2027-02-08", title: "テストE", event_type: "exam" },
  { date: "2027-02-11", title: "建国記念の日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2027-02-15", title: "家庭学習日", event_type: "school_holiday", is_day_off: true },
  { date: "2027-02-18", title: "5年進路保護者会", event_type: "school_interview", need_parent_action: true },
  { date: "2027-02-23", title: "天皇誕生日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2027-02-26", title: "個人面談・進路相談", event_type: "school_interview", need_parent_action: true, parent_task: "面談時間確認" },
  { date: "2027-03-02", title: "個人面談期間", event_type: "school_interview", need_parent_action: true },
  { date: "2027-03-03", title: "4年修学旅行オリエンテーション", event_type: "school_event" },
  { date: "2027-03-05", title: "六送会", event_type: "school_event" },
  { date: "2027-03-06", title: "卒業式", event_type: "school_event", need_parent_action: true },
  { date: "2027-03-07", title: "中県女", event_type: "school_event" },
  { date: "2027-03-10", title: "4時間授業日", event_type: "school_event" },
  { date: "2027-03-18", title: "校技大会", event_type: "school_event" },
  { date: "2027-03-19", title: "修了式", event_type: "school_event" },
  { date: "2027-03-20", title: "春分の日", event_type: "japan_public_holiday", is_day_off: true },
  { date: "2027-03-21", title: "登校休日", event_type: "school_holiday", is_day_off: true }
];

function createSchoolYearCalendarEvents(): FamilyEvent[] {
  return schoolYearEvents.map((event) => ({
    id: `school-year-${event.date}-${event.title.replace(/\s+/g, "-")}`,
    title: event.title,
    event_type: event.event_type,
    calendar_type: event.event_type === "japan_public_holiday" ? "japan_holiday" : "school",
    date: event.date,
    all_day: true,
    location: "学校",
    visibility: "family",
    is_day_off: event.is_day_off,
    need_parent_action: event.need_parent_action ?? false,
    parent_task: event.parent_task,
    created_by: "school-photo"
  }));
}

const badmintonClubEvents: Array<{
  date: string;
  title: string;
  event_type?: FamilyEvent["event_type"];
  start?: string;
  end?: string;
  location?: string;
  need_transport?: boolean;
  pickup_required?: boolean;
}> = [
  { date: "2026-07-01", title: "バドミントン部 練習", start: "17:00", end: "17:45", location: "学校体育館" },
  { date: "2026-07-02", title: "バドミントン部 OFF" },
  { date: "2026-07-03", title: "バドミントン部 練習 2面", location: "学校体育館" },
  { date: "2026-07-04", title: "国体予選（長谷川）・若溪午後", event_type: "badminton_tournament", location: "若溪", need_transport: true },
  { date: "2026-07-05", title: "国体予選（長谷川）・若溪午前", event_type: "badminton_tournament", location: "若溪", need_transport: true },
  { date: "2026-07-06", title: "バドミントン部 練習 2面", location: "学校体育館" },
  { date: "2026-07-07", title: "バドミントン部 練習 4面", location: "学校体育館" },
  { date: "2026-07-08", title: "バドミントン部 練習", start: "17:00", end: "17:45", location: "学校体育館" },
  { date: "2026-07-09", title: "バドミントン部 OFF" },
  { date: "2026-07-10", title: "バドミントン部 練習 2面", location: "学校体育館" },
  { date: "2026-07-11", title: "バドミントン部 若溪午後（県大会出場者）", location: "若溪", need_transport: true },
  { date: "2026-07-12", title: "バドミントン部 若溪午後（コーチ）", location: "若溪", need_transport: true },
  { date: "2026-07-12", title: "雨天時 練習 12:00-15:00", start: "12:00", end: "15:00", location: "若溪" },
  { date: "2026-07-13", title: "バドミントン部 練習 2面", location: "学校体育館" },
  { date: "2026-07-14", title: "バドミントン部 練習 4面", location: "学校体育館" },
  { date: "2026-07-15", title: "バドミントン部 練習", start: "17:00", end: "17:45", location: "学校体育館" },
  { date: "2026-07-16", title: "バドミントン部 OFF" },
  { date: "2026-07-17", title: "バドミントン部 練習 2面", location: "学校体育館" },
  { date: "2026-07-18", title: "バドミントン部 若溪午後", location: "若溪", need_transport: true },
  { date: "2026-07-19", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-07-20", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-07-21", title: "バドミントン部 若溪午後", location: "若溪", need_transport: true },
  { date: "2026-07-22", title: "県総体（アダストリア）", event_type: "badminton_tournament", location: "アダストリア", need_transport: true },
  { date: "2026-07-23", title: "県総体（アダストリア）", event_type: "badminton_tournament", location: "アダストリア", need_transport: true },
  { date: "2026-07-24", title: "バドミントン部 OFF" },
  { date: "2026-07-25", title: "バドミントン部 OFF" },
  { date: "2026-07-26", title: "バドミントン部 1日練習", location: "学校体育館", need_transport: true },
  { date: "2026-07-27", title: "バドミントン部 1日練習", location: "学校体育館", need_transport: true },
  { date: "2026-07-28", title: "バドミントン部 若溪午後", location: "若溪", need_transport: true },
  { date: "2026-07-29", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-07-30", title: "バドミントン部 若溪午後", location: "若溪", need_transport: true },
  { date: "2026-07-31", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-08-01", title: "バドミントン部 若溪午後 4面", location: "若溪", need_transport: true },
  { date: "2026-08-02", title: "スウィングカップ団体（石岡）", event_type: "badminton_tournament", location: "石岡", need_transport: true, pickup_required: true },
  { date: "2026-08-03", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-08-04", title: "バドミントン部 若溪午後", location: "若溪", need_transport: true },
  { date: "2026-08-05", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-08-06", title: "関東大会（アダストリア）", event_type: "badminton_tournament", location: "アダストリア", need_transport: true },
  { date: "2026-08-07", title: "関東大会（アダストリア）", event_type: "badminton_tournament", location: "アダストリア", need_transport: true },
  { date: "2026-08-08", title: "関東大会（アダストリア）", event_type: "badminton_tournament", location: "アダストリア", need_transport: true },
  { date: "2026-08-09", title: "バドミントン部 OFF" },
  { date: "2026-08-10", title: "バドミントン部 OFF" },
  { date: "2026-08-11", title: "バドミントン部 OFF" },
  { date: "2026-08-12", title: "バドミントン部 OFF" },
  { date: "2026-08-13", title: "バドミントン部 OFF" },
  { date: "2026-08-14", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-08-15", title: "コーチ1養成・若溪午後", location: "若溪", need_transport: true },
  { date: "2026-08-16", title: "コーチ1養成・若溪午後", location: "若溪", need_transport: true },
  { date: "2026-08-17", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-08-18", title: "JOC全日本ジュニア県予選・若溪午後", event_type: "badminton_tournament", location: "若溪", need_transport: true },
  { date: "2026-08-19", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-08-20", title: "全中（米子産業体育館）", event_type: "badminton_tournament", location: "米子産業体育館", need_transport: true },
  { date: "2026-08-20", title: "バドミントン部 若溪午後", location: "若溪", need_transport: true },
  { date: "2026-08-21", title: "全中（米子産業体育館）", event_type: "badminton_tournament", location: "米子産業体育館", need_transport: true },
  { date: "2026-08-21", title: "バドミントン部 若溪午前", location: "若溪", need_transport: true },
  { date: "2026-08-22", title: "全中（米子産業体育館）", event_type: "badminton_tournament", location: "米子産業体育館", need_transport: true },
  { date: "2026-08-22", title: "バドミントン部 若溪午後", location: "若溪", need_transport: true },
  { date: "2026-08-23", title: "全中（米子産業体育館）", event_type: "badminton_tournament", location: "米子産業体育館", need_transport: true },
  { date: "2026-08-23", title: "スウィングカップ個人（たつのこ）", event_type: "badminton_tournament", location: "たつのこ", need_transport: true, pickup_required: true },
  { date: "2026-08-28", title: "バドミントン部 諸活動停止" },
  { date: "2026-08-29", title: "バドミントン部 諸活動停止" },
  { date: "2026-08-30", title: "バドミントン部 諸活動停止" },
  { date: "2026-08-31", title: "バドミントン部 諸活動停止" }
];

function createBadmintonClubCalendarEvents(): FamilyEvent[] {
  return badmintonClubEvents.map((event) => {
    const inferredStart = event.start ?? (event.title.includes("午前") ? "08:45" : event.title.includes("午後") ? "12:45" : event.title.includes("1日") ? "08:45" : undefined);
    const inferredEnd = event.end ?? (event.title.includes("午前") ? "12:45" : event.title.includes("午後") ? "17:00" : event.title.includes("1日") ? "17:00" : undefined);
    return {
      id: `badminton-club-${event.date}-${event.title.replace(/\s+/g, "-")}`,
      title: event.title,
      event_type: event.event_type ?? "badminton_practice",
      calendar_type: "child_activity",
      date: event.date,
      start_datetime: inferredStart ? isoAt(event.date, inferredStart) : undefined,
      end_datetime: inferredEnd ? isoAt(event.date, inferredEnd) : undefined,
      all_day: !inferredStart,
      location: event.location,
      visibility: "family",
      need_parent_action: Boolean(event.need_transport || event.pickup_required),
      parent_task: event.need_transport ? "送迎確認" : undefined,
      need_transport: event.need_transport,
      pickup_required: event.pickup_required,
      created_by: "badminton-photo"
    };
  });
}

const momHandwrittenEvents: Array<{
  date: string;
  title: string;
  event_type: FamilyEvent["event_type"];
  calendar_type: FamilyEvent["calendar_type"];
  start?: string;
  end?: string;
  location?: string;
}> = [
  { date: "2026-07-20", title: "ママ 水戸予定", event_type: "personal_event", calendar_type: "personal", start: "13:00", location: "水戸" },
  { date: "2026-07-22", title: "ママ 東京出張", event_type: "business_trip", calendar_type: "company", location: "東京" },
  { date: "2026-07-23", title: "ママ 上海出張", event_type: "business_trip", calendar_type: "company", location: "上海" },
  { date: "2026-07-24", title: "ママ 上海出張", event_type: "business_trip", calendar_type: "company", location: "上海" },
  { date: "2026-07-25", title: "ママ 上海出張", event_type: "business_trip", calendar_type: "company", location: "上海" },
  { date: "2026-07-25", title: "ママ ピアノ予定", event_type: "personal_event", calendar_type: "personal", start: "14:00", end: "14:30" },
  { date: "2026-08-03", title: "ママ 長崎", event_type: "travel", calendar_type: "personal", location: "長崎" },
  { date: "2026-08-04", title: "ママ 長崎", event_type: "travel", calendar_type: "personal", location: "長崎" },
  { date: "2026-08-05", title: "ママ 長崎", event_type: "travel", calendar_type: "personal", location: "長崎" },
  { date: "2026-08-06", title: "ママ 長崎", event_type: "travel", calendar_type: "personal", location: "長崎" },
  { date: "2026-08-08", title: "ママ IEMUN 東京", event_type: "personal_event", calendar_type: "personal", location: "東京" },
  { date: "2026-08-09", title: "ママ IEMUN 東京", event_type: "personal_event", calendar_type: "personal", location: "東京" }
];

function createMomHandwrittenCalendarEvents(): FamilyEvent[] {
  return momHandwrittenEvents.map((event) => ({
    id: `mom-handwritten-${event.date}-${event.title.replace(/\s+/g, "-")}`,
    title: event.title,
    event_type: event.event_type,
    calendar_type: event.calendar_type,
    date: event.date,
    start_datetime: event.start ? isoAt(event.date, event.start) : undefined,
    end_datetime: event.end ? isoAt(event.date, event.end) : undefined,
    all_day: !event.start,
    location: event.location,
    visibility: "family",
    need_parent_action: false,
    created_by: "mom"
  }));
}

const users: FamilyUser[] = [
  { id: "mom", email: "mom@example.com", display_name: "ママ", role: "admin", avatar: "🌸", color: "#e76f51", timezone: "Asia/Tokyo", preferred_language: "ja", notification_enabled: true },
  { id: "dad", email: "dad@example.com", display_name: "パパ", role: "parent", avatar: "💙", color: "#2a9d8f", timezone: "Asia/Tokyo", preferred_language: "ja", notification_enabled: true },
  { id: "child", email: "child@example.com", display_name: "子ども", role: "child_editor", avatar: "⭐", color: "#76628a", timezone: "Asia/Tokyo", preferred_language: "ja", notification_enabled: true }
];

export const defaultChecklists = {
  badminton: ["ラケット", "シューズ", "ユニフォーム", "靴下", "タオル", "飲み物", "弁当", "補食", "交通費", "集合時間確認", "集合場所確認", "送迎担当確認"],
  piano: ["楽譜", "教材", "筆記用具", "月謝袋", "発表会資料"],
  english: ["教材", "ノート", "宿題", "単語帳", "英検資料"],
  chinese: ["中国語教材", "宿題ノート", "作文", "ノート", "朗読資料"]
};

const initialState: AppState = {
  currentUser: null,
  users,
  events: [
    ...createDadCompanyCalendarEvents(),
    ...createSchoolYearCalendarEvents(),
    ...createBadmintonClubCalendarEvents(),
    ...createMomHandwrittenCalendarEvents(),
    { id: "e1", title: "学校面談", event_type: "school_interview", calendar_type: "school", date: isoDate(0), start_datetime: isoAt(isoDate(0), "15:00"), end_datetime: isoAt(isoDate(0), "15:40"), location: "学校", visibility: "family", need_parent_action: true, transport_owner: "ママ" },
    { id: "e2", title: "バドミントン部 練習", event_type: "badminton_practice", calendar_type: "child_activity", date: isoDate(1), start_datetime: isoAt(isoDate(1), "17:00"), end_datetime: isoAt(isoDate(1), "19:00"), location: "体育館", visibility: "family", need_transport: true, route_id: "r15", pickup_required: true },
    { id: "e3", title: "ピアノレッスン", event_type: "piano_lesson", calendar_type: "child_activity", date: isoDate(2), start_datetime: isoAt(isoDate(2), "16:30"), end_datetime: isoAt(isoDate(2), "17:15"), location: "ピアノ教室", visibility: "family", route_id: "r9", transport_owner: "パパ" },
    { id: "e4", title: "会社朝会", event_type: "company_meeting", calendar_type: "company", date: isoDate(0), start_datetime: isoAt(isoDate(0), "15:00"), end_datetime: isoAt(isoDate(0), "16:00"), visibility: "parents_only" },
    { id: "e5", title: "家族旅行", event_type: "travel", calendar_type: "family", date: isoDate(6), all_day: true, visibility: "family" },
    { id: "e6", title: "中国の祝日（参考）", event_type: "china_public_holiday_reference", calendar_type: "china_reference_holiday", date: isoDate(7), all_day: true, visibility: "family" }
  ],
  routes: [
    { id: "r1", name: "並木大橋 → 茗溪学園", from_label: "並木大橋", to_label: "茗溪学園", transport_mode: "bus", estimated_minutes: 22, buffer_minutes: 8, default_departure_reminder_minutes: 10, active: true },
    { id: "r2", name: "茗溪学園 → 並木大橋", from_label: "茗溪学園", to_label: "並木大橋", transport_mode: "bus", estimated_minutes: 22, buffer_minutes: 8, default_departure_reminder_minutes: 10, active: true },
    { id: "r9", name: "家 → ピアノ教室", from_label: "家", to_label: "ピアノ教室", transport_mode: "car", estimated_minutes: 18, buffer_minutes: 7, default_departure_reminder_minutes: 10, active: true },
    { id: "r15", name: "家 → 体育館", from_label: "家", to_label: "体育館", transport_mode: "bicycle", estimated_minutes: 20, buffer_minutes: 10, default_departure_reminder_minutes: 15, active: true }
  ],
  busTimetables: [
    { id: "b1", route_id: "r1", line_name: "CG 学園南循環線", direction_name: "茗溪学園方面", from_label: "並木大橋", to_label: "茗溪学園", service_day_type: "weekday", departure_time: "08:10", arrival_time: "08:32", estimated_minutes: 22, bus_type: "public_bus", active: true },
    { id: "b2", route_id: "r2", line_name: "スクールバス", direction_name: "TXつくば駅方面", from_label: "茗溪学園", to_label: "TXつくば駅", service_day_type: "school_day", departure_time: "18:25", arrival_time: "18:50", estimated_minutes: 25, bus_type: "school_bus", active: true }
  ],
  imports: [],
  importCandidates: [],
  busCandidates: [],
  tasks: [
    { id: "t1", title: "英語宿題", task_type: "homework", due_date: isoDate(2), status: "todo" },
    { id: "t2", title: "バドミントン 弁当確認", task_type: "bring_item", due_date: isoDate(1), status: "todo" }
  ]
};

const key = "family-schedule-hub-state";
const passwordKey = "family-schedule-hub-login-password";
const defaultPassword = "1234";

function mergeDefaultData(state: AppState): AppState {
  const existingEventIds = new Set(state.events.map((event) => event.id));
  const defaultUserById = new Map(users.map((user) => [user.id, user]));
  const defaultBadmintonEvents = createBadmintonClubCalendarEvents();
  const defaultBadmintonById = new Map(defaultBadmintonEvents.map((event) => [event.id, event]));
  const missingCompanyEvents = createDadCompanyCalendarEvents().filter((event) => !existingEventIds.has(event.id));
  const missingSchoolEvents = createSchoolYearCalendarEvents().filter((event) => !existingEventIds.has(event.id));
  const missingBadmintonEvents = defaultBadmintonEvents.filter((event) => !existingEventIds.has(event.id));
  const missingMomEvents = createMomHandwrittenCalendarEvents().filter((event) => !existingEventIds.has(event.id));
  return {
    ...state,
    users: state.users.map((user) => ({
      ...user,
      avatar: user.avatar ?? defaultUserById.get(user.id)?.avatar
    })),
    events: [...missingCompanyEvents, ...missingSchoolEvents, ...missingBadmintonEvents, ...missingMomEvents, ...state.events].map((event) => ({
      ...event,
      start_datetime: defaultBadmintonById.get(event.id)?.start_datetime ?? event.start_datetime,
      end_datetime: defaultBadmintonById.get(event.id)?.end_datetime ?? event.end_datetime,
      all_day: defaultBadmintonById.has(event.id) ? defaultBadmintonById.get(event.id)?.all_day : event.all_day,
      title: zhText(event.title),
      location: zhText(event.location)
    })),
    routes: state.routes.map((route) => ({
      ...route,
      name: zhText(route.name),
      from_label: zhText(route.from_label),
      to_label: zhText(route.to_label),
      note: zhText(route.note)
    })),
    busTimetables: state.busTimetables.map((item) => ({
      ...item,
      line_name: zhText(item.line_name),
      direction_name: zhText(item.direction_name),
      from_label: zhText(item.from_label),
      to_label: zhText(item.to_label)
    })),
    tasks: state.tasks.map((task) => ({
      ...task,
      title: zhText(task.title),
      note: zhText(task.note)
    }))
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return initialState;
    const state = mergeDefaultData(JSON.parse(stored));
    saveState(state);
    return state;
  } catch {
    window.localStorage.removeItem(key);
    return initialState;
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(state));
}

export function loginAs(role: UserRole) {
  const state = loadState();
  const currentUser = state.users.find((user) => user.role === role) ?? state.users[0];
  const next = { ...state, currentUser };
  saveState(next);
  return next;
}

export function verifyLoginPassword(password: string) {
  if (typeof window === "undefined") return false;
  return password === (window.localStorage.getItem(passwordKey) ?? defaultPassword);
}

export function updateLoginPassword(currentPassword: string, nextPassword: string) {
  if (typeof window === "undefined") return { ok: false, message: "ブラウザで操作してください。" };
  if (!verifyLoginPassword(currentPassword.trim())) return { ok: false, message: "現在のパスワードが違います。初期設定のままなら 1234 を入力してください。" };
  const trimmed = nextPassword.trim();
  if (trimmed.length < 4) return { ok: false, message: "新しいパスワードは4文字以上にしてください。" };
  window.localStorage.setItem(passwordKey, trimmed);
  return { ok: true, message: "パスワードを保存しました。" };
}

export function hasCustomLoginPassword() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(passwordKey));
}

export function logout() {
  const next = { ...loadState(), currentUser: null };
  saveState(next);
}

export function addEvent(draft: EventDraft) {
  const state = loadState();
  const event: FamilyEvent = { ...draft, id: crypto.randomUUID() };
  const next = { ...state, events: [event, ...state.events] };
  saveState(next);
  return next;
}

export function softDeleteEvent(id: string, deletedBy?: string) {
  const state = loadState();
  const next = { ...state, events: state.events.map((event) => (event.id === id ? { ...event, deleted_at: new Date().toISOString(), deleted_by: deletedBy } : event)) };
  saveState(next);
  return next;
}

export function restoreEvent(id: string) {
  const state = loadState();
  const next = { ...state, events: state.events.map((event) => (event.id === id ? { ...event, deleted_at: null } : event)) };
  saveState(next);
  return next;
}

export function addRoute(route: Omit<RoutePath, "id" | "active">) {
  const state = loadState();
  const next = { ...state, routes: [{ ...route, id: crypto.randomUUID(), active: true }, ...state.routes] };
  saveState(next);
  return next;
}

export function addBusTimetable(item: Omit<BusTimetable, "id" | "active">) {
  const state = loadState();
  const next = { ...state, busTimetables: [{ ...item, id: crypto.randomUUID(), active: true }, ...state.busTimetables] };
  saveState(next);
  return next;
}

export function createImportFromText(rawText: string, options?: { sourceType?: string; ocrStatus?: ImportRecord["ocr_status"]; errorMessage?: string }) {
  const state = loadState();
  const importRecord: ImportRecord = {
    id: crypto.randomUUID(),
    source_type: options?.sourceType ?? "pasted_text",
    document_type: "other",
    status: options?.errorMessage ? "failed" : "pending_confirmation",
    ocr_status: options?.ocrStatus ?? "fallback_mock",
    raw_ocr_text: rawText,
    ocr_error_message: options?.errorMessage,
    created_at: new Date().toISOString()
  };
  const parsed = parseImportText(rawText);
  const eventCandidates = parsed.eventCandidates.map((candidate) => ({ ...candidate, id: crypto.randomUUID(), import_id: importRecord.id }));
  const busCandidates = parsed.busCandidates.map((candidate) => ({ ...candidate, id: crypto.randomUUID(), import_id: importRecord.id }));
  const next = {
    ...state,
    imports: [importRecord, ...state.imports],
    importCandidates: [...eventCandidates, ...state.importCandidates],
    busCandidates: [...busCandidates, ...state.busCandidates]
  };
  saveState(next);
  return next;
}

export function updateCandidate(candidateId: string, patch: Partial<ImportCandidate>) {
  const state = loadState();
  const next = {
    ...state,
    importCandidates: state.importCandidates.map((item) => (item.id === candidateId ? { ...item, ...patch } : item))
  };
  saveState(next);
  return next;
}

export function ignoreCandidate(candidateId: string) {
  return updateCandidate(candidateId, { ignored: true });
}

export function confirmCandidate(candidateId: string) {
  const state = loadState();
  const candidate = state.importCandidates.find((item) => item.id === candidateId);
  if (!candidate || !candidate.date || candidate.date_parse_status === "failed") return state;
  const nextEvent: FamilyEvent = {
    id: crypto.randomUUID(),
    title: candidate.title,
    event_type: candidate.event_type,
    calendar_type: candidate.calendar_type,
    date: candidate.date,
    all_day: !candidate.start_time,
    start_datetime: candidate.start_time ? `${candidate.date}T${candidate.start_time}:00+09:00` : undefined,
    end_datetime: candidate.end_time ? `${candidate.date}T${candidate.end_time}:00+09:00` : undefined,
    visibility: "family",
    need_parent_action: candidate.need_parent_action
  };
  const next = {
    ...state,
    events: [nextEvent, ...state.events],
    importCandidates: state.importCandidates.map((item) => (item.id === candidateId ? { ...item, confirmed: true } : item))
  };
  saveState(next);
  return next;
}

export function toggleTask(taskId: string) {
  const state = loadState();
  const next = {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) return task;
      const status: ChildTask["status"] = task.status === "done" ? "todo" : "done";
      return { ...task, status, completed_by_child: status === "done" };
    })
  };
  saveState(next);
  return next;
}

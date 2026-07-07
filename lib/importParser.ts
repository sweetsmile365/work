import { parse_text_to_events_japanese } from "./dateParserJa";
import { parse_bus_timetable_text_japanese } from "./busTimetableParserJa";

export function parseImportText(rawText: string, sourceType = "pasted_text", fiscalYear = new Date().getFullYear()) {
  return {
    eventCandidates: parse_text_to_events_japanese(rawText, sourceType, fiscalYear),
    busCandidates: parse_bus_timetable_text_japanese(rawText)
  };
}

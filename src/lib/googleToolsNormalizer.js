"use client";

/**
 * Normalize google_tools payloads that may arrive as:
 * - an array of tool IDs
 * - a JSON stringified array (e.g., '["google_calendar_create_event"]')
 * - a comma/whitespace separated string with or without quotes
 *   (e.g., '"google_calendar_get_events", "google_calendar_create_event"')
 *
 * Returns a deduplicated array of clean tool IDs.
 */

// Mapping for shorthand tool IDs that n8n might send
const TOOL_ID_ALIASES = {
  // Google Docs shortcuts
  "google_docs_create": "google_docs_create_document",
  "docs_create": "google_docs_create_document",
  "google_docs_read": "google_docs_get_document",
  "docs_read": "google_docs_get_document",
  "google_docs_list": "google_docs_list_documents",
  "docs_list": "google_docs_list_documents",
  "google_docs_append": "google_docs_append_text",
  "google_docs_update": "google_docs_update_text",
  "google_docs_delete": "google_docs_delete_document",
  
  // Google Sheets shortcuts
  "google_sheets_create": "google_sheets_create_spreadsheet",
  "sheets_create": "google_sheets_create_spreadsheet",
  "google_sheets_read": "google_sheets_get_values",
  "sheets_read": "google_sheets_get_values",
  "google_sheets_write": "google_sheets_update_values",
  "sheets_write": "google_sheets_update_values",
  "google_sheets_list": "google_sheets_list_spreadsheets",
  "sheets_list": "google_sheets_list_spreadsheets",
  
  // Google Calendar shortcuts
  "google_calendar_create": "google_calendar_create_event",
  "calendar_create": "google_calendar_create_event",
  "google_calendar_list": "google_calendar_list_events",
  "calendar_list": "google_calendar_list_events",
  "google_calendar_read": "google_calendar_get_event",
  "calendar_read": "google_calendar_get_event",
  
  // Gmail shortcuts
  "gmail_read": "gmail_get_message",
  "gmail_send": "gmail_send_message",
  "gmail_draft": "gmail_create_draft",
  "gmail_list": "gmail_list_messages",
};

export const normalizeGoogleTools = (rawValue) => {
  if (!rawValue) return [];

  // Helper: safely JSON.parse text, returning [] on any failure
  const tryParseArray = (text) => {
    if (typeof text !== "string" || !text.trim()) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  // Begin with direct array handling
  let list = Array.isArray(rawValue) ? rawValue : [];

  // Handle string inputs
  if (!list.length && typeof rawValue === "string") {
    const trimmed = rawValue.trim();

    // 1) JSON array string
    list = tryParseArray(trimmed);

    // 2) JSON array string but missing brackets (wrap with [])
    if (!list.length && !trimmed.startsWith("[")) {
      list = tryParseArray(`[${trimmed}]`);
    }

    // 3) Fallback: split by comma/whitespace
    if (!list.length) {
      list = trimmed
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  // Final cleanup: strip surrounding quotes/backticks and backslashes, trim, dedupe
  const cleaned = list
    .filter((item) => typeof item === "string")
    .map((item) =>
      item
        .trim()
        // remove leading/trailing quotes/backticks (single/double/grave)
        .replace(/^["'`]+/, "")
        .replace(/["'`]+$/, "")
        // remove lingering backslashes used for escaping quotes
        .replace(/^\\+/, "")
        .replace(/\\+$/, "")
    )
    .filter(Boolean)
    .map((item) => {
      const lower = item.toLowerCase();

      // Legacy short prefixes from n8n
      if (lower.startsWith("calendar_") && !lower.startsWith("google_")) {
        return `google_${item.replace(/^calendar_/i, "google_calendar_")}`.replace(
          /^google_google_/,
          "google_"
        );
      }
      if (lower.startsWith("sheets_") && !lower.startsWith("google_")) {
        return `google_${item.replace(/^sheets_/i, "google_sheets_")}`.replace(
          /^google_google_/,
          "google_"
        );
      }
      if (lower.startsWith("docs_") && !lower.startsWith("google_")) {
        return `google_${item.replace(/^docs_/i, "google_docs_")}`.replace(
          /^google_google_/,
          "google_"
        );
      }

      // If already prefixed or gmail_* just return
      return item;
    })
    .map((item) => {
      // Apply shorthand aliases (e.g., google_docs_create → google_docs_create_document)
      return TOOL_ID_ALIASES[item] || TOOL_ID_ALIASES[item.toLowerCase()] || item;
    });

  return Array.from(new Set(cleaned));
};


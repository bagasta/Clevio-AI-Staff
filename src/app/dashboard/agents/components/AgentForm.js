"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import AgentFormTour from "@/components/ui/AgentFormTour";
import mcpTools from "@/data/mcp-tools.json";
import { normalizeGoogleTools } from "@/lib/googleToolsNormalizer";
import {
  Lock,
  Mail,
  Calendar,
  X,
  Check,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Maximize2,
} from "lucide-react";

export const TOOL_OPTIONS = [
  {
    id: "google_calendar_create_event",
    label: "Google Calendar - Create Event",
    description: "Create calendar events in the connected Google Calendar.",
  },
  {
    id: "google_calendar_list_events",
    label: "Google Calendar - List Events",
    description: "List scheduled events from the connected Google Calendar.",
  },
  {
    id: "gmail",
    label: "Gmail (All Actions)",
    description: "Enable all Gmail actions with a single toggle.",
  },
  {
    id: "gmail_get_message",
    label: "Gmail - Get Message",
    description:
      "Read and retrieve a specific email message from the connected Gmail account.",
  },
  {
    id: "gmail_create_draft",
    label: "Gmail - Create Draft",
    description: "Compose an email draft within the connected Gmail account.",
  },
  {
    id: "gmail_send_message",
    label: "Gmail - Send Message",
    description:
      "Send composed email messages through the connected Gmail account.",
  },
  {
    id: "gmail_read_messages",
    label: "Gmail - Read Messages",
    description:
      "Read and retrieve a list of email messages from the connected Gmail account.",
  },
  {
    id: "gmail_list_messages",
    label: "Gmail - List Messages",
    description:
      "List email messages from the connected Gmail account based on specified criteria.",
  },
  {
    id: "google_calendar",
    label: "Google Calendar (All Actions)",
    description: "Enable all Google Calendar actions with a single toggle.",
  },
  {
    id: "google_calendar_get_event",
    label: "Google Calendar - Get Event",
    description:
      "Retrieve a specific event from the connected Google Calendar.",
  },
  {
    id: "google_sheets",
    label: "Google Sheets (All Actions)",
    description: "Enable all Google Sheets actions with a single toggle.",
  },
  {
    id: "google_sheets_get_values",
    label: "Google Sheets - Get Values",
    description: "Read values from a sheet range.",
  },
  {
    id: "google_sheets_update_values",
    label: "Google Sheets - Update Values",
    description: "Write/update values in a sheet range.",
  },
  {
    id: "google_sheets_create_spreadsheet",
    label: "Google Sheets - Create Spreadsheet",
    description: "Create a new spreadsheet in Google Drive.",
  },
  {
    id: "google_sheets_list_spreadsheets",
    label: "Google Sheets - List Spreadsheets",
    description: "List spreadsheets available to the connected account.",
  },
  {
    id: "google_docs",
    label: "Google Docs (All Actions)",
    description: "Enable all Google Docs actions with a single toggle.",
  },
  {
    id: "google_docs_list_documents",
    label: "Google Docs - List Documents",
    description: "List Google Docs files available to the account.",
  },
  {
    id: "google_docs_get_document",
    label: "Google Docs - Get Document",
    description: "Retrieve a specific Google Doc content.",
  },
  {
    id: "google_docs_create_document",
    label: "Google Docs - Create Document",
    description: "Create a new Google Doc file.",
  },
  {
    id: "google_docs_append_text",
    label: "Google Docs - Append Text",
    description: "Append text to an existing Google Doc.",
  },
  {
    id: "google_docs_update_text",
    label: "Google Docs - Update Text",
    description: "Update/replace text inside a Google Doc.",
  },
  {
    id: "google_docs_delete_document",
    label: "Google Docs - Delete Document",
    description: "Delete a Google Doc (drive.file scope).",
  },
];

const TOOL_IDS = TOOL_OPTIONS.map((tool) => tool.id);

const formatMcpLabel = (value) =>
  value
    .split("_")
    .map((segment) =>
      segment.length ? segment[0].toUpperCase() + segment.slice(1) : "",
    )
    .join(" ");

const MCP_TOOL_OPTIONS = Array.isArray(mcpTools)
  ? mcpTools.map((tool) => ({
      id: tool.id,
      label: tool.label || formatMcpLabel(tool.id),
      description: tool.description || "",
    }))
  : [];

const MCP_TOOL_IDS = MCP_TOOL_OPTIONS.map((tool) => tool.id);
const TRIAL_LOCKED_MCP = new Set(MCP_TOOL_IDS);
const PRO_MONTHLY_LOCKED_MCP = new Set(
  ["docx_generate", "deep_research"].filter((id) => MCP_TOOL_IDS.includes(id))
);

const createDefaultToolState = () =>
  TOOL_IDS.reduce((accumulator, id) => {
    accumulator[id] = false;
    return accumulator;
  }, {});

const createDefaultMcpToolState = () =>
  MCP_TOOL_IDS.reduce((accumulator, id) => {
    accumulator[id] = false;
    return accumulator;
  }, {});

const LEGACY_TOOL_ALIASES = {
  gmail: TOOL_IDS.filter(
    (toolId) => toolId.startsWith("gmail_") && toolId !== "gmail"
  ),
  google_calendar: TOOL_IDS.filter(
    (toolId) =>
      toolId.startsWith("google_calendar_") && toolId !== "google_calendar"
  ),
  google_sheets: TOOL_IDS.filter(
    (toolId) => toolId.startsWith("google_sheets") && toolId !== "google_sheets"
  ),
  google_docs: TOOL_IDS.filter(
    (toolId) => toolId.startsWith("google_docs") && toolId !== "google_docs"
  ),
};

const KNOWN_TOOL_IDS = new Set([
  ...TOOL_IDS,
  ...Object.keys(LEGACY_TOOL_ALIASES),
]);

const expandLegacySelections = (set) => {
  Object.entries(LEGACY_TOOL_ALIASES).forEach(([legacyKey, replacements]) => {
    if (set.has(legacyKey)) {
      replacements.forEach((id) => set.add(id));
    }
  });
};

const resolveLegacyKeysForSelection = (selectedTools) => {
  const legacyKeys = [];
  Object.entries(LEGACY_TOOL_ALIASES).forEach(([legacyKey, replacements]) => {
    if (replacements.some((id) => selectedTools.includes(id))) {
      legacyKeys.push(legacyKey);
    }
  });
  return legacyKeys;
};

const GmailToolsPopup = ({ isOpen, onClose, values, onSave }) => {
  if (!isOpen) return null;

  const gmailTools = [
    { id: "gmail_get_message", label: "Read Email", description: "Baca email tertentu dari Gmail", icon: Mail },
    { id: "gmail_create_draft", label: "Create Draft", description: "Buat draf email baru", icon: Mail },
    { id: "gmail_send_message", label: "Send Email", description: "Kirim email melalui Gmail", icon: Mail },
    { id: "gmail_read_messages", label: "Read Multiple Emails", description: "Baca beberapa email sekaligus", icon: Mail },
    { id: "gmail_list_messages", label: "List Emails", description: "Daftar email berdasarkan kriteria", icon: Mail }
  ];

  const handleToggle = (toolId) => {
    const event = { target: { checked: !values.tools[toolId] } };
    onSave(toolId, event);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E0D4BC] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EA4335]/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-[#EA4335]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D2216]">Gmail Tools</h3>
              <p className="text-sm text-[#5D4037]">Pilih aksi Gmail yang diinginkan</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6F1] hover:bg-[#F2E8DA] flex items-center justify-center transition-colors text-[#5D4037]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {gmailTools.map((tool) => {
            const Icon = tool.icon;
            const isEnabled = values.tools[tool.id];
            return (
              <div
                key={tool.id}
                onClick={() => handleToggle(tool.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isEnabled ? 'border-[#EA4335] bg-[#EA4335]/5 ring-1 ring-[#EA4335]/20 shadow-sm' : 'border-[#E0D4BC] bg-white hover:border-[#EA4335]/50 hover:bg-[#EA4335]/5'}`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isEnabled ? 'border-[#EA4335] bg-[#EA4335]' : 'border-[#D0C4A8] bg-white'}`}>
                  {isEnabled && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-[#EA4335]/10' : 'bg-[#FAF6F1]'}`}>
                  <Icon className={`h-5 w-5 ${isEnabled ? 'text-[#EA4335]' : 'text-[#8D7F71]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isEnabled ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>{tool.label}</div>
                  <div className="text-sm text-[#8D7F71]">{tool.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[#D0C4A8] text-sm font-bold text-[#5D4037] hover:bg-[#FAF6F1] transition-colors">
            Batal
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:translate-y-[-1px] text-white text-sm font-bold transition-all shadow-lg hover:shadow-xl">
            Simpan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const CalendarToolsPopup = ({ isOpen, onClose, values, onSave }) => {
  if (!isOpen) return null;

  const calendarTools = [
    { id: "google_calendar_create_event", label: "Create Event", description: "Buat event baru di kalender", icon: Calendar },
    { id: "google_calendar_list_events", label: "List Events", description: "Lihat daftar event terjadwal", icon: Calendar },
    { id: "google_calendar_get_event", label: "Get Event", description: "Ambil detail event spesifik", icon: Calendar }
  ];

  const handleToggle = (toolId) => {
    const event = { target: { checked: !values.tools[toolId] } };
    onSave(toolId, event);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E0D4BC] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4285F4]/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#4285F4]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D2216]">Calendar Tools</h3>
              <p className="text-sm text-[#5D4037]">Pilih aksi Kalender yang diinginkan</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6F1] hover:bg-[#F2E8DA] flex items-center justify-center transition-colors text-[#5D4037]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {calendarTools.map((tool) => {
            const Icon = tool.icon;
            const isEnabled = values.tools[tool.id];
            return (
              <div
                key={tool.id}
                onClick={() => handleToggle(tool.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isEnabled ? 'border-[#4285F4] bg-[#4285F4]/5 ring-1 ring-[#4285F4]/20 shadow-sm' : 'border-[#E0D4BC] bg-white hover:border-[#4285F4]/50 hover:bg-[#4285F4]/5'}`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isEnabled ? 'border-[#4285F4] bg-[#4285F4]' : 'border-[#D0C4A8] bg-white'}`}>
                  {isEnabled && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-[#4285F4]/10' : 'bg-[#FAF6F1]'}`}>
                  <Icon className={`h-5 w-5 ${isEnabled ? 'text-[#4285F4]' : 'text-[#8D7F71]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isEnabled ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>{tool.label}</div>
                  <div className="text-sm text-[#8D7F71]">{tool.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[#D0C4A8] text-sm font-bold text-[#5D4037] hover:bg-[#FAF6F1] transition-colors">
            Batal
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:translate-y-[-1px] text-white text-sm font-bold transition-all shadow-lg hover:shadow-xl">
            Simpan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const SheetsToolsPopup = ({ isOpen, onClose, values, onSave }) => {
  if (!isOpen) return null;
  const sheetsTools = [
    { id: "google_sheets_get_values", label: "Get Values", description: "Baca nilai dari rentang sheet", icon: FileSpreadsheet },
    { id: "google_sheets_update_values", label: "Update Values", description: "Tulis atau update nilai di sheet", icon: FileSpreadsheet },
    { id: "google_sheets_create_spreadsheet", label: "Create Spreadsheet", description: "Buat spreadsheet baru", icon: FileSpreadsheet },
    { id: "google_sheets_list_spreadsheets", label: "List Spreadsheets", description: "Lihat daftar spreadsheet", icon: FileSpreadsheet }
  ];
  const handleToggle = (toolId) => { onSave(toolId, { target: { checked: !values.tools[toolId] } }); };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E0D4BC] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#34A853]/10 flex items-center justify-center"><FileSpreadsheet className="h-5 w-5 text-[#34A853]" /></div>
            <div><h3 className="text-lg font-bold text-[#2D2216]">Sheets Tools</h3><p className="text-sm text-[#5D4037]">Pilih aksi Google Sheets</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6F1] hover:bg-[#F2E8DA] flex items-center justify-center transition-colors text-[#5D4037]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 mb-6">
          {sheetsTools.map((tool) => {
            const Icon = tool.icon; const isEnabled = values.tools[tool.id];
            return (
              <div key={tool.id} onClick={() => handleToggle(tool.id)} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isEnabled ? 'border-[#34A853] bg-[#34A853]/5 ring-1 ring-[#34A853]/20 shadow-sm' : 'border-[#E0D4BC] bg-white hover:border-[#34A853]/50 hover:bg-[#34A853]/5'}`}>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isEnabled ? 'border-[#34A853] bg-[#34A853]' : 'border-[#D0C4A8] bg-white'}`}>{isEnabled && <Check className="h-3 w-3 text-white" strokeWidth={3} />}</div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-[#34A853]/10' : 'bg-[#FAF6F1]'}`}><Icon className={`h-5 w-5 ${isEnabled ? 'text-[#34A853]' : 'text-[#8D7F71]'}`} /></div>
                <div className="flex-1 min-w-0"><div className={`font-medium ${isEnabled ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>{tool.label}</div><div className="text-sm text-[#8D7F71]">{tool.description}</div></div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[#D0C4A8] text-sm font-bold text-[#5D4037] hover:bg-[#FAF6F1] transition-colors">Batal</button>
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:translate-y-[-1px] text-white text-sm font-bold transition-all shadow-lg hover:shadow-xl">Simpan</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DocsToolsPopup = ({ isOpen, onClose, values, onSave }) => {
  if (!isOpen) return null;
  const docsTools = [
    { id: "google_docs_list_documents", label: "List Documents", description: "Lihat daftar dokumen Google Docs", icon: FileText },
    { id: "google_docs_get_document", label: "Get Document", description: "Ambil konten dokumen", icon: FileText },
    { id: "google_docs_create_document", label: "Create Document", description: "Buat dokumen baru", icon: FileText },
    { id: "google_docs_append_text", label: "Append Text", description: "Tambahkan teks ke dokumen", icon: FileText },
    { id: "google_docs_update_text", label: "Update Text", description: "Perbarui teks di dokumen", icon: FileText },
    { id: "google_docs_delete_document", label: "Delete Document", description: "Hapus dokumen (drive.file scope)", icon: FileText }
  ];
  const handleToggle = (toolId) => { onSave(toolId, { target: { checked: !values.tools[toolId] } }); };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E0D4BC] bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4285F4]/10 flex items-center justify-center"><FileText className="h-5 w-5 text-[#4285F4]" /></div>
            <div><h3 className="text-lg font-bold text-[#2D2216]">Docs Tools</h3><p className="text-sm text-[#5D4037]">Pilih aksi Google Docs</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6F1] hover:bg-[#F2E8DA] flex items-center justify-center transition-colors text-[#5D4037]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 mb-6">
          {docsTools.map((tool) => {
            const Icon = tool.icon; const isEnabled = values.tools[tool.id];
            return (
              <div key={tool.id} onClick={() => handleToggle(tool.id)} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isEnabled ? 'border-[#4285F4] bg-[#4285F4]/5 ring-1 ring-[#4285F4]/20 shadow-sm' : 'border-[#E0D4BC] bg-white hover:border-[#4285F4]/50 hover:bg-[#4285F4]/5'}`}>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isEnabled ? 'border-[#4285F4] bg-[#4285F4]' : 'border-[#D0C4A8] bg-white'}`}>{isEnabled && <Check className="h-3 w-3 text-white" strokeWidth={3} />}</div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-[#4285F4]/10' : 'bg-[#FAF6F1]'}`}><Icon className={`h-5 w-5 ${isEnabled ? 'text-[#4285F4]' : 'text-[#8D7F71]'}`} /></div>
                <div className="flex-1 min-w-0"><div className={`font-medium ${isEnabled ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>{tool.label}</div><div className="text-sm text-[#8D7F71]">{tool.description}</div></div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[#D0C4A8] text-sm font-bold text-[#5D4037] hover:bg-[#FAF6F1] transition-colors">Batal</button>
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:translate-y-[-1px] text-white text-sm font-bold transition-all shadow-lg hover:shadow-xl">Simpan</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// System Prompt Expanded Modal
const SystemPromptModal = ({ isOpen, onClose, value, onChange }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl border border-[#E0D4BC] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-lg font-bold text-[#2D2216]">System Prompt Editor</h3><p className="text-sm text-[#5D4037]">Edit your agent's instructions in full detail</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6F1] hover:bg-[#F2E8DA] flex items-center justify-center transition-colors text-[#5D4037]"><X className="h-4 w-4" /></button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          placeholder="Describe your agent's behavior, tone, and constraints..."
          className="w-full rounded-xl border border-[#E0D4BC] bg-white px-4 py-3 text-[#2D2216] placeholder:text-[#8D7F71] focus:outline-none focus:ring-2 focus:ring-[#E68A44]/20 focus:border-[#E68A44] transition-all shadow-sm resize-y font-mono text-sm"
        />
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:translate-y-[-1px] text-white text-sm font-bold transition-all shadow-lg hover:shadow-xl">Done</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DEFAULT_VALUES = {
  name: "",
  tools: createDefaultToolState(),
  mcpTools: createDefaultMcpToolState(),
  systemPrompt: `You are a helpful research aide. Remember the users.
- Use clear, professional language.
- Reference available tools when they can help.
- Ask follow-up questions when needed instead of guessing missing details.`,
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1000,
  memoryType: "buffer",
  reasoningStrategy: "react",
};

function mapInitialValues(input) {
  if (!input) {
    return {
      ...DEFAULT_VALUES,
      tools: createDefaultToolState(),
    };
  }

  const normalizedToolsArray = [
    ...normalizeGoogleTools(input.tools),
    ...normalizeGoogleTools(input.google_tools),
    ...normalizeGoogleTools(input.allowed_tools),
    ...normalizeGoogleTools(input.config?.google_tools),
  ];

  const arraySet = new Set(normalizedToolsArray);
  expandLegacySelections(arraySet);

  const allowedSet = new Set([
    ...normalizeGoogleTools(input.google_tools),
    ...normalizeGoogleTools(input.allowed_tools),
    ...normalizeGoogleTools(input.config?.google_tools),
  ]);
  expandLegacySelections(allowedSet);

  const normalizedToolsObject =
    input.tools &&
    typeof input.tools === "object" &&
    !Array.isArray(input.tools)
      ? input.tools
      : {};

  const objectSet = new Set(
    Object.entries(normalizedToolsObject)
      .filter(([key, value]) => typeof key === "string" && Boolean(value))
      .map(([key]) => key.trim())
  );
  expandLegacySelections(objectSet);

  const toolState = createDefaultToolState();
  TOOL_IDS.forEach((toolId) => {
    const fromArray = arraySet.has(toolId);
    const fromObject = objectSet.has(toolId);
    const fromAllowed = allowedSet.has(toolId);
    toolState[toolId] = fromArray || fromObject || fromAllowed;
  });

  const normalizedMcpObject =
    input.mcpTools && typeof input.mcpTools === "object"
      ? input.mcpTools
      : input.mcp_tools && typeof input.mcp_tools === "object"
      ? input.mcp_tools
      : {};

  const normalizedMcpArraySource = Array.isArray(input.mcp_tools)
    ? input.mcp_tools
    : Array.isArray(input.mcpTools)
    ? input.mcpTools
    : [];

  const normalizedMcpArray = normalizedMcpArraySource
    .filter((item) => typeof item === "string")
    .map((item) => item.trim());

  const mcpState = createDefaultMcpToolState();
  Object.entries(normalizedMcpObject).forEach(([key, value]) => {
    if (value && MCP_TOOL_IDS.includes(key)) {
      mcpState[key] = true;
    }
  });
  normalizedMcpArray.forEach((toolId) => {
    if (MCP_TOOL_IDS.includes(toolId)) {
      mcpState[toolId] = true;
    }
  });

  return {
    name: input.name ?? DEFAULT_VALUES.name,
    tools: toolState,
    mcpTools: mcpState,
    systemPrompt:
      input.systemPrompt ??
      input.system_prompt ??
      input.config?.system_prompt ??
      DEFAULT_VALUES.systemPrompt,
    model:
      input.model ??
      input.config?.model ??
      input.config?.llm_model ??
      DEFAULT_VALUES.model,
    temperature:
      typeof input.temperature === "number"
        ? input.temperature
        : typeof input.config?.temperature === "number"
        ? input.config.temperature
        : DEFAULT_VALUES.temperature,
    maxTokens:
      typeof input.maxTokens === "number"
        ? input.maxTokens
        : typeof input.config?.max_tokens === "number"
        ? input.config.max_tokens
        : DEFAULT_VALUES.maxTokens,
    memoryType:
      input.memoryType ??
      input.config?.memory_type ??
      DEFAULT_VALUES.memoryType,
    reasoningStrategy:
      input.reasoningStrategy ??
      input.config?.reasoning_strategy ??
      DEFAULT_VALUES.reasoningStrategy,
  };
}

export default function AgentForm({
  mode = "create",
  initialValues = null,
  onSubmit,
  isSubmitting = false,
  isTrialPlan = false,
  isProMonthlyPlan = false,
  startGuidedTour = false,
  onGuidedTourClose,
  onGuidedTourStepChange,
  submitButtonLabel = null,
}) {
  const [values, setValues] = useState(() => mapInitialValues(initialValues));
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const lockedToolsRef = useRef([]);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGmailPopup, setShowGmailPopup] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showSheetsPopup, setShowSheetsPopup] = useState(false);
  const [showDocsPopup, setShowDocsPopup] = useState(false);
  const [showSystemPromptModal, setShowSystemPromptModal] = useState(false);
  const router = useRouter();

  const submitLabel = useMemo(() => {
    if (submitButtonLabel) {
      return submitButtonLabel;
    }
    if (mode === "edit") return "Save Changes";
    return "Create Agent";
  }, [mode, submitButtonLabel]);

  const tourSteps = useMemo(
    () => [
      {
        selector: '[data-tour="agent-name"]',
        title: "Name your agent",
        description:
          "We prefilled this from your interview. Adjust it so teammates instantly understand what the agent does.",
        hint: "Short, action-oriented names work best.",
        placement: "bottom-start",
      },
      {
        selector: '[data-tour="agent-tools"]',
        title: "Enable the right capabilities",
        description:
          "Toggle which integrations this agent should control. You can add or remove tools later in the agent settings.",
        hint: "Only grant access to the systems this agent truly needs.",
        placement: "bottom-start",
      },
      {
        selector: '[data-tour="agent-prompt"]',
        title: "Fine-tune the system prompt",
        description:
          "This prompt guides the agent's tone, constraints, and decision-making. Refine the interview summary or write your own instructions.",
        hint: "Include guardrails, preferred voice, and escalation rules.",
        placement: "top-start",
      },
      {
        selector: '[data-tour="agent-actions"]',
        title: "Review and launch",
        description:
          "Once everything looks good, create the agent. You can reset the form or come back to edit it anytime.",
        finishLabel: "OK",
        placement: "top-center",
      },
    ],
    []
  );

  useEffect(() => {
    if (!startGuidedTour) return;

    let cancelled = false;
    let rafId;

    const firstSelector = tourSteps[0]?.selector || null;

    const waitForAnchor = () => {
      const el = firstSelector ? document.querySelector(firstSelector) : null;
      if (!cancelled && el && el.getBoundingClientRect().width > 0) {
        setIsTourOpen(true);
        return;
      }
      rafId = requestAnimationFrame(waitForAnchor);
    };

    rafId = requestAnimationFrame(waitForAnchor);

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [startGuidedTour, tourSteps]);

  useEffect(() => {
    setValues(mapInitialValues(initialValues));
  }, [initialValues]);

  useEffect(() => {
    const allowedList = Array.isArray(initialValues?.allowed_tools)
      ? initialValues.allowed_tools
      : Array.isArray(initialValues?.allowedTools)
      ? initialValues.allowedTools
      : [];
    const sanitized = allowedList
      .filter((tool) => typeof tool === "string")
      .map((tool) => tool.trim());
    lockedToolsRef.current = sanitized.filter(
      (tool) => !KNOWN_TOOL_IDS.has(tool)
    );
  }, [initialValues]);

  const lockedToolIds = useMemo(() => new Set(), []);
  const lockedMcpToolIds = useMemo(() => {
    const locked = new Set();
    if (isTrialPlan) {
      TRIAL_LOCKED_MCP.forEach((id) => locked.add(id));
    } else if (isProMonthlyPlan) {
      PRO_MONTHLY_LOCKED_MCP.forEach((id) => locked.add(id));
    }
    return locked;
  }, [isTrialPlan, isProMonthlyPlan]);

  const handleTourClose = () => {
    setIsTourOpen(false);
    onGuidedTourClose?.();
  };

  const toggleTool = (toolId) => {
    if (lockedToolIds.has(toolId)) {
      setShowUpgradeModal(true);
      return;
    }
    setValues((prev) => ({
      ...prev,
      tools: {
        ...prev.tools,
        [toolId]: !prev.tools[toolId],
      },
    }));
  };

  const toggleMcpTool = (toolId) => {
    if (lockedMcpToolIds.has(toolId)) {
      setShowUpgradeModal(true);
      return;
    }
    setValues((prev) => ({
      ...prev,
      mcpTools: {
        ...prev.mcpTools,
        [toolId]: !prev.mcpTools[toolId],
      },
    }));
  };

  const validate = () => {
    const errors = {};
    if (!values.name.trim()) {
      errors.name = "Agent name is required.";
    }
    if (!values.systemPrompt.trim()) {
      errors.systemPrompt = "System prompt cannot be empty.";
    }
    if (!Object.values(values.tools).some(Boolean)) {
      errors.tools = "Select at least one capability for your agent.";
    }
    return errors;
  };

  const buildPayload = () => {
    const selectedTools = TOOL_IDS.filter((toolId) => values.tools[toolId]);
    const legacySelected = resolveLegacyKeysForSelection(selectedTools);
    const combinedTools = Array.from(
      new Set([...selectedTools, ...legacySelected])
    );

    const googleTools = combinedTools.filter(
      (toolId) =>
        toolId.startsWith("google_") ||
        toolId.startsWith("gmail")
    );

    const selectedMcpTools = MCP_TOOL_IDS.filter(
      (toolId) => values.mcpTools?.[toolId]
    ).filter((toolId) => {
      const lower = toolId.toLowerCase();
      return !lower.includes("google") && !lower.includes("gmail");
    });

    const payload = {
      name: values.name.trim(),
      config: {
        llm_model: values.model,
        temperature: values.temperature,
        max_tokens: values.maxTokens,
        memory_type: values.memoryType || DEFAULT_VALUES.memoryType,
        reasoning_strategy:
          values.reasoningStrategy || DEFAULT_VALUES.reasoningStrategy,
        system_prompt: values.systemPrompt.trim(),
      },
      tools: combinedTools,
      google_tools: Array.from(new Set(googleTools)),
    };

    const mcpServerUrl =
      process.env.NEXT_PUBLIC_MCP_SERVER_URL?.trim() ||
      "http://0.0.0.0:8190/sse";
    payload.mcp_servers = {
      calculator_sse: {
        transport: "sse",
        url: mcpServerUrl,
      },
    };

    payload.mcp_tools = selectedMcpTools;

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    const validationErrors = validate();
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const payload = buildPayload();
      console.log("🚀 Submit agent payload", payload);
      await onSubmit(payload);
    } catch (error) {
      console.error("Agent form submission failed:", error);
      setServerError(
        error?.message ||
          "Something went wrong. Please retry or contact support."
      );
    }
  };

  const hasGmailTools = Object.keys(values.tools).filter(id => id.startsWith('gmail_')).some(id => values.tools[id]);
  const hasCalendarTools = Object.keys(values.tools).filter(id => id.startsWith('google_calendar')).some(id => values.tools[id]);
  const hasSheetsTools = Object.keys(values.tools).filter(id => id.startsWith('google_sheets')).some(id => values.tools[id]);
  const hasDocsTools = Object.keys(values.tools).filter(id => id.startsWith('google_docs')).some(id => values.tools[id]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-[#E0D4BC] p-6 md:p-8"
      >
        <AgentFormTour
          steps={tourSteps}
          isOpen={isTourOpen}
          onClose={handleTourClose}
          onStepChange={onGuidedTourStepChange}
        />
        {serverError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Agent Basics
            </h2>
            <p className="text-sm text-muted mb-6">
              Configure basic information and capabilities for your AI agent.
            </p>
          </div>

          <div data-tour="agent-name" className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Agent Name
            </label>
            <input
              type="text"
              value={values.name}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="e.g. Inbox Concierge"
              className="w-full rounded-xl border border-[#E0D4BC] bg-white px-4 py-3 text-[#2D2216] placeholder:text-[#8D7F71] focus:outline-none focus:ring-2 focus:ring-[#E68A44]/20 focus:border-[#E68A44] transition-all shadow-sm"
            />
            {formErrors.name && (
              <p className="text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          <div data-tour="agent-tools" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Google Workspace Tools
              </label>
              <p className="text-sm text-muted mb-4">
                Choose which Google Workspace services your agent can access and control.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gmail Card */}
              <div
                onClick={() => setShowGmailPopup(true)}
                className={`
                  relative group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                  ${hasGmailTools
                    ? 'border-[#EA4335] bg-white ring-1 ring-[#EA4335]/20'
                    : 'border-[#E0D4BC] bg-white hover:border-[#EA4335]/50'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${hasGmailTools ? 'bg-[#EA4335]/10 scale-110' : 'bg-[#FAF6F1] group-hover:scale-110'}`}>
                    <Mail className={`h-7 w-7 transition-colors ${hasGmailTools ? 'text-[#EA4335]' : 'text-[#8D7F71] group-hover:text-[#EA4335]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm transition-colors ${hasGmailTools ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>Gmail</h3>
                    <p className="text-xs text-[#8D7F71]">Email automation</p>
                  </div>
                </div>
                {hasGmailTools && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#EA4335] rounded-full flex items-center justify-center shadow-sm z-10">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 text-[#EA4335] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Calendar Card */}
              <div
                onClick={() => setShowCalendarPopup(true)}
                className={`
                  relative group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                  ${hasCalendarTools
                    ? 'border-[#4285F4] bg-white ring-1 ring-[#4285F4]/20'
                    : 'border-[#E0D4BC] bg-white hover:border-[#4285F4]/50'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${hasCalendarTools ? 'bg-[#4285F4]/10 scale-110' : 'bg-[#FAF6F1] group-hover:scale-110'}`}>
                    <Calendar className={`h-7 w-7 transition-colors ${hasCalendarTools ? 'text-[#4285F4]' : 'text-[#8D7F71] group-hover:text-[#4285F4]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm transition-colors ${hasCalendarTools ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>Calendar</h3>
                    <p className="text-xs text-[#8D7F71]">Event management</p>
                  </div>
                </div>
                {hasCalendarTools && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#4285F4] rounded-full flex items-center justify-center shadow-sm z-10">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 text-[#4285F4] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Sheets Card */}
              <div
                onClick={() => setShowSheetsPopup(true)}
                className={`
                  relative group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                  ${hasSheetsTools
                    ? 'border-[#34A853] bg-white ring-1 ring-[#34A853]/20'
                    : 'border-[#E0D4BC] bg-white hover:border-[#34A853]/50'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${hasSheetsTools ? 'bg-[#34A853]/10 scale-110' : 'bg-[#FAF6F1] group-hover:scale-110'}`}>
                    <FileSpreadsheet className={`h-7 w-7 transition-colors ${hasSheetsTools ? 'text-[#34A853]' : 'text-[#8D7F71] group-hover:text-[#34A853]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm transition-colors ${hasSheetsTools ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>Sheets</h3>
                    <p className="text-xs text-[#8D7F71]">Spreadsheets</p>
                  </div>
                </div>
                {hasSheetsTools && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#34A853] rounded-full flex items-center justify-center shadow-sm z-10">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 text-[#34A853] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Docs Card */}
              <div
                onClick={() => setShowDocsPopup(true)}
                className={`
                  relative group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                  ${hasDocsTools
                    ? 'border-[#4285F4] bg-white ring-1 ring-[#4285F4]/20'
                    : 'border-[#E0D4BC] bg-white hover:border-[#4285F4]/50'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${hasDocsTools ? 'bg-[#4285F4]/10 scale-110' : 'bg-[#FAF6F1] group-hover:scale-110'}`}>
                    <FileText className={`h-7 w-7 transition-colors ${hasDocsTools ? 'text-[#4285F4]' : 'text-[#8D7F71] group-hover:text-[#4285F4]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm transition-colors ${hasDocsTools ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>Docs</h3>
                    <p className="text-xs text-[#8D7F71]">Documents</p>
                  </div>
                </div>
                {hasDocsTools && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#4285F4] rounded-full flex items-center justify-center shadow-sm z-10">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 text-[#4285F4] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Selected tools summary */}
            <div className="mt-4 p-3 rounded-lg bg-surface/50 border border-surface-strong/30">
              <p className="text-xs text-muted">
                {(() => {
                  const gmailCount = Object.keys(values.tools).filter(id => id.startsWith('gmail_')).filter(id => values.tools[id]).length;
                  const calendarCount = Object.keys(values.tools).filter(id => id.startsWith('google_calendar_')).filter(id => values.tools[id]).length;

                  if (gmailCount === 0 && calendarCount === 0) {
                    return 'Pilih tools untuk mengaktifkan kemampuan agent';
                  }

                  const parts = [];
                  if (gmailCount > 0) parts.push(`${gmailCount} Gmail tools`);
                  if (calendarCount > 0) parts.push(`${calendarCount} Calendar tools`);

                  return `Aktif: ${parts.join(', ')}`;
                })()}
              </p>
            </div>

            {formErrors.tools && (
              <p className="mt-2 text-sm text-red-600">{formErrors.tools}</p>
            )}
          </div>
        </section>

        {MCP_TOOL_OPTIONS.length > 0 && (
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                MCP Tools
              </label>
              <p className="text-sm text-muted mb-4">
                Advanced automation capabilities powered by external integrations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MCP_TOOL_OPTIONS.map((tool) => {
                const isEnabled = values.mcpTools?.[tool.id] || false;
                const isLocked = lockedMcpToolIds.has(tool.id);

                const getIcon = (toolId) => {
                  switch (toolId) {
                    case 'fetch_web_content':
                    case 'web_search':
                      return '🌐';
                    case 'docx_generate':
                      return '📄';
                    case 'deep_research':
                      return '🔬';
                    default:
                      return '⚡';
                  }
                };

                const getGradientColor = (toolId) => {
                  switch (toolId) {
                    case 'fetch_web_content':
                    case 'web_search':
                      return 'from-blue-500 to-indigo-600';
                    case 'docx_generate':
                      return 'from-emerald-500 to-teal-600';
                    case 'deep_research':
                      return 'from-purple-500 to-violet-600';
                    default:
                      return 'from-gray-500 to-gray-600';
                  }
                };

                return (
                  <div
                    key={tool.id}
                    onClick={() => !isLocked && toggleMcpTool(tool.id)}
                    className={`
                      relative group rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                      ${isEnabled
                        ? 'border-[#E68A44] bg-white ring-1 ring-[#E68A44]/20'
                        : isLocked
                        ? 'border-[#E0D4BC] bg-[#FAF6F1] cursor-not-allowed opacity-70'
                        : 'border-[#E0D4BC] bg-white hover:border-[#E68A44]/50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${isEnabled ? 'bg-[#E68A44]/10 scale-110' : isLocked ? 'bg-[#E0D4BC]/20' : 'bg-[#FAF6F1] group-hover:scale-110'}
                      `}>
                        <span className={`text-2xl transition-all ${isLocked ? 'grayscale opacity-50' : 'grayscale-0'}`}>{getIcon(tool.id)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-sm transition-colors ${isEnabled ? 'text-[#2D2216]' : 'text-[#5D4037]'}`}>{tool.label}</h3>
                        <p className="text-xs text-[#8D7F71] line-clamp-2">{tool.description}</p>
                      </div>
                    </div>
                    {isEnabled && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-[#E68A44] rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute top-3 right-3">
                        <Lock className="h-4 w-4 text-[#8D7F71]" />
                      </div>
                    )}
                    {/* No hover indicator for MCP cards */}
                    {isLocked && (
                      <div className="mt-2 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8D7F71] bg-[#2D2216]/5 px-2 py-0.5 rounded-full">
                          <Lock className="h-3 w-3" />
                          Upgrade
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#2D2216] mb-1">System Prompt</h2>
              <p className="text-sm text-[#5D4037]">Define how your agent should behave, its tone, and any constraints.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowSystemPromptModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E0D4BC] bg-white text-sm font-medium text-[#5D4037] hover:bg-[#FAF6F1] hover:border-[#E68A44] transition-all"
            >
              <Maximize2 className="h-4 w-4" />
              Expand
            </button>
          </div>
          <div data-tour="agent-prompt" className="space-y-2">
            <textarea
              value={values.systemPrompt}
              onChange={(event) => setValues((prev) => ({ ...prev, systemPrompt: event.target.value }))}
              rows={6}
              placeholder="Describe your agent's behavior, tone, and constraints..."
              className="w-full rounded-xl border border-[#E0D4BC] bg-white px-4 py-3 text-[#2D2216] placeholder:text-[#8D7F71] focus:outline-none focus:ring-2 focus:ring-[#E68A44]/20 focus:border-[#E68A44] transition-all shadow-sm resize-y"
            />
            {formErrors.systemPrompt && <p className="text-sm text-red-600">{formErrors.systemPrompt}</p>}
          </div>
        </section>

        <div
          className="pt-6 border-t border-surface-strong/30"
          data-tour="agent-actions"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">
              <p>All changes are saved automatically when you create agent.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setServerError("");
                  setFormErrors({});
                  setValues(mapInitialValues(initialValues));
                }}
                className="px-4 py-2 rounded-lg border border-surface-strong/60 text-sm font-medium text-muted hover:bg-surface/70 disabled:opacity-60 transition-colors"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] hover:translate-y-[-1px] text-white text-sm font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Agent...
                  </>
                ) : (
                  submitLabel
                )}
              </button>
            </div>
          </div>
        </div>

        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl border border-surface-strong/60 bg-surface p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-accent">
                <Lock className="h-6 w-6" />
                <p className="text-xs font-semibold uppercase tracking-[0.3em]">
                  Upgrade required
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {isTrialPlan
                  ? "Upgrade to unlock MCP tools"
                  : "Upgrade for premium MCP actions"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {isTrialPlan
                  ? "Trial accounts cannot use MCP tools. Upgrade to a paid plan to automate browsing, document generation, and advanced research flows."
                  : "This tool requires Pro Yearly plan. Upgrade to unlock document generation and deep research capabilities."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 rounded-lg border border-surface-strong/60 px-4 py-2 text-sm font-medium text-muted hover:bg-surface/70"
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push("/payment?plan=PRO_Y&source=mcp-lock");
                  }}
                  className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover shadow-lg"
                >
                  Upgrade plan
                </button>
              </div>
              <p className="mt-4 text-xs text-muted">
                Need help choosing a plan? Contact{" "}
                <a
                  href="mailto:support@clevio.ai"
                  className="text-accent font-semibold"
                >
                  support@clevio.ai
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Gmail Tools Popup */}
        <GmailToolsPopup
          isOpen={showGmailPopup}
          onClose={() => setShowGmailPopup(false)}
          values={values}
          onSave={toggleTool}
        />

        {/* Calendar Tools Popup */}
        <CalendarToolsPopup
          isOpen={showCalendarPopup}
          onClose={() => setShowCalendarPopup(false)}
          values={values}
          onSave={toggleTool}
        />

        {/* Sheets Tools Popup */}
        <SheetsToolsPopup
          isOpen={showSheetsPopup}
          onClose={() => setShowSheetsPopup(false)}
          values={values}
          onSave={toggleTool}
        />

        {/* Docs Tools Popup */}
        <DocsToolsPopup
          isOpen={showDocsPopup}
          onClose={() => setShowDocsPopup(false)}
          values={values}
          onSave={toggleTool}
        />

        {/* System Prompt Expanded Modal */}
        <SystemPromptModal
          isOpen={showSystemPromptModal}
          onClose={() => setShowSystemPromptModal(false)}
          value={values.systemPrompt}
          onChange={(newValue) => setValues((prev) => ({ ...prev, systemPrompt: newValue }))}
        />
      </form>
    </div>
  );
}
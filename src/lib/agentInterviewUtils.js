"use client";

import { TOOL_OPTIONS } from "@/app/dashboard/agents/components/AgentForm";
import { normalizeGoogleTools } from "@/lib/googleToolsNormalizer";
import mcpToolsData from "@/data/mcp-tools.json";

const GMAIL_TOOL_IDS = TOOL_OPTIONS.filter((tool) =>
  tool.id.startsWith("gmail"),
).map((tool) => tool.id);

// Extract MCP tool IDs from the JSON data
const MCP_TOOL_IDS = Array.isArray(mcpToolsData)
  ? mcpToolsData.map((tool) => tool.id)
  : [];

const MCP_TOOL_ID_SET = new Set(MCP_TOOL_IDS);

export const extractAllowedTools = (agentData) => {
  const result = new Set();
  if (!agentData || typeof agentData !== "object") {
    return [];
  }

  const appendTools = (input) => {
    if (!Array.isArray(input)) {
      return;
    }
    input.forEach((tool) => {
      if (typeof tool === "string" && tool.trim()) {
        result.add(tool.trim());
      }
    });
  };

  appendTools(agentData.tools);
  appendTools(agentData.allowed_tools);
  appendTools(agentData.allowedTools);
  appendTools(agentData.mcp_tools);

  const googleTools = normalizeGoogleTools(agentData.google_tools);
  appendTools(googleTools);

  if (result.has("gmail")) {
    GMAIL_TOOL_IDS.forEach((toolId) => result.add(toolId));
  }

  return Array.from(result);
};

/**
 * Extract MCP tools from all possible sources in the agent data.
 * N8n might send MCP tools in: mcp_tools, google_tools, or allowed_tools arrays.
 */
export const extractMcpTools = (agentData) => {
  if (!agentData || typeof agentData !== "object") {
    return [];
  }

  const result = new Set();

  const appendMcpTools = (input) => {
    if (!Array.isArray(input)) {
      return;
    }
    input.forEach((tool) => {
      if (typeof tool === "string" && tool.trim()) {
        const toolId = tool.trim();
        // Only add if it's a known MCP tool
        if (MCP_TOOL_ID_SET.has(toolId)) {
          result.add(toolId);
        }
      }
    });
  };

  // Check mcp_tools (primary source)
  appendMcpTools(agentData.mcp_tools);
  appendMcpTools(agentData.mcpTools);
  
  // Check allowed_tools (might contain MCP tools)
  appendMcpTools(agentData.allowed_tools);
  appendMcpTools(agentData.allowedTools);
  
  // Check google_tools (n8n sometimes puts MCP tools here like web_search, deep_research)
  if (Array.isArray(agentData.google_tools)) {
    appendMcpTools(agentData.google_tools);
  }
  
  // Check tools array
  appendMcpTools(agentData.tools);

  return Array.from(result);
};

export const buildPrefilledFormValues = (agentData) => {
  if (!agentData || typeof agentData !== "object") {
    return null;
  }

  const allowedTools = extractAllowedTools(agentData);
  const mcpToolsList = extractMcpTools(agentData);

  // Build Google Workspace tools state
  const toolSelections = TOOL_OPTIONS.reduce((accumulator, tool) => {
    accumulator[tool.id] = allowedTools.includes(tool.id);
    return accumulator;
  }, {});

  // Build MCP tools state
  const mcpToolSelections = MCP_TOOL_IDS.reduce((accumulator, toolId) => {
    accumulator[toolId] = mcpToolsList.includes(toolId);
    return accumulator;
  }, {});

  // Flexible extraction: support both root-level (n8n format) and nested config
  const systemPrompt =
    agentData.system_prompt ||
    agentData.systemPrompt ||
    agentData.config?.system_prompt ||
    agentData.config?.systemPrompt ||
    "";

  const model =
    agentData.llm_model ||
    agentData.model ||
    agentData.config?.llm_model ||
    agentData.config?.model ||
    "gpt-4o-mini";

  const temperature =
    agentData.temperature ??
    agentData.config?.temperature ??
    agentData.config?.llm_temperature ??
    0.7;

  const maxTokens =
    agentData.max_tokens ??
    agentData.maxTokens ??
    agentData.config?.max_tokens ??
    1000;

  const memoryType =
    agentData.memory_type ||
    agentData.memoryType ||
    agentData.config?.memory_type ||
    "buffer";

  const reasoningStrategy =
    agentData.reasoning_strategy ||
    agentData.reasoningStrategy ||
    agentData.config?.reasoning_strategy ||
    "react";

  // Name fallback: try multiple fields
  const name =
    agentData.name ||
    agentData.agent_name ||
    agentData.agentName ||
    "";

  return {
    name,
    tools: toolSelections,
    mcpTools: mcpToolSelections,
    systemPrompt,
    model,
    temperature,
    maxTokens,
    memoryType,
    reasoningStrategy,
  };
};


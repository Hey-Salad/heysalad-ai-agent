#!/usr/bin/env npx tsx
/**
 * HeySalad MCP Hub
 *
 * A Model Context Protocol server that coordinates work across devices:
 *   - This Mac (Peter's laptop — Claude Code + Cursor)
 *   - Mac Mini (remote — Codex + Claude Code via SSH)
 *   - Raspberry Pi (kiosk demo — Claude Code)
 *
 * Tools provided:
 *   - device_status     — Check which devices are online
 *   - send_task         — Send a task to another device
 *   - get_tasks         — Get pending tasks for this device
 *   - complete_task     — Mark a task as done
 *   - broadcast         — Send a message to all devices
 *   - get_messages      — Get recent messages
 *   - get_project_state — Get shared project state
 *   - set_project_state — Update shared project state
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// State persistence
// ---------------------------------------------------------------------------

const STATE_FILE = join(import.meta.dirname, ".mcp-hub-state.json");

interface Task {
  id: string;
  from: string;
  to: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  result?: string;
  createdAt: string;
  completedAt?: string;
}

interface Message {
  id: string;
  from: string;
  text: string;
  timestamp: string;
}

interface DeviceHeartbeat {
  name: string;
  role: string;
  lastSeen: string;
  ip?: string;
}

interface HubState {
  devices: Record<string, DeviceHeartbeat>;
  tasks: Task[];
  messages: Message[];
  projectState: Record<string, unknown>;
}

function loadState(): HubState {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    } catch {
      // corrupted — start fresh
    }
  }
  return {
    devices: {},
    tasks: [],
    messages: [],
    projectState: {
      repo: "Hey-Salad/heysalad-ai-agent",
      branch: "main",
      focus: "kiosk demo on RPi",
      blockers: [],
    },
  };
}

function saveState(state: HubState) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "heysalad-hub",
  version: "0.1.0",
});

// --- Tool: Register / heartbeat ---
server.tool(
  "device_register",
  "Register this device with the hub and report its status",
  {
    name: z.string().describe("Device name: macbook, macmini, or rpi"),
    role: z.string().describe("Device role: e.g. 'dev-primary', 'build-server', 'kiosk-demo'"),
    ip: z.string().optional().describe("Local IP address"),
  },
  async ({ name, role, ip }) => {
    const state = loadState();
    state.devices[name] = {
      name,
      role,
      lastSeen: new Date().toISOString(),
      ip,
    };
    saveState(state);
    return {
      content: [
        {
          type: "text" as const,
          text: `Device "${name}" registered as ${role}. ${Object.keys(state.devices).length} device(s) in hub.`,
        },
      ],
    };
  }
);

// --- Tool: Device status ---
server.tool(
  "device_status",
  "Check which devices are registered and when they were last seen",
  {},
  async () => {
    const state = loadState();
    const devices = Object.values(state.devices);
    if (devices.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No devices registered yet." }],
      };
    }

    const lines = devices.map((d) => {
      const ago = Math.round((Date.now() - new Date(d.lastSeen).getTime()) / 1000);
      const status = ago < 300 ? "online" : "offline";
      return `${d.name} (${d.role}) — ${status} (last seen ${ago}s ago)${d.ip ? ` [${d.ip}]` : ""}`;
    });

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// --- Tool: Send task ---
server.tool(
  "send_task",
  "Send a task to another device's Claude Code / Codex / Cursor",
  {
    from: z.string().describe("Sender device name"),
    to: z.string().describe("Target device name: macbook, macmini, or rpi"),
    description: z.string().describe("What needs to be done"),
  },
  async ({ from, to, description }) => {
    const state = loadState();
    const task: Task = {
      id: `task-${Date.now()}`,
      from,
      to,
      description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    state.tasks.push(task);
    saveState(state);
    return {
      content: [
        {
          type: "text" as const,
          text: `Task ${task.id} created for ${to}: "${description}"`,
        },
      ],
    };
  }
);

// --- Tool: Get tasks ---
server.tool(
  "get_tasks",
  "Get pending tasks assigned to this device",
  {
    device: z.string().describe("This device's name"),
    status: z.enum(["pending", "in_progress", "completed", "all"]).default("pending"),
  },
  async ({ device, status }) => {
    const state = loadState();
    const tasks = state.tasks.filter(
      (t) => t.to === device && (status === "all" || t.status === status)
    );

    if (tasks.length === 0) {
      return {
        content: [{ type: "text" as const, text: `No ${status} tasks for ${device}.` }],
      };
    }

    const lines = tasks.map(
      (t) => `[${t.id}] (${t.status}) from ${t.from}: ${t.description}`
    );
    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// --- Tool: Complete task ---
server.tool(
  "complete_task",
  "Mark a task as completed with an optional result message",
  {
    taskId: z.string(),
    result: z.string().optional().describe("Summary of what was done"),
  },
  async ({ taskId, result }) => {
    const state = loadState();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) {
      return {
        content: [{ type: "text" as const, text: `Task ${taskId} not found.` }],
      };
    }
    task.status = "completed";
    task.result = result;
    task.completedAt = new Date().toISOString();
    saveState(state);
    return {
      content: [
        {
          type: "text" as const,
          text: `Task ${taskId} completed.${result ? ` Result: ${result}` : ""}`,
        },
      ],
    };
  }
);

// --- Tool: Broadcast message ---
server.tool(
  "broadcast",
  "Send a message visible to all devices",
  {
    from: z.string().describe("Sender device name"),
    text: z.string().describe("Message text"),
  },
  async ({ from, text }) => {
    const state = loadState();
    const msg: Message = {
      id: `msg-${Date.now()}`,
      from,
      text,
      timestamp: new Date().toISOString(),
    };
    state.messages.push(msg);
    // Keep last 100 messages
    if (state.messages.length > 100) {
      state.messages = state.messages.slice(-100);
    }
    saveState(state);
    return {
      content: [
        { type: "text" as const, text: `Message sent from ${from}: "${text}"` },
      ],
    };
  }
);

// --- Tool: Get messages ---
server.tool(
  "get_messages",
  "Get recent broadcast messages from all devices",
  {
    limit: z.number().default(10).describe("Number of recent messages to return"),
  },
  async ({ limit }) => {
    const state = loadState();
    const msgs = state.messages.slice(-limit);
    if (msgs.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No messages yet." }],
      };
    }

    const lines = msgs.map(
      (m) => `[${m.timestamp}] ${m.from}: ${m.text}`
    );
    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// --- Tool: Get project state ---
server.tool(
  "get_project_state",
  "Get the shared project state (repo, branch, current focus, blockers)",
  {},
  async () => {
    const state = loadState();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(state.projectState, null, 2),
        },
      ],
    };
  }
);

// --- Tool: Set project state ---
server.tool(
  "set_project_state",
  "Update the shared project state",
  {
    key: z.string().describe("State key to update"),
    value: z.string().describe("New value (JSON string for objects/arrays)"),
  },
  async ({ key, value }) => {
    const state = loadState();
    try {
      state.projectState[key] = JSON.parse(value);
    } catch {
      state.projectState[key] = value;
    }
    saveState(state);
    return {
      content: [
        { type: "text" as const, text: `Project state updated: ${key} = ${value}` },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Resources: expose state as readable resources
// ---------------------------------------------------------------------------

server.resource(
  "hub-state",
  "heysalad://hub/state",
  async () => {
    const state = loadState();
    return {
      contents: [
        {
          uri: "heysalad://hub/state",
          mimeType: "application/json",
          text: JSON.stringify(state, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HeySalad MCP Hub running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

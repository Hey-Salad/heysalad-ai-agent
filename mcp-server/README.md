# HeySalad MCP Hub

Coordinates Claude Code, Codex, and Cursor across your devices:

| Device | Role | Tools |
|--------|------|-------|
| **MacBook** (this machine) | Primary dev | Claude Code, Cursor |
| **Mac Mini** | Build server | Codex, Claude Code (SSH) |
| **Raspberry Pi** | Kiosk demo | Claude Code |

## Setup

### 1. Install dependencies (once)

```bash
cd mcp-server
npm install
```

### 2. Add to Claude Code on each device

Add this to `~/.claude/settings.json` on each machine:

```json
{
  "mcpServers": {
    "heysalad-hub": {
      "command": "npx",
      "args": ["tsx", "/path/to/heysalad-ai-agent/mcp-server/server.ts"]
    }
  }
}
```

### 3. Register each device

In Claude Code on each machine, the MCP tools will be available. Register:

```
# On MacBook
device_register(name: "macbook", role: "dev-primary")

# On Mac Mini
device_register(name: "macmini", role: "build-server")

# On RPi
device_register(name: "rpi", role: "kiosk-demo")
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `device_register` | Register this device with the hub |
| `device_status` | Check which devices are online |
| `send_task` | Send a task to another device |
| `get_tasks` | Get pending tasks for this device |
| `complete_task` | Mark a task as done |
| `broadcast` | Send a message to all devices |
| `get_messages` | Get recent messages |
| `get_project_state` | Get shared project state |
| `set_project_state` | Update shared project state |

## How It Works

The MCP server uses a local JSON file (`.mcp-hub-state.json`) to store state.
For multi-device sync, you have two options:

1. **Git sync** — State file is in the repo, push/pull to sync
2. **Shared filesystem** — Point all devices to the same state file (NFS, Syncthing, etc.)
3. **Deploy as HTTP** — Upgrade to an HTTP MCP server for real-time sync (future)

## Example Workflow

```
# On MacBook: send task to RPi
send_task(from: "macbook", to: "rpi", description: "Start the kiosk demo in fullscreen on the 7-inch display")

# On RPi: check for tasks
get_tasks(device: "rpi")

# On RPi: complete the task
complete_task(taskId: "task-123", result: "Kiosk running in chromium --kiosk mode at localhost:3000/kiosk")

# On MacBook: broadcast update
broadcast(from: "macbook", text: "Deployed v0.2.1 with Airwallex payments to Vercel")
```

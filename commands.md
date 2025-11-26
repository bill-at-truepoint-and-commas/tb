# TimeBlocker AI Commands v2

## Natural Language Command System

Commands use the format: `verb [scope] [params]`

Example: `expand week`, `carve 10am-12pm deep work`, `pivot`

---

## Core Verbs

### `expand [scope]`
Analyze and suggest actions for a given scope.

**Scopes:** block (default), day, week, quarter, year

**Examples:**
- `expand` → Expand current time block
- `expand day` → Expand full day view
- `expand week` → Expand weekly role view
- `expand quarter` → Expand quarterly goals

**Returns:** Structured actions (getStarted, makeProgress, finish)

---

### `pivot`
Lock current plan (strikethrough), migrate incomplete tasks to next column as Plan B.

**Scope:** day only

**Example:**
- `pivot` → Creates Plan B, moves incomplete tasks to next revision column (🔁1 → 🔁2 → 🔁3)

**Behavior:**
- Current column becomes read-only and grayed
- Incomplete tasks auto-move to next column
- Eventually: blocks will have `includedInPivot: boolean` flag

---

### `shutdown [scope]`
End-of-period review and task migration.

**Scopes:** day (default), week

**Examples:**
- `shutdown` → End of day review, auto-move incomplete tasks to tomorrow
- `shutdown week` → Week review, analyze role completion

**Behavior:**
- Analyzes completion status
- For day: auto-moves incomplete tasks to tomorrow
- For week: summarizes role-day completion

---

### `carve [params]`
Name time block(s). Creates semantic labels for blocks.

**Scope:** block only

**Examples:**
- `carve meeting` → Names current block "meeting"
- `carve 10am-12pm deep work` → Names 2-hour block "deep work"

**Behavior:**
- Adds block name to time cell
- Stores in dataset for future reference
- Multi-hour blocks span multiple rows

---

## Utility Verbs (AI Chaining)

### `get [scope]`
Read state (idempotent).

**Examples:**
- `get block` → Current block state
- `get day` → Full day state
- `get week` → Weekly roles state

---

### `patch [scope] {data}`
Update existing entities.

**Examples:**
- `patch block {task: "new"}` → Update block content

---

### `post [scope] {data}`
Create new entities.

**Examples:**
- `post block {time: "10am", tasks: [...]}` → Create new block

---

### `delete [scope]`
Remove entities.

**Examples:**
- `delete block` → Remove current block

---

## Namespaces

- **block** - Individual time slots (hourly cells)
- **day** - Daily planning (block collection) - DEFAULT
- **week** - Weekly role-based planning (worker/coach/lead)
- **quarter** - Quarterly goals
- **year** - Annual vision

---

## Command Examples

```
expand                    → Analyze current block
expand week               → Analyze week's role focus
pivot                     → Start Plan B for today
shutdown                  → End day, move tasks to tomorrow
shutdown week             → End week review
carve sprint planning     → Name current block
carve 10am-12pm meetings  → Name 2-hour block
get day                   → Query full day state
```

---

## Chaining (AI Browser)

The AI can execute multiple commands in sequence:

```javascript
executeChain([
  'get day',           // Read current state
  'patch block',       // Update current block
  'expand'             // Analyze with updates
])
```

Results from previous commands are available as context for subsequent commands.

---

## Implementation Status

### Core Verbs
- [x] expand (all scopes)
- [x] pivot (day)
- [x] shutdown (day, week)
- [x] carve (block)

### Utility Verbs
- [x] get (all scopes)
- [ ] patch (all scopes)
- [ ] post (all scopes)
- [ ] delete (all scopes)

### Namespaces
- [x] block
- [x] day (default)
- [x] week
- [ ] quarter
- [ ] year

---

## Quick Start for AI Browser

1. Open `index.html` in browser
2. Press Ctrl+K to open command input
3. Type natural language commands:
   - `expand` or `expand week`
   - `pivot` to revise plans
   - `carve deep work` to name blocks
   - `shutdown` at end of day

4. Console access:
   - `executeCommand("expand week")`
   - `executeChain(["get day", "expand"])`
   - `showCommandHelp()` for full reference

---

## File Structure
```
tb/
├── index.html          # Main UI (daily view)
├── src/
│   ├── style.css       # All styles
│   ├── app.js          # Core API (day + block)
│   ├── week.js         # Weekly namespace
│   ├── router.js       # Natural language command parser
│   └── weekly.html     # Weekly view UI
├── commands.md         # This file (AI reference)
├── tb_daily.html       # Legacy (archive)
└── tb_weekly.html      # Legacy (archive)
```

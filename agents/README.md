# Worker notes

Shared decisions stay in `AGENTS.md`. That file grows. Do not delete its log.

Each worker keeps one file here, `agents/<your-name>.md`. Create it on the first push. Do not write in another worker's file.

In your file:

- A status line: what you are building, the commit you started from, and whether it is unfinished.
- The last two sessions in full, short.
- Older sessions as one line: date, what landed, commit.

Read `AGENTS.md` only down to the line `STOP`. Above it: the open numbered set, the set being built, Current history, then History. `STOP` is after History. When a set is concluded, the oldest history set moves under `STOP` and is not deleted. One checked line does not become a history task.

While the feature is unfinished, do not edit the guides outside `AGENTS.md`, `AGENT_STATE.md`, `SELF_HOST_HANDOFF.md`, `LAYER_PBR_PLAN.md`, and your own file. Push code about every 3.5 minutes, in its own commit, separate from note commits.

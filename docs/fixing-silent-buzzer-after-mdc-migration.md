# Fixing the silent buzzer after the Highrise MDC migration

Use this to understand why `RpiModule`'s physical buzzer stopped firing after
the frontend was adapted to pull live seismic data from the Highrise MDC
gateway, and how it was fixed.

## Symptom

- The kiosk display showed live seismic data correctly.
- The physical buzzer (driven by `highrise_idc_server`'s `RpiModule`) never
  fired, even during a real threshold-crossing event.

## Architecture (as of this fix)

- **MDC gateway** (e.g. `192.168.10.200:3000`) is the seismic data source. It
  streams raw accelerometer batches keyed by node name (e.g. `io.emit("usher03",
  data)`), and — critically — **computes the alarm color/level itself** and
  emits it as `${node_name}-light` / `${node_name}-announcement` on its own
  Socket.IO server. No threshold math happens in this app.
- **IDC backend** (`highrise_idc_server`, one per kiosk, e.g.
  `192.168.10.32:3333`) owns the physical buzzer. Its
  `SocketEventController.ts` has `@OnMessage("light")` /
  `@OnMessage("announcement")` handlers that call
  `RpiModule.setGpioLedVal()` — but only when some client emits those events
  *to it*. The backend does not talk to the MDC on its own.
- **Frontend** (`frontend/`, deployed as `new-monitor/`) connects directly to
  the MDC for live display data (`frontend/src/hooks/useWebSocket.ts`).

## Root cause

The pre-MDC Angular app (`old-monitor/`) held two socket connections at
once: one to the sensor source (to *listen*), and a second to the local IDC
backend (to *emit* commands). Its `listen()` method relayed the sensor's
`{node}-light` event straight to the backend's `"light"` event:

```js
this._webSockServ.listen(this.listen_node + "-light").subscribe((data) => {
  this._monitorSocket.emit("light", [data, this.listen_node, "monitor"]);
});
```

When the frontend was rewritten in React and adapted to the MDC gateway
(commit `b9bb8cb`, "Adapt frontend for Highrise MDC data source"), the new
`useWebSocket.ts` kept the "listen to MDC for display" half, but the relay to
the local backend was never ported over. The backend's `"light"` handler was
never broken — it simply had nobody calling it anymore.

## What was ruled out along the way

- **The backend doing its own threshold math and talking to the MDC
  directly** was considered, but the MDC already owns that decision (it
  emits the color, not raw thresholds to evaluate) — no threshold logic
  exists or is needed in this app.
- **A direct MDC → backend channel bypassing the frontend entirely** was
  suspected after seeing the MDC broadcast `{ip}: "alive"` / `"connect_error"`
  status for each kiosk backend IP. This turned out to be a red herring —
  most likely an unrelated multi-building status feed (the old app shipped
  `bldglist.json` / `bldgnodestatus.json`, consistent with a status board
  feature). Live testing confirmed the buzzer **only** fires when the
  frontend's relay is connected — with it disconnected, a real physical
  sensor trigger produced no buzzer response at all.

## Fix

`frontend/src/hooks/useWebSocket.ts` now opens a second, write-only
Socket.IO connection to the local IDC backend (`getApiBase()`, resolved the
same way REST calls are, via `config.json` — distinct from
`getSourceApiBase()` which points at the MDC). It listens for
`${nodename}-light` / `${nodename}-announcement` from the MDC connection and
relays them onward:

```ts
socket.on(`${nodename}-light`, (data) => {
  localSocket.emit('light', [data, nodename, 'monitor']);
});
socket.on(`${nodename}-announcement`, (data) => {
  localSocket.emit('announcement', [data, nodename, 'monitor']);
});
```

The payload shape (`[data, nodename, 'monitor']`) matches exactly what the
old Angular app sent, so the backend's existing `@OnMessage("light")` /
`@OnMessage("announcement")` handlers needed **no changes at all**.

This was deliberately kept frontend-only rather than moving the relay (or
any threshold logic) into the backend, since `highrise_idc_server` runs as a
pm2 process on each Pi that wasn't well understood at the time and touching
it carried more risk than the frontend's existing, already-proven deploy
path. The tradeoff: the buzzer only fires while the kiosk's browser tab is
open and connected to both sockets — the same characteristic the original
Angular app always had, not a new weakness.

## Verification performed

Tested live against real hardware before rollout (node `usher03` via MDC
`.200` and backend `.32`):

1. Confirmed `RpiModule`/GPIO still responds correctly to a manually emitted
   `"light"` event sent directly to the backend (buzzer physically fired).
2. Ran the frontend dev server pointed at real `.32`/`.200` and confirmed
   both socket connections came up together in the browser.
3. With the dev server connected, a real physical sensor trigger produced
   `usher03-light: yellow` from the MDC, which the relay forwarded to the
   backend, which fired the buzzer.
4. With the dev server disconnected, the same physical trigger produced no
   buzzer response — confirming the relay is the actual (and only) delivery
   path, not a redundant one.

Rolled out to `.32`, `.22`, then `.12` — see
[deploying-frontend-updates.md](./deploying-frontend-updates.md) for the
transfer process.

## Relevant code

- `frontend/src/hooks/useWebSocket.ts` — the fix
- `frontend/src/api/runtimeConfig.ts` — `getApiBase()` vs `getSourceApiBase()`
- `highrise_idc_server/src/controllers/SocketEventController.ts` — `"light"` / `"announcement"` handlers (unchanged)
- `highrise_idc_server/src/classes/RpiModule.ts` — GPIO buzzer driver (unchanged)
- `old-monitor/main-es2015.js` (~L1425-1511) — the original Angular relay this fix restores (if that reference build still exists locally)

# Deploying a new frontend build to the kiosks

Use this whenever `frontend/` changes and the updated build needs to go out to
the kiosk Pis (`.12`, `.22`, `.32`, ...).

## Overview

- `frontend/` is the React source. `vite build` always outputs to `../monitor`
  (see `frontend/vite.config.ts`'s `outDir` and `base: '/new-monitor/'`).
- The kiosks serve that build from `/var/www/html/new-monitor/` via Apache —
  `kiosk.sh` launches Chromium at `http://localhost/new-monitor/#/home`.
- `config.json` inside the deployed `new-monitor/` folder is **per-device** —
  it holds that specific Pi's own IP/port (e.g. `.32` has
  `{"ip": "192.168.10.32", "port": 3333}`). The build output always contains
  the repo's default value, so it must be restored per device after every
  copy — never deploy the build's `config.json` as-is.

## 1. Build

```bash
cd frontend
npm run build
```

This regenerates `../monitor` in the repo. Locally, mirror that into a
`new-monitor/` folder (matching the deployed path) before transferring:

```bash
rm -rf ../new-monitor
cp -r ../monitor ../new-monitor
```

## 2. Roll out one device at a time

Don't push to all kiosks at once — do one, verify it, then move to the next.
Current devices: `.32` → `.22` → `.12` (adjust order/list as devices change).

For each device:

1. **Transfer** `new-monitor/` to the Pi via WinSCP (or `scp`). Since the
   `pi` user typically can't write directly to `/var/www/html/`, land it in
   a home directory staging folder first, e.g. `/home/pi/new-monitor`.

2. **On the Pi**, back up what's currently live so you can roll back fast:

   ```bash
   sudo cp -r /var/www/html/new-monitor /var/www/html/new-monitor.bak-$(date +%Y%m%d)
   ```

3. **Capture the device's current config** before it gets overwritten:

   ```bash
   cat /var/www/html/new-monitor/config.json
   ```

4. **Copy the new build in** (the trailing `/.` copies contents, not the
   folder itself, to avoid nesting `new-monitor/new-monitor/`):

   ```bash
   sudo cp -r /home/pi/new-monitor/. /var/www/html/new-monitor/
   ```

5. **Restore this device's own `config.json`** using the value from step 3:

   ```bash
   echo '{"ip": "192.168.10.32", "port": 3333}' | sudo tee /var/www/html/new-monitor/config.json
   ```

6. **Restart the kiosk** so Chromium picks up the new `index.html` (hashed
   asset filenames mean the JS/CSS itself won't be stale, but the HTML entry
   point can be cached):

   ```bash
   sudo systemctl restart lightdm
   ```

7. **Verify** on the actual kiosk display: page loads and shows live data,
   connection status looks right, and (if the change could affect it) the
   buzzer still fires on a real or test alarm.

## 3. Rollback

If something's wrong after deploying:

```bash
sudo rm -rf /var/www/html/new-monitor
sudo mv /var/www/html/new-monitor.bak-<date> /var/www/html/new-monitor
sudo systemctl restart lightdm
```

## Relevant files

- `frontend/vite.config.ts` — build output/base path config
- `frontend/public/config.json` — repo default, gets overwritten per-device on deploy
- `frontend/src/api/runtimeConfig.ts` — reads `config.json` at runtime to resolve the backend URL
- `kiosk.sh` — how the kiosk launches Chromium against `/new-monitor/`

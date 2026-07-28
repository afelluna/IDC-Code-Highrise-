# Troubleshooting stale sensor config after cloning an SD card

Use this when the Pi frontend shows the wrong node name or IP after cloning or restoring the SD card image.

## Symptom

- The monitor shows an old node name such as `usher02`.
- The "Server" or connection IP reflects the previous device, not the current Pi.
- The frontend build was transferred correctly, but the display still looks like the old machine.

## Root cause

The frontend does not hardcode the displayed node identity. It reads the current sensor configuration from the backend:

- `GET /getSensorConfig`
- `POST /updateSensorName`

That backend configuration is stored in `config_tbl`. When an SD card is cloned, the database row is often cloned too, so the new Pi can still report the old identity.

## Important rule

`updateSensorName` requires all three fields:

- `node_name`
- `ctrlip`
- `ctrlport`

Even if you only want to change the node name, you still need to send the current `ctrlip` and `ctrlport` in the request body.

## Fix

1. Check the current backend values:

   ```bash
   curl http://127.0.0.1:3333/getSensorConfig
   ```

2. Decide which values should stay and which should change.

   - If the upstream receiver backend is correct, keep `ctrlip` and `ctrlport`.
   - If the node identity is wrong, change `node_name`.

3. Update the backend config using the local Pi backend:

   ```bash
   curl -X POST http://127.0.0.1:3333/updateSensorName \
     -H "Content-Type: application/json" \
     -d '{"node_name":"usher01","ctrlip":"192.168.10.200","ctrlport":3000}'
   ```

4. Verify the update:

   ```bash
   curl http://127.0.0.1:3333/getSensorConfig
   ```

5. Refresh the kiosk browser after the backend returns the expected values.

## Example

If the Pi is supposed to keep pointing at the `.200` receiver backend, but the display should show `usher01`, use:

```bash
curl -X POST http://127.0.0.1:3333/updateSensorName \
  -H "Content-Type: application/json" \
  -d '{"node_name":"usher01","ctrlip":"192.168.10.200","ctrlport":3000}'
```

After that, `GET /getSensorConfig` should return the updated `node_name` while leaving the receiver backend values unchanged.

## Relevant code

- `highrise_idc_server/src/controllers/ConfigController.ts`
- `highrise_idc_server/src/routes/api.ts`
- `frontend/src/hooks/useWebSocket.ts`
- `frontend/src/api/runtimeConfig.ts`


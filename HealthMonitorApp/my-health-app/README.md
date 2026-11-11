# PulseLink — IoT health-monitoring prototype

PulseLink is a React dashboard for demonstrating a future connected pulse-oximetry system **without connecting hardware**. It runs entirely in the browser; the existing MongoDB/Gemini backend is not required for this demo.

## Start the demo

From this directory:

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

Open the Local URL printed by Vite (normally http://127.0.0.1:5173). Install dependencies once while online; subsequent local demonstrations do not need internet, Gemini credentials, or MongoDB. Keep the terminal open while presenting.

Alternatively, double-click `START_DEMO.cmd` in the repository root. It opens the browser and starts the local server. Press Ctrl+C in its terminal to stop it.

## What you can demonstrate

- One simulated reading per second: oxygen saturation, pulse rate, independent mock blood pressure, and signal quality.
- Four scenarios: resting baseline, oxygen drop, recovery, and motion artifact.
- Manual target sliders under **Fine-tune the input**. Values approach the selected targets gradually.
- Pause/resume and reset controls. Reset restores a ready-to-present baseline.
- SpO₂ and pulse charts with a rolling 60-sample window; an illustrative optical pulse waveform.
- Signal-quality-aware visual alerts and a timestamped session activity log.
- Approximate mean arterial pressure and pulse pressure, calculated from **mock BP**, not SpO₂.
- Session history and CSV export. The browser retains up to 1,800 samples in memory (about 30 minutes at one reading/second). Refresh clears the session. History displays the latest 100; export includes all retained samples.
- A five-slide **Present project** mode. Use the navigation buttons or left/right arrows; Escape returns to the dashboard.
- A **System & hardware** page explaining implemented behavior and future architecture.

## A smooth three-minute presentation

1. **0:00–0:30 — Introduce the idea.** Open **Present project**. Say: “PulseLink demonstrates continuous visibility into oxygen saturation and pulse rate. Today a simulator replaces the physical device.”
2. **0:30–1:00 — Explain the flow.** Show the data-flow slide: “A future optical sensor feeds a microcontroller, which transmits timestamped readings over Wi-Fi. This version implements the simulation, interpretation, and dashboard.”
3. **1:00–1:30 — Show the dashboard.** Return to the dashboard, reset the session, point out the four metrics and live trend. Show the pulse chart, then return to SpO₂.
4. **1:30–2:00 — Trigger an alert.** Select **Oxygen drop**. Over approximately 10 seconds the reading crosses 92% and the visual alert appears. The activity log records the transition.
5. **2:00–2:20 — Show recovery and signal handling.** Select **Recovery** and wait approximately 10 seconds. Then select **Motion artifact** and wait around 4 seconds to demonstrate a signal-quality warning. Return to **Resting baseline**.
6. **2:20–2:40 — Show the record.** Open **Session history**, pause to discuss the table, and export the CSV. The file explicitly identifies the data as simulated.
7. **2:40–3:00 — Explain the next step.** Open **System & hardware**. Say: “Next we replace the simulated input with a device adapter and validate the readings. BP requires a separate validated measurement source.”

Tip: use your browser's full-screen mode for projection. The presentation overlay fills the browser viewport. Reset immediately before starting your live demonstration.

## Scientific boundaries

A pulse oximeter estimates oxygen saturation and pulse rate; see the [FDA's pulse oximeter overview](https://www.fda.gov/medical-devices/products-and-medical-procedures/pulse-oximeters). An SpO₂ percentage alone does not determine systolic/diastolic BP, pulse rate, temperature, or a diagnosis.

This prototype does **not** implement an SpO₂-to-BP predictor. BP is an independent simulated channel and is labeled as such in the interface and CSV. The calculations shown are:

- Approximate mean arterial pressure = (systolic + 2 × diastolic) / 3.
- Pulse pressure = systolic − diastolic.

Both calculations inherit their simulated source. The moving optical waveform is illustrative, not measured PPG or ECG. The 95% baseline band, 92% alert threshold, and 60% signal-quality cutoff are configurable demonstration rules, not validated clinical decision rules. No treatment recommendations are generated.

## Code map

- `src/simulation.js`: independent mock channels, gradual transitions, demo status rules, derived BP values, warm-up samples, CSV format.
- `src/App.jsx`: dashboard, SVG charts, scenario controls, history, architecture view, and presentation.
- `src/App.css` / `src/index.css`: responsive interface, local system fonts, and reduced-motion support.
- `tests/simulation.test.mjs`: scenario transitions, threshold boundaries, BP independence, long-run bounds, formulas, and CSV provenance.

## Verification

```powershell
npm test
npm run build
```

The simulator tests include 7,200 sequential readings across all four scenarios. These tests validate prototype behavior, not medical accuracy. Browser rendering and projection layout should also be checked on the machine used for the presentation.

## Future hardware integration

The shared reading object has this shape:

```js
{
  time: 1794400000000, // timestamp in milliseconds
  spo2: 98,
  pulse: 74,
  systolic: 118,     // independent mock channel today
  diastolic: 78,     // independent mock channel today
  quality: 98       // simulated quality indicator today
}
```

Replace the interval's simulator call with a validated device adapter. Keep per-field provenance when combining real optical readings with a separate BP source. A real signal-quality indicator also needs an appropriate algorithm and validation; the demo score is synthetic. Add authenticated device ingestion, transport security, durable storage, stale/disconnected reading handling, and reference-device validation before real monitoring.

The older backend under `../backend` remains a separate medical-document experiment. Its signup, upload, and Gemini processing routes are not used by PulseLink. It does not currently implement secure device ingestion.

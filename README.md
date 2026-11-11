# PulseLink — IoT Health Monitoring Demo

The active prototype is in [`HealthMonitorApp/my-health-app`](HealthMonitorApp/my-health-app).

Double-click **START_DEMO.cmd** to start the local dashboard and open it in your browser. Node.js is required; the first dependency installation needs internet. After setup, the demonstration runs locally without hardware, MongoDB, or Gemini.

Features: simulated SpO₂, pulse, independent mock BP, signal quality, live trends, scenarios, manual controls, session history, CSV export, and presentation slides.

See the [demo guide](HealthMonitorApp/my-health-app/README.md) for a three-minute presentation script, source boundaries, architecture, and checks.

`HealthMonitorApp/backend` is the earlier medical-document backend. `HMA` is an older scaffold. Neither is needed to present this prototype.

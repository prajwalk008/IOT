export const SCENARIOS = {
  normal: { name: 'Resting baseline', description: 'A stable stream at rest.', spo2: 98, pulse: 74, systolic: 118, diastolic: 78, quality: 98 },
  low: { name: 'Oxygen drop', description: 'Demonstrate a low-oxygen alert.', spo2: 90, pulse: 106, systolic: 128, diastolic: 84, quality: 96 },
  recovery: { name: 'Recovery', description: 'Watch readings return toward baseline.', spo2: 98, pulse: 76, systolic: 120, diastolic: 80, quality: 98 },
  motion: { name: 'Motion artifact', description: 'Poor signal suppresses oxygen alerts.', spo2: 93, pulse: 92, systolic: 122, diastolic: 80, quality: 35 },
}
export const INITIAL_INPUT = { spo2: 98, pulse: 74, systolic: 118, diastolic: 78, quality: 98 }
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

// Deterministic simulation, not a physiological prediction model.
// Blood pressure is an independent mock channel; SpO2 never determines it.
export function nextReading(previous, target, tick, time = Date.now()) {
  const move = (key, speed, amplitude, min, max) => {
    const desired = target[key] + Math.sin(tick * 0.63) * amplitude
    return Math.round(clamp(previous[key] + clamp(desired - previous[key], -speed, speed), min, max) * 10) / 10
  }
  return {
    time,
    spo2: move('spo2', 0.7, 0.25, 70, 100),
    pulse: Math.round(move('pulse', 3, 2, 35, 180)),
    systolic: Math.round(move('systolic', 2, 1, 100, 190)),
    diastolic: Math.round(move('diastolic', 1, 0.5, 45, 95)),
    quality: Math.round(move('quality', 12, 1, 0, 100)),
  }
}
export function statusFor(reading) {
  if (reading.quality < 60) return { label: 'Check signal', tone: 'amber', message: 'Signal quality is low. Oxygen alerts are suppressed until the signal recovers.' }
  if (reading.spo2 < 92) return { label: 'Demo alert', tone: 'red', message: 'The simulated oxygen reading crossed the demo alert threshold of 92%.' }
  if (reading.spo2 < 95) return { label: 'Watch trend', tone: 'amber', message: 'The simulated oxygen reading is below the demo baseline band.' }
  return { label: 'Within demo range', tone: 'teal', message: 'The simulated oxygen reading is within the configured demo baseline band.' }
}
export function pressureDetails(reading) {
  return { map: Math.round((reading.systolic + 2 * reading.diastolic) / 3), pulsePressure: reading.systolic - reading.diastolic }
}
export function initialHistory(now = Date.now()) {
  return Array.from({ length: 45 }, (_, index) => nextReading(INITIAL_INPUT, INITIAL_INPUT, index, now - (44 - index) * 1000))
}
export function readingsToCsv(readings) {
  const header = 'timestamp,source,spo2_percent,pulse_bpm,bp_source,systolic_mmhg,diastolic_mmhg,signal_quality_percent'
  return [header, ...readings.map(r => `${new Date(r.time).toISOString()},simulated,${r.spo2},${r.pulse},independent_mock,${r.systolic},${r.diastolic},${r.quality}`)].join('\n')
}

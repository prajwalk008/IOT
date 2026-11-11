import { useCallback, useEffect, useRef, useState } from 'react'
import { INITIAL_INPUT, SCENARIOS, initialHistory, nextReading, pressureDetails, readingsToCsv, statusFor } from './simulation'
import './App.css'

const ICONS = {
  pulse: 'M2 12h4l3-8 5 16 3-8h5',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  history: 'M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v5l3 2',
  device: 'M8 2h8v20H8z M11 18h2 M10 5h4',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  down: 'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',
  play: 'm8 5 11 7-11 7z', pause: 'M8 5v14 M16 5v14',
  reset: 'M3 10a9 9 0 1 1 2 8 M3 3v7h7',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  drop: 'M12 2S4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13Z',
  pressure: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18 M12 12l4-4 M5 12h2 M12 5v2 M17 12h2',
  signal: 'M4 19v-3 M9 19v-7 M14 19V8 M19 19V3', check: 'm5 12 4 4L19 6',
  info: 'M12 16v-4 M12 8h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  close: 'm6 6 12 12 M6 18 18 6', chevron: 'm9 5 7 7-7 7',
  book: 'M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2v16',
  bolt: 'm13 2-9 12h7l-1 8 10-12h-7z',
}
function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name] || ICONS.pulse} /></svg>
}
function Badge({ tone = 'teal', children }) { return <span className={`badge ${tone}`}>{children}</span> }
function Sparkline({ values, color = '#168b7f' }) {
  const min = Math.min(...values) - 1
  const range = Math.max(...values) - min + 1
  return <svg className="sparkline" viewBox="0 0 120 35" aria-hidden="true"><path d={values.map((v, i) => `${i ? 'L' : 'M'}${i * 120 / (values.length - 1)} ${31 - (v - min) / range * 25}`).join(' ')} fill="none" stroke={color} strokeWidth="2" /></svg>
}
function TrendChart({ history, metric }) {
  const config = metric === 'spo2' ? { min: 70, max: 100, color: '#168b7f', unit: '%' } : { min: 30, max: 180, color: '#8b6cdb', unit: ' bpm' }
  const x = i => 50 + i * 760 / Math.max(history.length - 1, 1)
  const y = value => 186 - (value - config.min) / (config.max - config.min) * 160
  const points = history.map((r, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(r[metric])}`).join(' ')
  return <svg className="trend-chart" viewBox="0 0 840 230" role="img" aria-label={`Last ${history.length} simulated ${metric === 'spo2' ? 'oxygen saturation' : 'pulse rate'} samples`}>
    <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={config.color} stopOpacity=".15" /><stop offset="100%" stopColor={config.color} stopOpacity="0" /></linearGradient></defs>
    {[0, 1, 2, 3].map(i => { const v = config.min + (config.max - config.min) / 3 * i; return <g key={i}><line x1="50" x2="810" y1={y(v)} y2={y(v)} stroke="#edf0f1" strokeDasharray="4 5" /><text x="0" y={y(v) + 4} className="chart-label">{Math.round(v)}{config.unit}</text></g> })}
    {metric === 'spo2' && <><line x1="50" x2="810" y1={y(92)} y2={y(92)} stroke="#d9a394" strokeDasharray="5 5" /><text x="63" y={y(92) - 7} className="threshold-label">Demo alert threshold · 92%</text></>}
    <path d={`${points} L 810 190 L 50 190 Z`} fill="url(#trendFill)" /><path d={points} stroke={config.color} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
    <circle cx="810" cy={y(history.at(-1)[metric])} r="5" fill={config.color} stroke="white" strokeWidth="3" />
    <text x="50" y="220" className="chart-label">{new Date(history[0].time).toLocaleTimeString([], { hour12: false })}</text><text x="390" y="220" className="chart-label">1 sample / second</text><text x="810" y="220" textAnchor="end" className="chart-label">{new Date(history.at(-1).time).toLocaleTimeString([], { hour12: false })}</text>
  </svg>
}
function Waveform({ tick, pulse }) {
  // Illustrative optical pulse shape, not ECG or measured PPG.
  const path = Array.from({ length: 220 }, (_, i) => {
    const phase = ((i + tick * 4) / (58 * 74 / pulse)) % 1
    const value = Math.exp(-(((phase - 0.25) / 0.09) ** 2)) * 33 + Math.exp(-(((phase - 0.55) / 0.12) ** 2)) * 10
    return `${i ? 'L' : 'M'} ${i * 3.7} ${54 - value}`
  }).join(' ')
  return <svg viewBox="0 0 810 75" className="waveform" role="img" aria-label="Illustrative optical pulse waveform, not a measured signal"><path d={path} fill="none" stroke="#168b7f" strokeWidth="2" /></svg>
}
const SLIDES = [
  { eyebrow: '01 / THE IDEA', title: 'A small sensor.\nA clearer picture.', text: 'An IoT health-monitoring prototype that brings oxygen saturation, pulse rate, trends, and signal-quality alerts into one dashboard.', points: ['Continuous visibility instead of isolated readings', 'Immediate visual feedback when a demo threshold is crossed', 'A repeatable prototype that runs without hardware'] },
  { eyebrow: '02 / THE DATA FLOW', title: 'From fingertip\nto dashboard.', text: 'Today, a browser simulator stands in for the sensor and microcontroller. The frontend consumes timestamped readings.', points: ['Future: optical sensor → microcontroller → Wi-Fi', 'Future: authenticated ingestion API → stored readings', 'Today: simulator → reading model → dashboard & alerts'] },
  { eyebrow: '03 / LIVE DEMONSTRATION', title: 'See the change.\nFollow the recovery.', text: 'Return to the dashboard and select Oxygen drop. Observe the oxygen trend and the alert, then choose Recovery to bring the signal back toward baseline.', points: ['Resting baseline establishes a stable stream', 'Oxygen drop demonstrates a threshold crossing', 'Motion artifact demonstrates unreliable signal handling'] },
  { eyebrow: '04 / WHAT WE CAN CLAIM', title: 'Useful signals.\nHonest boundaries.', text: 'A pulse oximeter estimates SpO₂ and pulse rate. A single oxygen percentage does not determine blood pressure.', points: ['All values in this prototype are simulated', 'Blood pressure is an independent mock measurement', 'MAP and pulse pressure are calculated from that mock BP'] },
  { eyebrow: '05 / THE NEXT STEP', title: 'Ready for the\nhardware chapter.', text: 'Replace the simulator with a device data adapter, validate readings against reference instruments, and add secure storage before real use.', points: ['Integrate a suitable optical sensor and ESP32', 'Add a separate validated BP measurement source', 'Validate accuracy, signal quality, and alert behavior'] },
]
function Presentation({ onClose }) {
  const [slide, setSlide] = useState(0)
  const dialog = useRef(null)
  useEffect(() => {
    const previousFocus = document.activeElement
    const handler = event => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setSlide(s => Math.min(s + 1, SLIDES.length - 1))
      if (event.key === 'ArrowLeft') setSlide(s => Math.max(s - 1, 0))
      if (event.key === 'Tab') {
        const elements = [...dialog.current.querySelectorAll('button:not(:disabled)')]
        const first = elements[0], last = elements.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; previousFocus?.focus() }
  }, [onClose])
  const content = SLIDES[slide]
  return <div ref={dialog} className="presentation" role="dialog" aria-modal="true" aria-label="Project presentation"><div className="presentation-top"><div className="brand"><span className="brand-mark"><Icon name="pulse" /></span>pulse<span>link</span></div><button className="button ghost" onClick={onClose} autoFocus><Icon name="close" />Back to dashboard</button></div><div className="slide"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.text}</p><div className="slide-points">{content.points.map((point, i) => <div key={point}><span>0{i + 1}</span>{point}</div>)}</div><span className="slide-orbit"><Icon name={slide === 1 ? 'device' : 'pulse'} size={150} /></span></div><div className="presentation-bottom"><span>IoT health monitoring · Academic prototype</span><div className="slide-dots">{SLIDES.map((_, i) => <button key={i} className={slide === i ? 'active' : ''} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} aria-current={slide === i ? 'step' : undefined} />)}</div><div className="button-row"><button className="button" disabled={slide === 0} onClick={() => setSlide(s => s - 1)}>Previous</button><button className="button primary" onClick={() => slide === SLIDES.length - 1 ? onClose() : setSlide(s => s + 1)}>{slide === SLIDES.length - 1 ? 'Start live demo' : 'Next slide'}<Icon name="arrow" /></button></div></div></div>
}
function Pipeline() {
  return <><div className="section-heading"><div><span className="eyebrow">BUILT FOR THE NEXT STEP</span><h2>Inside the system</h2><p>One reading model. A clear path from simulation to connected hardware.</p></div><Badge tone="blue">Prototype architecture</Badge></div><div className="pipeline">{[
    ['device', '01', 'Capture', 'Today: deterministic sensor simulation. Future: an optical sensor and microcontroller.'],
    ['signal', '02', 'Transmit', 'Today: local, one-second updates. Future: Wi-Fi and an authenticated ingestion API.'],
    ['bolt', '03', 'Interpret', 'Check signal quality, evaluate demo thresholds, and calculate trends.'],
    ['grid', '04', 'Visualize', 'Live readings, session history, visual alerts, and downloadable records.'],
  ].map(([icon, n, title, text]) => <div className="panel pipeline-card" key={n}><span className="pipeline-number">{n}</span><span className="metric-icon teal"><Icon name={icon} size={25} /></span><h3>{title}</h3><p>{text}</p></div>)}</div><div className="panel architecture-notes"><h3>What each number means</h3><div><p><strong>SpO₂ & pulse rate</strong><br />Simulated optical-sensor channels. A real pulse oximeter can estimate both; pulse rate is not calculated from the SpO₂ percentage.</p><p><strong>Blood pressure</strong><br />An independent simulated channel. Real BP needs a separate validated source; no SpO₂-to-BP conversion is performed.</p><p><strong>Derived values</strong><br />Approximate MAP = (systolic + 2 × diastolic) / 3. Pulse pressure = systolic − diastolic. Both inherit the simulated source.</p></div><a href="https://www.fda.gov/medical-devices/products-and-medical-procedures/pulse-oximeters" target="_blank" rel="noreferrer">Read about pulse oximetry · FDA ↗</a></div><div className="panel roadmap"><h3>Hardware integration roadmap</h3><p>Optical sensor → ESP32 → Wi-Fi → secure API → reading adapter → this dashboard</p><Badge tone="amber">Hardware and ingestion API are future work</Badge></div></>
}
function MetricCard({ icon, name, tag, value, unit, note, tone, values }) {
  return <section className="panel metric-card"><div className="metric-top"><span className={`metric-icon ${tone}`}><Icon name={icon} size={20} /></span><span className="metric-tag">{tag}</span></div><h2>{name}</h2><div className="metric-value">{value}<span>{unit}</span></div><div className="metric-bottom"><p>{note}</p><Sparkline values={values} color={tone === 'purple' ? '#8b6cdb' : tone === 'blue' ? '#5389cf' : tone === 'red' ? '#d16b59' : '#168b7f'} /></div></section>
}
export default function App() {
  const [view, setView] = useState('overview')
  const [running, setRunning] = useState(true)
  const [scenario, setScenario] = useState('normal')
  const [manual, setManual] = useState(INITIAL_INPUT)
  const [session, setSession] = useState(() => ({ history: initialHistory(), events: [{ id: 0, time: Date.now(), text: 'Demo session started with 45 prefilled simulated samples.', tone: 'teal' }], tick: 0 }))
  const [metric, setMetric] = useState('spo2')
  const [presenting, setPresenting] = useState(false)
  const closePresentation = useCallback(() => setPresenting(false), [])
  const [toast, setToast] = useState('')
  const { history, events, tick } = session
  const current = history.at(-1)
  const status = statusFor(current)
  const derived = pressureDetails(current)
  const target = scenario === 'manual' ? manual : SCENARIOS[scenario]
  const addEvent = (text, tone = 'teal') => setSession(s => ({ ...s, events: [{ id: Date.now(), time: Date.now(), text, tone }, ...s.events].slice(0, 100) }))
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      const now = Date.now()
      setSession(s => {
        const previous = s.history.at(-1)
        const reading = nextReading(previous, target, s.tick, now)
        const nextStatus = statusFor(reading)
        const changed = statusFor(previous).label !== nextStatus.label
        return { tick: s.tick + 1, history: [...s.history, reading].slice(-1800), events: changed ? [{ id: now, time: now, text: nextStatus.message, tone: nextStatus.tone }, ...s.events].slice(0, 100) : s.events }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, target])
  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timeout)
  }, [toast])
  function selectScenario(key) { setScenario(key); addEvent(`Scenario selected: ${SCENARIOS[key]?.name || 'Manual input'}.`, 'blue') }
  function reset() {
    setSession({ history: initialHistory(), tick: 0, events: [{ id: Date.now(), time: Date.now(), text: 'Demo reset. Baseline restored with 45 prefilled samples.', tone: 'teal' }] })
    setScenario('normal'); setManual(INITIAL_INPUT); setRunning(true); setToast('Fresh session ready for your presentation.')
  }
  function exportSession() {
    const url = URL.createObjectURL(new Blob([readingsToCsv(history)], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a'); link.href = url; link.download = `pulselink-simulated-${new Date().toISOString().replaceAll(':', '-')}.csv`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000); setToast('Simulated session exported as CSV.')
  }
  const nav = [['overview', 'grid', 'Live overview'], ['history', 'history', 'Session history'], ['system', 'device', 'System & hardware']]
  const displayed = history.slice(-60)
  return <div className="app-shell">
    <aside className="sidebar"><a href="#" className="brand" onClick={e => { e.preventDefault(); setView('overview') }}><span className="brand-mark"><Icon name="pulse" /></span>pulse<span>link</span></a><div className="workspace-label">HEALTH MONITORING</div><nav aria-label="Main navigation">{nav.map(([id, icon, label]) => <button key={id} className={`nav-item ${view === id ? 'selected' : ''}`} onClick={() => setView(id)} aria-label={label} aria-current={view === id ? 'page' : undefined}><Icon name={icon} />{label}{id === 'overview' && <span className="live-dot" />}</button>)}</nav><div className="sidebar-demo"><div className="small-icon"><Icon name="book" /></div><h3>Made to demonstrate.</h3><p>Walk through the idea, the data flow, and a live simulation.</p><button onClick={() => setPresenting(true)}>Open presentation <Icon name="arrow" size={16} /></button></div><div className="sidebar-footer"><span className="avatar">PK</span><div><strong>Project workspace</strong><span>Academic prototype</span></div><span className="footer-dot" /></div></aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb">Workspace <Icon name="chevron" size={13} /><strong>{nav.find(item => item[0] === view)?.[2]}</strong></div><div className="topbar-right"><Badge tone="amber"><span className="live-dot" />Simulation mode</Badge><span className="topbar-divider" /><span className="avatar small">PK</span></div></header>
    <main><div className="page-heading"><div><div className="eyebrow">A LITTLE SIGNAL. A LOT OF INSIGHT.</div><h1>{view === 'overview' ? 'Your health, in view.' : view === 'history' ? 'Every reading, recorded.' : 'Connected by design.'}</h1><p>{view === 'overview' ? 'Real-time visibility into a simulated health-monitoring session.' : view === 'history' ? 'Explore and export the current browser session. Up to 30 minutes retained.' : 'Explore how the prototype becomes a connected IoT system.'}</p></div><button className="button presentation-button" onClick={() => setPresenting(true)}><Icon name="play" size={16} />Present project</button></div>
    <div className="demo-banner"><span className="banner-icon"><Icon name="info" size={18} /></span><p><strong>A prototype with a purpose.</strong> All readings are simulated. Blood pressure is an independent mock value, not calculated from SpO₂.</p><span className="banner-tag">NO DEVICE REQUIRED</span></div>
    {view === 'system' ? <Pipeline /> : <>
    <div className="patient-bar"><div className="patient-info"><span className="patient-avatar">AS</span><div><strong>Alex Sharma <Badge tone="neutral">Demo patient</Badge></strong><p>Age 24 <span>·</span> Session PL-001 <span>·</span> Synthetic profile</p></div></div><div className="session-controls"><span className={`session-state ${running ? '' : 'paused'}`}><span className="live-dot" />{running ? 'Simulation live' : 'Simulation paused'}</span><button className="button small-button" onClick={() => { setRunning(!running); addEvent(running ? 'Simulation paused.' : 'Simulation resumed.', 'blue') }}><Icon name={running ? 'pause' : 'play'} size={15} />{running ? 'Pause' : 'Resume'}</button><button className="icon-button" title="Reset demo session" aria-label="Reset demo session" onClick={reset}><Icon name="reset" size={18} /></button></div></div>
    {view === 'overview' ? <>
      <div className="metrics-grid">
        <MetricCard icon="drop" name="Oxygen saturation" tag="SIMULATED" value={current.spo2.toFixed(1)} unit="%" note="Demo baseline band: 95–100%" tone={status.tone} values={displayed.map(r => r.spo2)} />
        <MetricCard icon="heart" name="Pulse rate" tag="SIMULATED" value={current.pulse} unit="bpm" note="Independent optical pulse channel" tone="purple" values={displayed.map(r => r.pulse)} />
        <MetricCard icon="pressure" name="Blood pressure" tag="MOCK CHANNEL" value={`${current.systolic}/${current.diastolic}`} unit="mmHg" note="Independent of oxygen saturation" tone="blue" values={displayed.map(r => r.systolic)} />
        <MetricCard icon="signal" name="Signal quality" tag="SIMULATED" value={current.quality} unit="%" note={current.quality < 60 ? 'Poor signal · oxygen alerts suppressed' : 'Stable signal · ready to interpret'} tone={current.quality < 60 ? 'amber' : 'teal'} values={displayed.map(r => r.quality)} />
      </div>
      <div className="dashboard-grid"><div className="chart-column"><section className="panel trend-panel"><div className="panel-heading"><div><h2>Vital trends <span className="live-indicator"><span className="live-dot" />{running ? 'LIVE' : 'PAUSED'}</span></h2><p>A closer look at the last 60 samples</p></div><div className="segmented" aria-label="Chart metric"><button className={metric === 'spo2' ? 'active' : ''} onClick={() => setMetric('spo2')} aria-pressed={metric === 'spo2'}>SpO₂</button><button className={metric === 'pulse' ? 'active' : ''} onClick={() => setMetric('pulse')} aria-pressed={metric === 'pulse'}>Pulse rate</button></div></div><div className="chart-legend"><span className={`legend-dot ${metric === 'pulse' ? 'purple-bg' : ''}`} />{metric === 'spo2' ? 'Oxygen saturation' : 'Pulse rate'}<span className="chart-source">Simulated sensor stream</span></div><TrendChart history={displayed} metric={metric} /><div className="wave-heading"><span>OPTICAL PULSE WAVEFORM</span><span>Illustrative · not a measured PPG</span></div><Waveform tick={tick} pulse={current.pulse} /></section>
      <div className={`status-panel ${status.tone}`} role="status"><span className="status-icon"><Icon name={status.tone === 'teal' ? 'check' : 'info'} /></span><div><strong>{status.label}</strong><p>{status.message}</p></div><Badge tone={status.tone}>Demo rules</Badge></div>
      <section className="panel derived-panel"><div><span className="eyebrow">CALCULATED FROM MOCK BLOOD PRESSURE</span><h3>A little more context</h3><p>These values use the separate simulated BP channel.</p></div><div className="derived-number"><span>Approx. mean arterial pressure</span><strong>{derived.map} <small>mmHg</small></strong></div><div className="derived-number"><span>Pulse pressure</span><strong>{derived.pulsePressure} <small>mmHg</small></strong></div></section></div>
      <div className="controls-column"><section className="panel simulator-panel"><div className="panel-heading"><div><h2><Icon name="device" size={19} /> Sensor simulator</h2><p>Your virtual device, ready to go.</p></div><span className="connected-indicator" /></div><div className="device-preview"><div className="sensor-device"><span className="device-screen"><small>SpO₂ %</small><strong>{Math.round(current.spo2)}</strong><span>♥ {current.pulse} bpm</span></span><span className="device-button" /></div><div><strong>Virtual pulse oximeter</strong><p>PL-SIM-001</p><Badge tone="teal">Browser connected</Badge></div></div><div className="scenario-label"><span>CHOOSE A SCENARIO</span><span>01–04</span></div><div className="scenario-list">{Object.entries(SCENARIOS).map(([key, item], i) => <button key={key} onClick={() => selectScenario(key)} className={`scenario ${scenario === key ? 'active' : ''}`} aria-pressed={scenario === key}><span className="scenario-index">0{i + 1}</span><span><strong>{item.name}</strong><small>{item.description}</small></span><span className="radio-dot" /></button>)}</div><details className="manual-controls"><summary>Fine-tune the input <Icon name="chevron" size={15} /></summary><p>Sliders set targets; live readings move toward them. BP stays independent.</p>{[
        ['spo2', 'SpO₂', 70, 100, '%'], ['pulse', 'Pulse rate', 35, 180, 'bpm'], ['systolic', 'Systolic BP (mock)', 100, 190, 'mmHg'], ['diastolic', 'Diastolic BP (mock)', 45, 95, 'mmHg'], ['quality', 'Signal quality', 0, 100, '%'],
      ].map(([key, label, min, max, unit]) => <label key={key}><span>{label}<strong>{manual[key]} {unit}</strong></span><input type="range" min={min} max={max} value={manual[key]} onChange={e => { setManual(input => ({ ...input, [key]: Number(e.target.value) })); if (scenario !== 'manual') selectScenario('manual') }} /></label>)}</details><div className="simulator-foot"><Icon name="bolt" size={14} />1 Hz sampling <span>·</span> No hardware needed</div></section><section className="session-note"><span className="note-icon"><Icon name="book" size={19} /></span><h3>Your next demo moment</h3><p>Select <strong>Oxygen drop</strong>, watch the trend cross the alert line, then select <strong>Recovery</strong>.</p><button onClick={() => setPresenting(true)}>See the presentation guide <Icon name="arrow" size={15} /></button></section></div></div>
      <section className="panel events-panel"><div className="panel-heading"><div><h2>Session activity</h2><p>The story behind the stream.</p></div><button className="text-button" onClick={() => setView('history')}>View session <Icon name="arrow" size={15} /></button></div><div className="event-list">{events.slice(0, 3).map((event, i) => <div key={`${event.id}-${i}`} className="event-row"><span className={`event-dot ${event.tone}`} /><span>{event.text}</span><time>{new Date(event.time).toLocaleTimeString([], { hour12: false })}</time></div>)}</div></section>
    </> : <><div className="history-summary"><div className="panel"><span>Retained samples</span><strong>{history.length.toLocaleString()}</strong><small>Starts with 45 synthetic warm-up samples</small></div><div className="panel"><span>Average SpO₂</span><strong>{(history.reduce((sum, r) => sum + r.spo2, 0) / history.length).toFixed(1)}<small> %</small></strong><small>Across retained simulated readings</small></div><div className="panel"><span>Session source</span><strong>Simulator</strong><small>Browser memory · cleared on reload</small></div></div><section className="panel history-panel"><div className="panel-heading"><div><h2>Reading history</h2><p>Showing the latest 100 readings. CSV includes all {history.length} retained samples.</p></div><button className="button" onClick={exportSession}><Icon name="down" size={16} />Export CSV</button></div><div className="table-scroll"><table><thead><tr><th>Time</th><th>SpO₂</th><th>Pulse rate</th><th>BP · mock</th><th>Signal</th><th>Demo status</th></tr></thead><tbody>{history.slice(-100).reverse().map((r, i) => <tr key={`${r.time}-${i}`}><td>{new Date(r.time).toLocaleTimeString([], { hour12: false })}</td><td>{r.spo2.toFixed(1)}%</td><td>{r.pulse} bpm</td><td>{r.systolic}/{r.diastolic} mmHg</td><td>{r.quality}%</td><td><Badge tone={statusFor(r).tone}>{statusFor(r).label}</Badge></td></tr>)}</tbody></table></div></section></>}
    </>}
    <footer className="page-footer"><span><span className="footer-brand">pulselink</span> Designed for a more connected tomorrow.</span><span>Academic demonstration · Simulated data · Not for clinical use</span><button className="text-button" onClick={exportSession}><Icon name="down" size={14} />Export session</button></footer>
    </main></div>{presenting && <Presentation onClose={closePresentation} />}{toast && <div className="toast" role="status"><Icon name="check" size={18} />{toast}</div>}
  </div>
}

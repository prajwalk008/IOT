import test from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_INPUT, SCENARIOS, initialHistory, nextReading, pressureDetails, readingsToCsv, statusFor } from '../src/simulation.js'

test('oxygen drop triggers an alert, and recovery clears it', () => {
  let reading = INITIAL_INPUT
  for (let tick = 0; tick < 20; tick++) reading = nextReading(reading, SCENARIOS.low, tick, tick * 1000)
  assert.equal(statusFor(reading).label, 'Demo alert')
  assert.ok(reading.spo2 < 92)
  for (let tick = 20; tick < 40; tick++) reading = nextReading(reading, SCENARIOS.recovery, tick, tick * 1000)
  assert.equal(statusFor(reading).label, 'Within demo range')
  assert.ok(reading.spo2 >= 95)
})

test('poor signal takes priority over low-oxygen alerts', () => {
  assert.equal(statusFor({ ...INITIAL_INPUT, spo2: 80, quality: 59 }).label, 'Check signal')
  assert.equal(statusFor({ ...INITIAL_INPUT, spo2: 80, quality: 60 }).label, 'Demo alert')
  assert.equal(statusFor({ ...INITIAL_INPUT, spo2: 92 }).label, 'Watch trend')
  assert.equal(statusFor({ ...INITIAL_INPUT, spo2: 95 }).label, 'Within demo range')
})

test('changing oxygen alone never changes simulated blood pressure or pulse', () => {
  for (let tick = 0; tick < 100; tick++) {
    const baseline = nextReading(INITIAL_INPUT, INITIAL_INPUT, tick, 0)
    const changed = nextReading(INITIAL_INPUT, { ...INITIAL_INPUT, spo2: 75 }, tick, 0)
    assert.equal(changed.systolic, baseline.systolic)
    assert.equal(changed.diastolic, baseline.diastolic)
    assert.equal(changed.pulse, baseline.pulse)
    assert.notEqual(changed.spo2, baseline.spo2)
  }
})

test('long scenario sequences remain bounded with valid BP ordering', () => {
  let reading = INITIAL_INPUT
  for (let tick = 0; tick < 7200; tick++) {
    reading = nextReading(reading, Object.values(SCENARIOS)[Math.floor(tick / 30) % 4], tick, tick * 1000)
    assert.ok(reading.spo2 >= 70 && reading.spo2 <= 100)
    assert.ok(reading.pulse >= 35 && reading.pulse <= 180)
    assert.ok(reading.quality >= 0 && reading.quality <= 100)
    assert.ok(reading.systolic > reading.diastolic)
    assert.ok(Object.values(reading).every(Number.isFinite))
  }
})

test('mock pressure produces the expected derived values', () => {
  assert.deepEqual(pressureDetails({ systolic: 120, diastolic: 80 }), { map: 93, pulsePressure: 40 })
})

test('warm-up data is ordered and CSV explicitly identifies simulated sources', () => {
  const history = initialHistory(100000)
  assert.equal(history.length, 45)
  assert.equal(history.at(-1).time, 100000)
  assert.equal(history[1].time - history[0].time, 1000)
  const csv = readingsToCsv(history)
  assert.equal(csv.split('\n').length, 46)
  assert.ok(csv.includes('bp_source'))
  assert.ok(csv.split('\n').slice(1).every(row => row.includes(',simulated,') && row.includes(',independent_mock,')))
})

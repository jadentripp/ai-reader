import { describe, expect, it } from 'bun:test'
import { estimateWordTimings } from '../lib/tts'

describe('estimateWordTimings', () => {
  it('splits words and distributes duration proportionally', () => {
    const timings = estimateWordTimings('Hello world', 2)

    expect(timings.length).toBe(2)
    expect(timings[0]).toMatchObject({ word: 'Hello', startChar: 0, endChar: 5 })
    expect(timings[1]).toMatchObject({ word: 'world', startChar: 6, endChar: 11 })

    expect(timings[0].start).toBe(0)
    expect(timings[0].end).toBeCloseTo(1, 5)
    expect(timings[1].start).toBeCloseTo(1, 5)
    expect(timings[1].end).toBeCloseTo(2, 5)
  })
})

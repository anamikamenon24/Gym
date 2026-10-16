import { describe, expect, it } from 'vitest'
import { percent, ratio } from '../../src/lib/progress.js'

describe('progress ring maths', () => {
  it.each([
    [0, 4, 0],
    [1, 4, 25],
    [3, 4, 75],
    [4, 4, 100],
    [212, 300, 71],
  ])('%s of %s → %s%%', (v, m, expected) => {
    expect(percent(v, m)).toBe(expected)
  })

  it('never goes above 100%', () => {
    expect(percent(9, 4)).toBe(100)
    expect(percent(1000, 10)).toBe(100)
    expect(ratio(9, 4)).toBe(1)
  })

  it('never goes below 0%', () => {
    expect(percent(-5, 10)).toBe(0)
  })

  it.each([
    ['zero goal', 3, 0],
    ['negative goal', 3, -1],
    ['undefined value', undefined, 5],
    ['null goal', 2, null],
    ['NaN', NaN, 5],
    ['Infinity', Infinity, 5],
    ['strings', 'abc', '4'],
  ])('returns 0 (not NaN) for %s', (_, v, m) => {
    expect(percent(v, m)).toBe(0)
    expect(Number.isNaN(ratio(v, m))).toBe(false)
  })

  it('accepts numeric strings', () => {
    expect(percent('2', '4')).toBe(50)
  })
})

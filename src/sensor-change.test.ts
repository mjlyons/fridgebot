import { describe, it, expect } from 'vitest'
import { createMockSensor, createMockLocation } from './test-utils'

describe('Basic Tests', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })

  it('should fail', () => {
    expect(true).toBe(false)
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNetworkRequest } from '../composables/useNetworkRequest'

describe('useNetworkRequest Composable', () => {
  beforeEach(() => {
    // Reset state before each test
    vi.clearAllMocks()
  })

  it('should initialize with correct state', () => {
    const { loading, error, isOnline, retryCount } = useNetworkRequest()

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(isOnline.value).toBeDefined()
    expect(retryCount.value).toBe(0)
  })

  it('should execute successful request', async () => {
    const { request } = useNetworkRequest()
    const mockFn = vi.fn(async () => ({ success: true }))

    const result = await request(mockFn)

    expect(result).toEqual({ success: true })
    expect(mockFn).toHaveBeenCalled()
  })

  it('should handle request errors', async () => {
    const { request, error } = useNetworkRequest()
    const mockError = new Error('Network error')
    const mockFn = vi.fn(async () => {
      throw mockError
    })

    const result = await request(mockFn, { retries: 0 })

    expect(result).toBeNull()
    expect(error.value).toBeDefined()
  })

  it('should retry on failure', async () => {
    const { request } = useNetworkRequest()
    let attempts = 0
    const mockFn = vi.fn(async () => {
      attempts++
      if (attempts < 2) {
        const err = new Error('Temporary failure')
        err.status = 500
        throw err
      }
      return { success: true }
    })

    const result = await request(mockFn, { retries: 2 })

    expect(result).toEqual({ success: true })
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('should not retry on 4xx errors', async () => {
    const { request } = useNetworkRequest()
    const mockFn = vi.fn(async () => {
      const err = new Error('Not found')
      err.status = 404
      throw err
    })

    const result = await request(mockFn, { retries: 3 })

    expect(result).toBeNull()
    expect(mockFn).toHaveBeenCalledTimes(1) // Should not retry
  })

  it('should clear error', () => {
    const { error, clearError } = useNetworkRequest()
    error.value = 'Some error'

    clearError()

    expect(error.value).toBeNull()
  })

  it('should reset state', () => {
    const { loading, error, retryCount, reset } = useNetworkRequest()
    loading.value = true
    error.value = 'Error'
    retryCount.value = 3

    reset()

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(retryCount.value).toBe(0)
  })

  it('should call onRetry callback', async () => {
    const { request } = useNetworkRequest()
    const onRetry = vi.fn()
    let attempts = 0
    const mockFn = vi.fn(async () => {
      attempts++
      if (attempts === 1) {
        const err = new Error('Failure')
        err.status = 500
        throw err
      }
      return { success: true }
    })

    await request(mockFn, { retries: 2, onRetry })

    expect(onRetry).toHaveBeenCalled()
    expect(onRetry).toHaveBeenCalledWith(1, 2, expect.any(Number))
  })

  it('should track retry count', async () => {
    const { request, retryCount } = useNetworkRequest()
    let attempts = 0
    const mockFn = vi.fn(async () => {
      attempts++
      if (attempts === 1) {
        const err = new Error('Failure')
        err.status = 500
        throw err
      }
      return { success: true }
    })

    await request(mockFn, { retries: 1 })

    expect(retryCount.value).toBe(0) // Reset after success
  })
})

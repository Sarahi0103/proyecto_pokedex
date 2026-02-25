import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useNotifications } from '../composables/useNotifications'

describe('useNotifications Composable', () => {
  let notifications

  beforeEach(() => {
    // Reset the notifications before each test
    const { notifications: notifs } = useNotifications()
    notifications = notifs
  })

  it('should initialize with empty notifications', () => {
    const { notifications: notifs } = useNotifications()
    expect(notifs.value).toEqual([])
  })

  it('should add success notification', () => {
    const { success, notifications: notifs } = useNotifications()
    success('Test success')
    
    expect(notifs.value).toHaveLength(1)
    expect(notifs.value[0]).toMatchObject({
      message: 'Test success',
      type: 'success'
    })
  })

  it('should add error notification', () => {
    const { error, notifications: notifs } = useNotifications()
    error('Test error')
    
    expect(notifs.value).toHaveLength(1)
    expect(notifs.value[0]).toMatchObject({
      message: 'Test error',
      type: 'error'
    })
  })

  it('should add warning notification', () => {
    const { warning, notifications: notifs } = useNotifications()
    warning('Test warning')
    
    expect(notifs.value).toHaveLength(1)
    expect(notifs.value[0]).toMatchObject({
      message: 'Test warning',
      type: 'warning'
    })
  })

  it('should add info notification', () => {
    const { info, notifications: notifs } = useNotifications()
    info('Test info')
    
    expect(notifs.value).toHaveLength(1)
    expect(notifs.value[0]).toMatchObject({
      message: 'Test info',
      type: 'info'
    })
  })

  it('should support multiple notifications', () => {
    const { success, error, notifications: notifs } = useNotifications()
    success('Success 1')
    error('Error 1')
    success('Success 2')
    
    expect(notifs.value).toHaveLength(3)
  })

  it('should include unique id for each notification', () => {
    const { success, notifications: notifs } = useNotifications()
    success('Test 1')
    success('Test 2')
    
    expect(notifs.value[0].id).toBeDefined()
    expect(notifs.value[1].id).toBeDefined()
    expect(notifs.value[0].id).not.toBe(notifs.value[1].id)
  })
})

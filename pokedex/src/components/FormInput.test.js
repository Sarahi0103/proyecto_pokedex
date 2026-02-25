import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormInput from '../components/FormInput.vue'

describe('FormInput Component', () => {
  it('renders with label', () => {
    const wrapper = mount(FormInput, {
      props: {
        label: 'Test Label',
        modelValue: '',
      }
    })

    expect(wrapper.text()).toContain('Test Label')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(FormInput, {
      props: {
        modelValue: '',
      }
    })

    const input = wrapper.find('input.input-field')
    await input.setValue('test value')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['test value'])
  })

  it('shows validation icon when validator passes', async () => {
    const validator = (value) => value.length > 3

    const wrapper = mount(FormInput, {
      props: {
        modelValue: 'test',
        validator,
        showValidation: true,
      }
    })

    const validationIcon = wrapper.find('.validation-icon.valid')
    expect(validationIcon.exists()).toBe(true)
    expect(validationIcon.text()).toBe('✓')
  })

  it('shows validation icon when validator fails', async () => {
    const validator = (value) => value.length > 5

    const wrapper = mount(FormInput, {
      props: {
        modelValue: 'hi',
        validator,
        showValidation: true,
      }
    })

    const validationIcon = wrapper.find('.validation-icon.invalid')
    expect(validationIcon.exists()).toBe(true)
    expect(validationIcon.text()).toBe('✗')
  })

  it('toggles password visibility', async () => {
    const wrapper = mount(FormInput, {
      props: {
        modelValue: 'password123',
        type: 'password',
      }
    })

    const input = wrapper.find('input.input-field')
    expect(input.attributes('type')).toBe('password')

    const toggleBtn = wrapper.find('.toggle-password')
    await toggleBtn.trigger('click')

    expect(input.attributes('type')).toBe('text')
  })

  it('disables input when disabled prop is true', () => {
    const wrapper = mount(FormInput, {
      props: {
        modelValue: '',
        disabled: true,
      }
    })

    const input = wrapper.find('input.input-field')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('shows password strength meter for password type', () => {
    const wrapper = mount(FormInput, {
      props: {
        modelValue: 'Password123',
        type: 'password',
        showStrength: true,
      }
    })

    expect(wrapper.find('.strength-meter').exists()).toBe(true)
  })

  it('shows error message when validation fails', () => {
    const wrapper = mount(FormInput, {
      props: {
        modelValue: 'test',
        label: 'Email',
        validator: (v) => false,
      }
    })

    expect(wrapper.text()).toContain('Email inválido')
  })

  it('displays icon when icon prop is provided', () => {
    const wrapper = mount(FormInput, {
      props: {
        modelValue: '',
        icon: '📧',
      }
    })

    expect(wrapper.find('.input-icon').text()).toBe('📧')
  })

  it('handles blur event', async () => {
    const wrapper = mount(FormInput, {
      props: {
        modelValue: 'test',
      }
    })

    const input = wrapper.find('input.input-field')
    await input.trigger('blur')

    expect(wrapper.emitted('blur')).toBeTruthy()
  })
})

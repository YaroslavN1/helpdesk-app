import { createRef } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InputDebounced, InputDebouncedHandle } from './input-debounced'

const DELAY = 50

beforeEach(() => {
  vi.clearAllMocks()
})

function renderInputDebounced() {
  const onChange = vi.fn()
  const ref = createRef<InputDebouncedHandle>()
  render(<InputDebounced value="" onChange={onChange} delay={DELAY} ref={ref} />)
  return { onChange, ref }
}

describe('InputDebounced', () => {
  it('fires onChange with the typed value only after the delay elapses', async () => {
    const { onChange } = renderInputDebounced()

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'alice' } })

    expect(onChange).not.toHaveBeenCalled()

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('alice'), { timeout: 500 })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('cancel() clears a pending debounce so the stale typed value is never applied', async () => {
    const { onChange, ref } = renderInputDebounced()

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'stale search' } })

    act(() => ref.current?.cancel(''))

    expect(screen.getByRole('textbox')).toHaveValue('')

    await new Promise((resolve) => setTimeout(resolve, DELAY + 150))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('cancel() resets the displayed value without throwing when no debounce is pending', () => {
    const { onChange, ref } = renderInputDebounced()

    expect(() => act(() => ref.current?.cancel('reset value'))).not.toThrow()
    expect(screen.getByRole('textbox')).toHaveValue('reset value')
    expect(onChange).not.toHaveBeenCalled()
  })
})

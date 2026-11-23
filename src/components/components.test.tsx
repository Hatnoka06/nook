import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
import { Logo } from './Logo'
import { Sheet } from './Sheet'
import { ToastProvider, useToast } from './Toast'

function Trigger({ onAction }: { onAction: () => void }) {
  const { show } = useToast()
  return <button onClick={() => show('Done', { actionLabel: 'Undo', onAction })}>go</button>
}

describe('components', () => {
  it('Button activates with Enter', async () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>Save</Button>)
    screen.getByRole('button', { name: 'Save' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(fn).toHaveBeenCalledTimes(1)
  })
  it('Logo has aria-label', () => {
    render(<Logo />)
    expect(screen.getByLabelText('Nook')).toBeInTheDocument()
  })
  it('toast action calls onAction', async () => {
    const onAction = vi.fn()
    render(<ToastProvider><Trigger onAction={onAction} /></ToastProvider>)
    await userEvent.click(screen.getByText('go'))
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onAction).toHaveBeenCalled()
  })
  it('toast auto-dismisses after durationMs', () => {
    vi.useFakeTimers()
    function T() { const { show } = useToast(); return <button onClick={() => show('Hi', { durationMs: 1000 })}>x</button> }
    render(<ToastProvider><T /></ToastProvider>)
    act(() => { screen.getByText('x').click() })
    expect(screen.getByText('Hi')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.queryByText('Hi')).toBeNull()
    vi.useRealTimers()
  })
  it('Sheet closes on Escape', async () => {
    const onOpenChange = vi.fn()
    render(<Sheet open onOpenChange={onOpenChange} title="T"><p>body</p></Sheet>)
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@/lib/i18n'
import { isTypingTarget } from '@/lib/isTypingTarget'
import { ToastProvider } from '@/components/Toast'
import { FormHostContext } from './FormHost'
import { QuickAdd } from './QuickAdd'
import { QuickAddProvider, useQuickAdd } from './QuickAddContext'

function Hider() { const { setHidden } = useQuickAdd(); return <button onClick={() => setHidden(true)}>hide</button> }
const setup = () => render(
  <ToastProvider><QuickAddProvider><QuickAdd /><Hider /><input aria-label="field" /></QuickAddProvider></ToastProvider>)

const FormCtx = ({ open, children }: { open: () => void; children: React.ReactNode }) => <FormHostContext.Provider value={{ open, confirm: () => {} }}>{children}</FormHostContext.Provider>
describe('isTypingTarget', () => {
  it('detects text inputs', () => {
    for (const tag of ['input', 'textarea', 'select']) expect(isTypingTarget(document.createElement(tag))).toBe(true)
    const ce = document.createElement('div'); ce.setAttribute('contenteditable', 'true')
    expect(isTypingTarget(ce)).toBe(true)
    expect(isTypingTarget(document.createElement('button'))).toBe(false)
    expect(isTypingTarget(document.body)).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})
describe('QuickAdd', () => {
  it('q opens menu with 4 items', async () => {
    setup()
    await userEvent.keyboard('q')
    expect(await screen.findAllByRole('menuitem')).toHaveLength(5)
  })
  it('q inside an input does not open', async () => {
    setup()
    await userEvent.click(screen.getByLabelText('field'))
    await userEvent.keyboard('q')
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
  })
  it('ctrl+q does not open', async () => {
    setup()
    await userEvent.keyboard('{Control>}q{/Control}')
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
  })
  it('hidden removes the button', async () => {
    setup()
    await userEvent.click(screen.getByText('hide'))
    expect(screen.queryByRole('button', { name: 'Quick add' })).toBeNull()
  })
  it('choosing an item opens the matching form request', async () => {
    const open = vi.fn()
    render(<FormCtx open={open}><ToastProvider><QuickAddProvider><QuickAdd /></QuickAddProvider></ToastProvider></FormCtx>)
    await userEvent.keyboard('q')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Add task' }))
    expect(open).toHaveBeenCalledWith({ kind: 'task' })
  })
})

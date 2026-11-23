import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@/lib/i18n'
import { ToastProvider } from '@/components/Toast'

const update = vi.fn()
let needRefresh = true
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [needRefresh, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: update }),
}))
import { UpdateToast } from './UpdateToast'

describe('UpdateToast', () => {
  it('shows reload action and calls updateServiceWorker(true)', async () => {
    needRefresh = true
    render(<ToastProvider><UpdateToast /></ToastProvider>)
    expect(await screen.findByText('A new version is available')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(update).toHaveBeenCalledWith(true)
  })
  it('shows nothing when no update', () => {
    needRefresh = false
    render(<ToastProvider><UpdateToast /></ToastProvider>)
    expect(screen.queryByText('A new version is available')).toBeNull()
  })
})

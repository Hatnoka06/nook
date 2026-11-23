import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@/lib/i18n'
import { setLanguage } from '@/lib/i18n'
import { OfflineBanner } from '@/app/OfflineBanner'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SettingsPage as Page } from './SettingsPage'

vi.mock('@/features/auth/useProfile', () => ({ useProfile: () => ({ profile: { time_zone: 'Australia/Sydney', week_starts_on: 1, daily_study_goal_minutes: 120, widget_visibility: {} }, update: vi.fn().mockResolvedValue(undefined) }) }))
const SettingsPage = () => <QueryClientProvider client={new QueryClient()}><Page /></QueryClientProvider>

afterEach(() => setLanguage('en'))

describe('SettingsPage', () => {
  it('switching to Tiếng Việt updates the title immediately', async () => {
    render(<SettingsPage />)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tiếng Việt' }))
    expect(screen.getByRole('heading', { name: 'Cài đặt' })).toBeInTheDocument()
  })
  it('Dark theme sets data-theme and storage', async () => {
    render(<SettingsPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('uniflow.theme')).toBe('dark')
  })
  it('Reduce effects switch sets attribute', async () => {
    render(<SettingsPage />)
    await userEvent.click(screen.getByRole('switch', { name: 'Reduce effects' }))
    expect(document.documentElement.dataset.reduceEffects).toBe('true')
  })
  it('background choice sets data-bg', async () => {
    render(<SettingsPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Plain' }))
    expect(document.documentElement.dataset.bg).toBe('plain')
  })
  it('picking a themed scene sets data-bg and marks it chosen', async () => {
    render(<SettingsPage />)
    const ocean = screen.getByRole('button', { name: /Ocean/ })
    await userEvent.click(ocean)
    expect(document.documentElement.dataset.bg).toBe('ocean')
    expect(ocean.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('OfflineBanner', () => {
  it('shows on offline and hides on online', () => {
    render(<OfflineBanner />)
    expect(screen.queryByText(/offline/i)).toBeNull()
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(screen.getByText("You're offline. Changes aren't saved.")).toBeInTheDocument()
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(screen.queryByText(/offline/i)).toBeNull()
  })
})

describe('ErrorBoundary', () => {
  it('shows reload button instead of blank page', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Boom = () => { throw new Error('boom') }
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
    spy.mockRestore()
  })
})

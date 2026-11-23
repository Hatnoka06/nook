import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import '@/lib/i18n'
import { ToastProvider } from '@/components/Toast'
import { FormHost } from './FormHost'
import { QuickAddProvider } from './QuickAddContext'
import { AppLayout } from './AppLayout'
import { appChildren } from './router'

/** Every page renders inside the real layout without throwing (with empty data). */
beforeAll(() => { window.matchMedia ??= ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia })
describe('smoke: every page renders', () => {
  for (const r of appChildren) {
    const path = (r.path ?? '/').replace(':id', 'x')
    it(path, async () => {
      const errors: unknown[] = []
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const router = createMemoryRouter([{ element: <AppLayout />, errorElement: <ErrorProbe onError={(e) => errors.push(e)} />, children: appChildren }], { initialEntries: [path] })
      render(<ToastProvider><QueryClientProvider client={qc}><QuickAddProvider><FormHost><RouterProvider router={router} /></FormHost></QuickAddProvider></QueryClientProvider></ToastProvider>)
      await waitFor(() => new Promise((res) => setTimeout(res, 50)))
      if (path === '*') return
      expect(errors).toEqual([])
    })
  }
})
import { useRouteError } from 'react-router-dom'
function ErrorProbe({ onError }: { onError: (e: unknown) => void }) { const e = useRouteError(); onError(String((e as Error)?.stack ?? e).slice(0, 600)); return null }

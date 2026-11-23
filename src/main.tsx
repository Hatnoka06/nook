import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/index.css'
import '@/lib/i18n'
import '@/lib/useTheme'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { FormHost } from '@/app/FormHost'
import { QuickAddProvider } from '@/app/QuickAddContext'
import { router } from '@/app/router'
import { Background } from '@/components/Background'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { SetupScreen } from '@/features/auth/SetupScreen'
import { isConfigured } from '@/lib/supabase'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true, refetchOnReconnect: true, retry: 1 } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <Background />
        {isConfigured ? (
          <QueryClientProvider client={qc}>
            <AuthProvider><QuickAddProvider><FormHost><RouterProvider router={router} /></FormHost></QuickAddProvider></AuthProvider>
          </QueryClientProvider>
        ) : <SetupScreen />}
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)

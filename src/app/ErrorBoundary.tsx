import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '@/lib/i18n'
import { Button } from '@/components/Button'

/** Last line of defence: a friendly message, the technical detail (so a screenshot tells us what broke) and two ways out. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; where: string }> {
  state = { error: null as Error | null, where: '' }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Nook] crashed:', error, info.componentStack)
    this.setState({ where: (info.componentStack ?? '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4).join(' ‹ ') })
  }
  render() {
    const { error, where } = this.state
    if (!error) return this.props.children
    return (
      <div role="alert" className="mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
        <p>{i18n.t('error.generic')}</p>
        <div className="flex gap-2">
          <Button onClick={() => this.setState({ error: null, where: '' })}>{i18n.t('error.retry')}</Button>
          <Button variant="secondary" onClick={() => location.reload()}>{i18n.t('error.reload')}</Button>
        </div>
        <pre className="max-h-48 w-full overflow-auto whitespace-pre-wrap rounded-input bg-surface-2 p-3 text-left text-[11px] text-text-2">{location.pathname}{'\n'}{String(error.message)}{'\n'}{where}</pre>
      </div>
    )
  }
}

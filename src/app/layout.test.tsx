import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import '@/lib/i18n'
import { appChildren } from './router'
import { AppLayout } from './AppLayout'
import { Sidebar } from './Sidebar'
import { MemoryRouter } from 'react-router-dom'
import { renderHook, act } from '@testing-library/react'
import { useSidebarCollapsed } from './useSidebarCollapsed'
import { fireEvent } from '@testing-library/react'

const at = (path: string) => render(<RouterProvider router={createMemoryRouter([{ element: <AppLayout />, children: appChildren }], { initialEntries: [path] })} />)

describe('navigation', () => {
  it('Sidebar shows 4 group labels and Settings', () => {
    render(<MemoryRouter><Sidebar collapsed={false} onToggle={() => {}} onHide={() => {}} /></MemoryRouter>)
    for (const g of ['Overview', 'Plan', 'Academic', 'Focus']) expect(screen.getByText(g)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })
  it('useSidebarCollapsed persists and survives storage errors', () => {
    const { result } = renderHook(() => useSidebarCollapsed())
    act(() => result.current[1](true))
    expect(localStorage.getItem('uniflow.sidebar')).toBe('true')
    const s = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('x') })
    expect(renderHook(() => useSidebarCollapsed()).result.current[0]).toBe(false)
    s.mockRestore()
  })
  it('hiding the menu folds it into a bubble that opens the full menu', () => {
    localStorage.removeItem('uniflow.navHidden')
    at('/abc')
    fireEvent.click(screen.getByRole('button', { name: 'Hide menu' }))
    expect(localStorage.getItem('uniflow.navHidden')).toBe('true')
    const bubble = screen.getByRole('button', { name: 'Open menu' })
    expect(screen.queryByRole('link', { name: 'Finance' })).toBeNull()
    fireEvent.click(bubble)
    expect(screen.getByRole('link', { name: 'Finance' })).toBeInTheDocument()
  })
  it('unknown route shows NotFound with link home', () => {
    at('/abc')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })
  it('/more lists secondary modules', () => {
    at('/more')
    for (const n of ['Deadlines', 'Courses', 'Semesters', 'Settings'])
      expect(screen.getAllByRole('link', { name: n }).length).toBeGreaterThan(0)
  })
})

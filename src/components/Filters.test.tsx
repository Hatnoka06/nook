import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '@/lib/i18n'
import { Filters } from './Filters'

describe('Filters', () => {
  it('keeps extra filters hidden until opened and shows how many are active', () => {
    render(<Filters search={<input aria-label="search" />} active={2}><select aria-label="course" /></Filters>)
    expect(screen.getByLabelText('search')).toBeTruthy()
    expect(screen.queryByLabelText('course')).toBeNull()
    const btn = screen.getByRole('button', { name: /2/ })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(btn)
    expect(screen.getByLabelText('course')).toBeTruthy()
  })
})

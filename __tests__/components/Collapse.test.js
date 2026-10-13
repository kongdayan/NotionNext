import { act, render } from '@testing-library/react'
import Collapse from '@/components/Collapse'

it('keeps a closed menu at zero height through its first animation frames', () => {
  const callbacks = []
  const raf = jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation(callback => callbacks.push(callback))
  const scrollHeight = jest
    .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
    .mockReturnValue(200)

  try {
    const { container, rerender } = render(
      <Collapse isOpen={false}>Menu contents</Collapse>
    )
    const panel = container.firstChild
    act(() => callbacks.splice(0).forEach(callback => callback()))
    expect(panel.style.height).toBe('0px')

    rerender(<Collapse isOpen={true}>Menu contents</Collapse>)
    expect(panel.style.height).toBe('200px')
    rerender(<Collapse isOpen={false}>Menu contents</Collapse>)
    act(() => callbacks.splice(0).forEach(callback => callback()))
    act(() => callbacks.splice(0).forEach(callback => callback()))
    expect(panel.style.height).toBe('0px')
  } finally {
    scrollHeight.mockRestore()
    raf.mockRestore()
  }
})

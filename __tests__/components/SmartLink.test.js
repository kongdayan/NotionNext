import { render, screen } from '@testing-library/react'
import SmartLink from '@/components/SmartLink'

jest.mock('@/lib/config', () => ({
  siteConfig: key => (key === 'LINK' ? 'https://kongwenyan.cn' : false)
}))
jest.mock(
  'next/link',
  () =>
    function Link({ href, prefetch, children }) {
      return (
        <a href={href} data-prefetch={prefetch}>
          {children}
        </a>
      )
    }
)

it('honors the site setting to avoid downloading unseen articles', () => {
  render(<SmartLink href='/article/post'>Read</SmartLink>)
  expect(screen.getByRole('link')).toHaveAttribute('data-prefetch', 'false')
})

it('allows a critical link to opt in to prefetch', () => {
  render(
    <SmartLink href='/article/post' prefetch>
      Read
    </SmartLink>
  )
  expect(screen.getByRole('link')).toHaveAttribute('data-prefetch', 'true')
})

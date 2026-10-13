import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server.node'
import BlogListPage from '@/themes/fukasawa/components/BlogListPage'

jest.mock('@/lib/config', () => ({
  siteConfig: key => (key === 'POSTS_PER_PAGE' ? 9 : false)
}))
jest.mock('@/lib/global', () => ({ useGlobal: () => ({ NOTION_CONFIG: {} }) }))
jest.mock('@/components/GoogleAdsense', () => ({ AdSlot: () => null }))
jest.mock('@/themes/fukasawa/components/PaginationSimple', () => () => null)
jest.mock(
  '@/themes/fukasawa/components/BlogCard',
  () =>
    function Card({ post, priority }) {
      return <article data-priority={priority}>{post.title}</article>
    }
)

const posts = Array.from({ length: 9 }, (_, index) => ({
  id: String(index),
  title: `Post ${index}`
}))

it('includes every card and the first priority cover in the server HTML', () => {
  const html = renderToString(<BlogListPage posts={posts} postCount={9} />)
  expect(html.match(/<article/g)).toHaveLength(9)
  expect(html).toContain('data-priority="true">Post 0')
})

it('adapts to one mobile column after hydration without losing posts', () => {
  const previousWidth = window.innerWidth
  window.innerWidth = 390
  try {
    render(<BlogListPage posts={posts} postCount={9} />)
    expect(screen.getAllByRole('article').map(x => x.textContent)).toEqual(
      posts.map(x => x.title)
    )
  } finally {
    window.innerWidth = previousWidth
  }
})

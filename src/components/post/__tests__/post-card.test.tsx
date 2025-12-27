import { render, screen, fireEvent } from '@testing-library/react'
import { PostCard } from '../post-card'

const mockPost = {
  id: '1',
  content: 'This is a test post',
  mediaUrls: [],
  mediaType: 'NONE',
  likeCount: 10,
  commentCount: 5,
  hasLiked: false,
  createdAt: new Date().toISOString(),
  author: {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User',
    avatar: null,
  },
}

// Mock fetch
global.fetch = jest.fn()

describe('PostCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders post content correctly', () => {
    render(<PostCard post={mockPost} />)

    expect(screen.getByText('This is a test post')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('displays like and comment counts', () => {
    render(<PostCard post={mockPost} />)

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('handles like action', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const onLike = jest.fn()
    render(<PostCard post={mockPost} onLike={onLike} />)

    const likeButton = screen.getByRole('button', { name: /10/i })
    fireEvent.click(likeButton)

    expect(onLike).toHaveBeenCalledWith('1', true)
    expect(global.fetch).toHaveBeenCalledWith('/api/posts/1/like', {
      method: 'POST',
    })
  })

  it('shows filled heart when post is liked', () => {
    const likedPost = { ...mockPost, hasLiked: true }
    render(<PostCard post={likedPost} />)

    const heartIcon = screen.getByRole('button', { name: /10/i }).querySelector('svg')
    expect(heartIcon).toHaveClass('fill-current')
  })
})

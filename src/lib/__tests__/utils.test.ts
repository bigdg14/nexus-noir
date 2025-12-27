import { formatDate, formatCount, validateFileSize, isImageFile, isVideoFile } from '../utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format recent dates correctly', () => {
      const now = new Date()
      expect(formatDate(now)).toBe('just now')

      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
      expect(formatDate(oneMinuteAgo)).toBe('1m ago')

      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      expect(formatDate(oneHourAgo)).toBe('1h ago')
    })
  })

  describe('formatCount', () => {
    it('should format counts correctly', () => {
      expect(formatCount(0)).toBe('0')
      expect(formatCount(999)).toBe('999')
      expect(formatCount(1000)).toBe('1.0K')
      expect(formatCount(1500)).toBe('1.5K')
      expect(formatCount(1000000)).toBe('1.0M')
    })
  })

  describe('validateFileSize', () => {
    it('should validate file size correctly', () => {
      const smallFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(smallFile, 'size', { value: 1024 * 1024 }) // 1MB

      expect(validateFileSize(smallFile, 10)).toBe(true)
      expect(validateFileSize(smallFile, 0.5)).toBe(false)
    })
  })

  describe('isImageFile', () => {
    it('should identify image files correctly', () => {
      expect(isImageFile('photo.jpg')).toBe(true)
      expect(isImageFile('photo.jpeg')).toBe(true)
      expect(isImageFile('photo.png')).toBe(true)
      expect(isImageFile('video.mp4')).toBe(false)
      expect(isImageFile('document.pdf')).toBe(false)
    })
  })

  describe('isVideoFile', () => {
    it('should identify video files correctly', () => {
      expect(isVideoFile('video.mp4')).toBe(true)
      expect(isVideoFile('video.mov')).toBe(true)
      expect(isVideoFile('photo.jpg')).toBe(false)
      expect(isVideoFile('document.pdf')).toBe(false)
    })
  })
})

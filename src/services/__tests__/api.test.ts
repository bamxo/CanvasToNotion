import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CanvasApi, canvasApi } from '../canvas/api'

describe('Canvas API Service', () => {
  let api: CanvasApi

  beforeEach(() => {
    vi.clearAllMocks()
    api = new CanvasApi()
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Environment Setup', () => {
    it('should create CanvasApi instance successfully', () => {
      expect(api).toBeInstanceOf(CanvasApi)
      expect(canvasApi).toBeInstanceOf(CanvasApi)
    })
  })

  describe('parseNextLink', () => {
    it('should return null when linkHeader is null', () => {
      // Access private method through type assertion
      const result = (api as any).parseNextLink(null)
      expect(result).toBeNull()
    })

    it('should return null when linkHeader is empty', () => {
      const result = (api as any).parseNextLink('')
      expect(result).toBeNull()
    })

    it('should parse next link correctly from Link header', () => {
      const linkHeader = '<https://canvas.ucsc.edu/api/v1/courses?page=2>; rel="next", <https://canvas.ucsc.edu/api/v1/courses?page=5>; rel="last"'
      const result = (api as any).parseNextLink(linkHeader)
      expect(result).toBe('https://canvas.ucsc.edu/api/v1/courses?page=2')
    })

    it('should return null when no next link is found', () => {
      const linkHeader = '<https://canvas.ucsc.edu/api/v1/courses?page=1>; rel="prev", <https://canvas.ucsc.edu/api/v1/courses?page=5>; rel="last"'
      const result = (api as any).parseNextLink(linkHeader)
      expect(result).toBeNull()
    })

    it('should handle malformed link headers gracefully', () => {
      const linkHeader = 'invalid-link-header'
      const result = (api as any).parseNextLink(linkHeader)
      expect(result).toBeNull()
    })
  })

  describe('getRecentCourses', () => {
    it('should fetch and filter recent courses successfully', async () => {
      const mockCourses = [
        {
          id: 1,
          name: 'Test Course 1',
          course_code: 'TEST101',
          workflow_state: 'available',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
          enrollments: [{ enrollment_state: 'active', type: 'student' }]
        },
        {
          id: 2,
          name: 'Old Course',
          course_code: 'OLD101',
          workflow_state: 'available',
          created_at: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
          enrollments: [{ enrollment_state: 'active', type: 'student' }]
        },
        {
          id: 3,
          name: 'Unavailable Course',
          course_code: 'UNAVAIL101',
          workflow_state: 'completed',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          enrollments: [{ enrollment_state: 'active', type: 'student' }]
        },
        {
          id: 4,
          name: 'Teacher Course',
          course_code: 'TEACH101',
          workflow_state: 'available',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          enrollments: [{ enrollment_state: 'active', type: 'teacher' }]
        }
      ]

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockCourses),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      }

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const result = await api.getRecentCourses()

      expect(global.fetch).toHaveBeenCalledWith('https://canvas.ucsc.edu/api/v1/courses?per_page=100')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 1,
        name: 'Test Course 1',
        code: 'TEST101',
        workflow_state: 'available'
      })
    })

    it('should handle pagination correctly', async () => {
      const mockCoursesPage1 = [
        {
          id: 1,
          name: 'Course 1',
          course_code: 'C1',
          workflow_state: 'available',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          enrollments: [{ enrollment_state: 'active', type: 'student' }]
        }
      ]

      const mockCoursesPage2 = [
        {
          id: 2,
          name: 'Course 2',
          course_code: 'C2',
          workflow_state: 'available',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          enrollments: [{ enrollment_state: 'active', type: 'student' }]
        }
      ]

      const mockResponsePage1 = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockCoursesPage1),
        headers: {
          get: vi.fn().mockReturnValue('<https://canvas.ucsc.edu/api/v1/courses?page=2>; rel="next"')
        }
      }

      const mockResponsePage2 = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockCoursesPage2),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      }

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockResponsePage1)
        .mockResolvedValueOnce(mockResponsePage2)

      const result = await api.getRecentCourses()

      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Course 1')
      expect(result[1].name).toBe('Course 2')
    })

    it('should throw error when fetch fails', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      }

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await expect(api.getRecentCourses()).rejects.toThrow('HTTP error! Status: 401')
    })

    it('should handle courses without course_code', async () => {
      const mockCourses = [
        {
          id: 1,
          name: 'Test Course',
          workflow_state: 'available',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          enrollments: [{ enrollment_state: 'active', type: 'student' }]
        }
      ]

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockCourses),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      }

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const result = await api.getRecentCourses()

      expect(result[0].code).toBe('')
    })

    it('should handle courses without enrollments', async () => {
      const mockCourses = [
        {
          id: 1,
          name: 'Test Course',
          course_code: 'TEST101',
          workflow_state: 'available',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockCourses),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      }

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const result = await api.getRecentCourses()

      expect(result).toHaveLength(0)
    })
  })

  describe('getAllAssignments', () => {
    const mockCourses = [
      { id: 1, name: 'Course 1', code: 'C1', workflow_state: 'available' },
      { id: 2, name: 'Course 2', code: 'C2', workflow_state: 'available' }
    ]

    it('should fetch assignments for all courses successfully', async () => {
      const mockAssignments1 = [
        {
          id: 1,
          name: 'Assignment 1',
          description: '<p>Test description</p>',
          due_at: '2024-12-31T23:59:59Z',
          points_possible: 100,
          html_url: 'https://canvas.ucsc.edu/courses/1/assignments/1'
        }
      ]

      const mockAssignments2 = [
        {
          id: 2,
          name: 'Assignment 2',
          description: null,
          due_at: null,
          points_possible: 50,
          html_url: 'https://canvas.ucsc.edu/courses/2/assignments/2'
        }
      ]

      const mockResponse1 = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockAssignments1)
      }

      const mockResponse2 = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockAssignments2)
      }

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      const result = await api.getAllAssignments(mockCourses)

      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(global.fetch).toHaveBeenCalledWith('https://canvas.ucsc.edu/api/v1/courses/1/assignments?per_page=100')
      expect(global.fetch).toHaveBeenCalledWith('https://canvas.ucsc.edu/api/v1/courses/2/assignments?per_page=100')
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 1,
        name: 'Assignment 1',
        description: 'Test description',
        due_at: '2024-12-31T23:59:59Z',
        points_possible: 100,
        courseId: 1,
        courseName: 'Course 1',
        html_url: 'https://canvas.ucsc.edu/courses/1/assignments/1'
      })
      expect(result[1]).toEqual({
        id: 2,
        name: 'Assignment 2',
        description: null,
        due_at: null,
        points_possible: 50,
        courseId: 2,
        courseName: 'Course 2',
        html_url: 'https://canvas.ucsc.edu/courses/2/assignments/2'
      })
    })

    it('should handle fetch errors gracefully and continue with other courses', async () => {
      const mockAssignments = [
        {
          id: 1,
          name: 'Assignment 1',
          description: 'Test',
          due_at: null,
          points_possible: 100,
          html_url: 'https://canvas.ucsc.edu/test'
        }
      ]

      const mockResponseSuccess = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockAssignments)
      }

      const mockResponseError = {
        ok: false,
        status: 404
      }

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockResponseError)
        .mockResolvedValueOnce(mockResponseSuccess)

      const result = await api.getAllAssignments(mockCourses)

      expect(result).toHaveLength(1)
      expect(result[0].courseId).toBe(2)
    })

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue([])
        })

      const result = await api.getAllAssignments(mockCourses)

      expect(result).toHaveLength(0)
    })

    it('should return empty array when no courses provided', async () => {
      const result = await api.getAllAssignments([])
      expect(result).toHaveLength(0)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('stripHtmlTags', () => {
    it('should return null when input is null', () => {
      const result = (api as any).stripHtmlTags(null)
      expect(result).toBeNull()
    })

    it('should strip HTML tags correctly', () => {
      const html = '<p>This is a <strong>test</strong> with <em>HTML</em> tags.</p>'
      const result = (api as any).stripHtmlTags(html)
      expect(result).toBe('This is a test with HTML tags.')
    })

    it('should handle HTML entities correctly', () => {
      const html = 'Test&nbsp;with&amp;entities&lt;like&gt;this&quot;and&#39;that'
      const result = (api as any).stripHtmlTags(html)
      expect(result).toBe('Test with&entities<like>this"and\'that')
    })

    it('should trim whitespace', () => {
      const html = '  <p>  Test with whitespace  </p>  '
      const result = (api as any).stripHtmlTags(html)
      expect(result).toBe('Test with whitespace')
    })

    it('should handle empty string', () => {
      const result = (api as any).stripHtmlTags('')
      expect(result).toBeNull()
    })

    it('should handle text without HTML tags', () => {
      const text = 'Plain text without tags'
      const result = (api as any).stripHtmlTags(text)
      expect(result).toBe('Plain text without tags')
    })

    it('should handle complex HTML with nested tags', () => {
      const html = '<div><p>Nested <span>HTML <strong>tags</strong></span> here</p></div>'
      const result = (api as any).stripHtmlTags(html)
      expect(result).toBe('Nested HTML tags here')
    })

    it('should handle self-closing tags', () => {
      const html = 'Line 1<br/>Line 2<hr/>Line 3'
      const result = (api as any).stripHtmlTags(html)
      expect(result).toBe('Line 1Line 2Line 3')
    })
  })

  describe('Singleton Export', () => {
    it('should export a singleton instance', () => {
      expect(canvasApi).toBeDefined()
      expect(canvasApi).toBeInstanceOf(CanvasApi)
    })

    it('should maintain same instance across multiple references', () => {
      // Test that the singleton instance is consistent
      const api1 = canvasApi
      const api2 = canvasApi
      expect(api1).toBe(api2)
      expect(api1).toBeInstanceOf(CanvasApi)
    })
  })
}) 
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getUserDataByEmail, getAccessTokenForUser, updateAccessToken } from '../firebase/db'

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({}))
}))

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  get: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
  update: vi.fn()
}))

// Import the mocked functions after mocking
import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database'

const mockRef = vi.mocked(ref)
const mockGet = vi.mocked(get)
const mockQuery = vi.mocked(query)
const mockOrderByChild = vi.mocked(orderByChild)
const mockEqualTo = vi.mocked(equalTo)
const mockUpdate = vi.mocked(update)

describe('Firebase Database Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Environment Setup', () => {
    it('should initialize Firebase and database service successfully', () => {
      // This test verifies that the module can be imported and Firebase is initialized
      expect(getUserDataByEmail).toBeDefined()
      expect(getAccessTokenForUser).toBeDefined()
      expect(updateAccessToken).toBeDefined()
      expect(typeof getUserDataByEmail).toBe('function')
      expect(typeof getAccessTokenForUser).toBe('function')
      expect(typeof updateAccessToken).toBe('function')
    })
  })

  describe('getUserDataByEmail', () => {
    it('should successfully retrieve user data by email', async () => {
      const testEmail = 'test@example.com'
      const testUserId = 'user123'
      const testAccessToken = 'token123'
      const testUserData = {
        email: testEmail,
        accessToken: testAccessToken,
        name: 'Test User'
      }

      // Mock the snapshot with user data
      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(true),
        forEach: vi.fn((callback) => {
          const childSnapshot = {
            key: testUserId,
            val: vi.fn().mockReturnValue(testUserData)
          }
          callback(childSnapshot)
          return true
        })
      } as any

      mockGet.mockResolvedValue(mockSnapshot)
      mockRef.mockReturnValue('users-ref' as any)
      mockQuery.mockReturnValue('query-ref' as any)
      mockOrderByChild.mockReturnValue('order-ref' as any)
      mockEqualTo.mockReturnValue('equal-ref' as any)

      const result = await getUserDataByEmail(testEmail)

      expect(mockRef).toHaveBeenCalledWith({}, 'users')
      expect(mockOrderByChild).toHaveBeenCalledWith('email')
      expect(mockEqualTo).toHaveBeenCalledWith(testEmail)
      expect(mockQuery).toHaveBeenCalledWith('users-ref', 'order-ref', 'equal-ref')
      expect(mockGet).toHaveBeenCalledWith('query-ref')

      expect(result).toEqual({
        userId: testUserId,
        accessToken: testAccessToken,
        userData: testUserData
      })
    })

    it('should throw error when no user found with email', async () => {
      const testEmail = 'nonexistent@example.com'

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(false)
      } as any

      mockGet.mockResolvedValue(mockSnapshot)

      await expect(getUserDataByEmail(testEmail)).rejects.toThrow('No user found with this email')
    })

    it('should throw error when user data structure is unexpected', async () => {
      const testEmail = 'test@example.com'

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(true),
        forEach: vi.fn((callback) => {
          // Return false to simulate no valid user data
          return false
        })
      } as any

      mockGet.mockResolvedValue(mockSnapshot)

      await expect(getUserDataByEmail(testEmail)).rejects.toThrow('User data structure is unexpected')
    })

    it('should handle Firebase errors gracefully', async () => {
      const testEmail = 'test@example.com'
      const firebaseError = new Error('Firebase connection failed')

      mockGet.mockRejectedValue(firebaseError)

      await expect(getUserDataByEmail(testEmail)).rejects.toThrow('Firebase connection failed')
    })
  })

  describe('getAccessTokenForUser', () => {
    it('should successfully retrieve access token for user', async () => {
      const testUserId = 'user123'
      const testAccessToken = 'token123'
      const testUserData = {
        accessToken: testAccessToken,
        email: 'test@example.com'
      }

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(true),
        val: vi.fn().mockReturnValue(testUserData)
      } as any

      mockGet.mockResolvedValue(mockSnapshot)
      mockRef.mockReturnValue('user-ref' as any)

      const result = await getAccessTokenForUser(testUserId)

      expect(mockRef).toHaveBeenCalledWith({}, `users/${testUserId}`)
      expect(mockGet).toHaveBeenCalledWith('user-ref')
      expect(result).toBe(testAccessToken)
    })

    it('should throw error when user not found', async () => {
      const testUserId = 'nonexistent-user'

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(false)
      } as any

      mockGet.mockResolvedValue(mockSnapshot)

      await expect(getAccessTokenForUser(testUserId)).rejects.toThrow('User not found')
    })

    it('should throw error when access token not found for user', async () => {
      const testUserId = 'user123'
      const testUserData = {
        email: 'test@example.com'
        // No accessToken property
      }

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(true),
        val: vi.fn().mockReturnValue(testUserData)
      } as any

      mockGet.mockResolvedValue(mockSnapshot)

      await expect(getAccessTokenForUser(testUserId)).rejects.toThrow('Access token not found for this user')
    })

    it('should handle Firebase errors gracefully', async () => {
      const testUserId = 'user123'
      const firebaseError = new Error('Database read failed')

      mockGet.mockRejectedValue(firebaseError)

      await expect(getAccessTokenForUser(testUserId)).rejects.toThrow('Database read failed')
    })
  })

  describe('updateAccessToken', () => {
    it('should successfully update access token', async () => {
      const testUserId = 'user123'
      const newAccessToken = 'new-token123'

      mockUpdate.mockResolvedValue(undefined)
      mockRef.mockReturnValue('user-ref' as any)

      const result = await updateAccessToken(testUserId, newAccessToken)

      expect(mockRef).toHaveBeenCalledWith({}, `users/${testUserId}`)
      expect(mockUpdate).toHaveBeenCalledWith('user-ref', {
        accessToken: newAccessToken
      })
      expect(result).toBe(true)
    })

    it('should handle Firebase update errors gracefully', async () => {
      const testUserId = 'user123'
      const newAccessToken = 'new-token123'
      const firebaseError = new Error('Database update failed')

      mockUpdate.mockRejectedValue(firebaseError)

      await expect(updateAccessToken(testUserId, newAccessToken)).rejects.toThrow('Database update failed')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty email string', async () => {
      const emptyEmail = ''

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(false)
      } as any

      mockGet.mockResolvedValue(mockSnapshot)

      await expect(getUserDataByEmail(emptyEmail)).rejects.toThrow('No user found with this email')
    })

    it('should handle empty user ID string', async () => {
      const emptyUserId = ''

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(false)
      } as any

      mockGet.mockResolvedValue(mockSnapshot)

      await expect(getAccessTokenForUser(emptyUserId)).rejects.toThrow('User not found')
    })

    it('should handle empty access token in update', async () => {
      const testUserId = 'user123'
      const emptyToken = ''

      mockUpdate.mockResolvedValue(undefined)
      mockRef.mockReturnValue('user-ref' as any)

      const result = await updateAccessToken(testUserId, emptyToken)

      expect(mockUpdate).toHaveBeenCalledWith('user-ref', {
        accessToken: emptyToken
      })
      expect(result).toBe(true)
    })

    it('should handle null access token in user data', async () => {
      const testUserId = 'user123'
      const testUserData = {
        email: 'test@example.com',
        accessToken: null
      }

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(true),
        val: vi.fn().mockReturnValue(testUserData)
      } as any

      mockGet.mockResolvedValue(mockSnapshot)

      await expect(getAccessTokenForUser(testUserId)).rejects.toThrow('Access token not found for this user')
    })

    it('should handle undefined access token in user data', async () => {
      const testUserId = 'user123'
      const testUserData = {
        email: 'test@example.com',
        accessToken: undefined
      }

      const mockSnapshot = {
        exists: vi.fn().mockReturnValue(true),
        val: vi.fn().mockReturnValue(testUserData)
      } as any

      mockGet.mockResolvedValue(mockSnapshot)

      await expect(getAccessTokenForUser(testUserId)).rejects.toThrow('Access token not found for this user')
    })
  })
}) 
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Firebase modules before importing the service
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'existing-app' }))
}))

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({ ref: vi.fn() }))
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null }))
}))

// Import the mocked functions after mocking
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const mockInitializeApp = vi.mocked(initializeApp)
const mockGetApps = vi.mocked(getApps)
const mockGetApp = vi.mocked(getApp)
const mockGetDatabase = vi.mocked(getDatabase)
const mockGetAuth = vi.mocked(getAuth)

// Helper function to create properly typed mock Firebase app
const createMockApp = (name: string) => ({
  name,
  options: {},
  automaticDataCollectionEnabled: false
})

describe('Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module state before each test
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Environment Setup', () => {
    it('should initialize Firebase service successfully and verify environment is working', async () => {
      // Import the service after mocking
      const firebaseService = await import('../firebase/firebase')
      
      // Verify that all main functions are defined and are functions
      expect(firebaseService.initializeFirebase).toBeDefined()
      expect(typeof firebaseService.initializeFirebase).toBe('function')
      
      expect(firebaseService.getFirebaseDatabase).toBeDefined()
      expect(typeof firebaseService.getFirebaseDatabase).toBe('function')
      
      expect(firebaseService.getFirebaseAuth).toBeDefined()
      expect(typeof firebaseService.getFirebaseAuth).toBe('function')
      
      expect(firebaseService.getFirebaseApp).toBeDefined()
      expect(typeof firebaseService.getFirebaseApp).toBe('function')
      
      expect(firebaseService.isFirebaseInitialized).toBeDefined()
      expect(typeof firebaseService.isFirebaseInitialized).toBe('function')
      
      expect(firebaseService.resetFirebaseInstances).toBeDefined()
      expect(typeof firebaseService.resetFirebaseInstances).toBe('function')
      
      expect(firebaseService.validateFirebaseConfig).toBeDefined()
      expect(typeof firebaseService.validateFirebaseConfig).toBe('function')
      
      expect(firebaseService.getFirebaseConfig).toBeDefined()
      expect(typeof firebaseService.getFirebaseConfig).toBe('function')
      
      // Verify that the default export exists and contains expected properties
      expect(firebaseService.default).toBeDefined()
      expect(typeof firebaseService.default).toBe('object')
      
      // Verify that the FirebaseConfig interface is properly exported (through defaultFirebaseConfig)
      expect(firebaseService.defaultFirebaseConfig).toBeDefined()
      expect(typeof firebaseService.defaultFirebaseConfig).toBe('object')
      
      // Verify the configuration has all required fields
      const config = firebaseService.defaultFirebaseConfig
      expect(config.apiKey).toBeDefined()
      expect(config.authDomain).toBeDefined()
      expect(config.databaseURL).toBeDefined()
      expect(config.projectId).toBeDefined()
      expect(config.storageBucket).toBeDefined()
      expect(config.messagingSenderId).toBeDefined()
      expect(config.appId).toBeDefined()
      
      console.log('✅ Firebase service environment test passed - all functions and exports are properly defined')
    })
  })

  describe('initializeFirebase', () => {
    it('should initialize Firebase with default configuration when no config provided', async () => {
      mockGetApps.mockReturnValue([])
      const mockApp = createMockApp('test-app')
      mockInitializeApp.mockReturnValue(mockApp as any)

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.initializeFirebase()
      
      expect(mockGetApps).toHaveBeenCalled()
      expect(mockInitializeApp).toHaveBeenCalledWith(firebaseService.defaultFirebaseConfig)
      expect(result).toBe(mockApp)
    })

    it('should initialize Firebase with custom configuration', async () => {
      mockGetApps.mockReturnValue([])
      const mockApp = createMockApp('custom-app')
      mockInitializeApp.mockReturnValue(mockApp as any)

      const customConfig = {
        apiKey: 'custom-api-key',
        authDomain: 'custom-auth-domain',
        databaseURL: 'custom-database-url',
        projectId: 'custom-project-id',
        storageBucket: 'custom-storage-bucket',
        messagingSenderId: 'custom-sender-id',
        appId: 'custom-app-id'
      }

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.initializeFirebase(customConfig)
      
      expect(mockInitializeApp).toHaveBeenCalledWith(customConfig)
      expect(result).toBe(mockApp)
    })

    it('should return existing app if Firebase is already initialized', async () => {
      const existingApp = createMockApp('existing-app')
      mockGetApps.mockReturnValue([existingApp])
      mockGetApp.mockReturnValue(existingApp as any)

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.initializeFirebase()
      
      expect(mockGetApps).toHaveBeenCalled()
      expect(mockGetApp).toHaveBeenCalled()
      expect(mockInitializeApp).not.toHaveBeenCalled()
      expect(result).toBe(existingApp)
    })

    it('should handle initialization errors gracefully', async () => {
      mockGetApps.mockReturnValue([])
      const error = new Error('Firebase initialization failed')
      mockInitializeApp.mockImplementation(() => {
        throw error
      })

      const firebaseService = await import('../firebase/firebase')
      
      expect(() => firebaseService.initializeFirebase()).toThrow('Failed to initialize Firebase: Firebase initialization failed')
    })

    it('should handle unknown errors during initialization', async () => {
      mockGetApps.mockReturnValue([])
      mockInitializeApp.mockImplementation(() => {
        throw 'Unknown error'
      })

      const firebaseService = await import('../firebase/firebase')
      
      expect(() => firebaseService.initializeFirebase()).toThrow('Failed to initialize Firebase: Unknown error')
    })
  })

  describe('getFirebaseDatabase', () => {
    it('should return database instance when Firebase is already initialized', async () => {
      const mockApp = createMockApp('test-app')
      const mockDb = { ref: vi.fn() }
      mockGetDatabase.mockReturnValue(mockDb as any)
      mockInitializeApp.mockReturnValue(mockApp as any)

      const firebaseService = await import('../firebase/firebase')
      
      // Initialize Firebase first to set the internal app instance
      firebaseService.initializeFirebase()
      
      const result = firebaseService.getFirebaseDatabase()
      
      expect(mockGetDatabase).toHaveBeenCalledWith(mockApp)
      expect(result).toBe(mockDb)
    })

    it('should initialize Firebase and return database when not initialized', async () => {
      const mockApp = createMockApp('test-app')
      const mockDb = { ref: vi.fn() }
      mockGetApps.mockReturnValue([])
      mockInitializeApp.mockReturnValue(mockApp as any)
      mockGetDatabase.mockReturnValue(mockDb as any)

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.getFirebaseDatabase()
      
      expect(mockInitializeApp).toHaveBeenCalled()
      expect(mockGetDatabase).toHaveBeenCalledWith(mockApp)
      expect(result).toBe(mockDb)
    })

    it('should handle database initialization errors', async () => {
      const error = new Error('Database initialization failed')
      mockGetDatabase.mockImplementation(() => {
        throw error
      })

      const firebaseService = await import('../firebase/firebase')
      
      expect(() => firebaseService.getFirebaseDatabase()).toThrow('Failed to get Firebase database: Database initialization failed')
    })

    it('should handle unknown database errors', async () => {
      mockGetDatabase.mockImplementation(() => {
        throw 'Unknown database error'
      })

      const firebaseService = await import('../firebase/firebase')
      
      expect(() => firebaseService.getFirebaseDatabase()).toThrow('Failed to get Firebase database: Unknown error')
    })
  })

  describe('getFirebaseAuth', () => {
    it('should return auth instance when Firebase is already initialized', async () => {
      const mockApp = createMockApp('test-app')
      const mockAuth = { currentUser: null }
      mockGetAuth.mockReturnValue(mockAuth as any)
      mockInitializeApp.mockReturnValue(mockApp as any)

      const firebaseService = await import('../firebase/firebase')
      
      // Initialize Firebase first to set the internal app instance
      firebaseService.initializeFirebase()
      
      const result = firebaseService.getFirebaseAuth()
      
      expect(mockGetAuth).toHaveBeenCalledWith(mockApp)
      expect(result).toBe(mockAuth)
    })

    it('should initialize Firebase and return auth when not initialized', async () => {
      const mockApp = createMockApp('test-app')
      const mockAuth = { currentUser: null }
      mockGetApps.mockReturnValue([])
      mockInitializeApp.mockReturnValue(mockApp as any)
      mockGetAuth.mockReturnValue(mockAuth as any)

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.getFirebaseAuth()
      
      expect(mockInitializeApp).toHaveBeenCalled()
      expect(mockGetAuth).toHaveBeenCalledWith(mockApp)
      expect(result).toBe(mockAuth)
    })

    it('should handle auth initialization errors', async () => {
      const error = new Error('Auth initialization failed')
      mockGetAuth.mockImplementation(() => {
        throw error
      })

      const firebaseService = await import('../firebase/firebase')
      
      expect(() => firebaseService.getFirebaseAuth()).toThrow('Failed to get Firebase auth: Auth initialization failed')
    })

    it('should handle unknown auth errors', async () => {
      mockGetAuth.mockImplementation(() => {
        throw 'Unknown auth error'
      })

      const firebaseService = await import('../firebase/firebase')
      
      expect(() => firebaseService.getFirebaseAuth()).toThrow('Failed to get Firebase auth: Unknown error')
    })
  })

  describe('getFirebaseApp', () => {
    it('should return null when Firebase is not initialized', async () => {
      const firebaseService = await import('../firebase/firebase')
      
      // Reset the app instance
      firebaseService.resetFirebaseInstances()
      
      const result = firebaseService.getFirebaseApp()
      
      expect(result).toBeNull()
    })

    it('should return app instance when Firebase is initialized', async () => {
      const mockApp = createMockApp('test-app')
      mockGetApps.mockReturnValue([])
      mockInitializeApp.mockReturnValue(mockApp as any)

      const firebaseService = await import('../firebase/firebase')
      
      // Initialize Firebase first
      firebaseService.initializeFirebase()
      
      const result = firebaseService.getFirebaseApp()
      
      expect(result).toBe(mockApp)
    })
  })

  describe('isFirebaseInitialized', () => {
    it('should return false when Firebase is not initialized', async () => {
      mockGetApps.mockReturnValue([])

      const firebaseService = await import('../firebase/firebase')
      
      // Reset instances to ensure clean state
      firebaseService.resetFirebaseInstances()
      
      const result = firebaseService.isFirebaseInitialized()
      
      expect(result).toBe(false)
    })

    it('should return true when Firebase is initialized', async () => {
      const mockApp = createMockApp('test-app')
      mockGetApps.mockReturnValue([mockApp])
      mockInitializeApp.mockReturnValue(mockApp as any)

      const firebaseService = await import('../firebase/firebase')
      
      // Initialize Firebase first
      firebaseService.initializeFirebase()
      
      const result = firebaseService.isFirebaseInitialized()
      
      expect(result).toBe(true)
    })
  })

  describe('resetFirebaseInstances', () => {
    it('should reset all Firebase instances to null', async () => {
      const firebaseService = await import('../firebase/firebase')
      
      // Initialize Firebase first
      const mockApp = createMockApp('test-app')
      mockGetApps.mockReturnValue([])
      mockInitializeApp.mockReturnValue(mockApp as any)
      firebaseService.initializeFirebase()
      
      // Verify it's initialized
      expect(firebaseService.getFirebaseApp()).toBe(mockApp)
      
      // Reset instances
      firebaseService.resetFirebaseInstances()
      
      // Verify instances are reset
      expect(firebaseService.getFirebaseApp()).toBeNull()
    })
  })

  describe('validateFirebaseConfig', () => {
    it('should return true for valid configuration', async () => {
      const validConfig = {
        apiKey: 'valid-api-key',
        authDomain: 'valid-auth-domain',
        databaseURL: 'valid-database-url',
        projectId: 'valid-project-id',
        storageBucket: 'valid-storage-bucket',
        messagingSenderId: 'valid-sender-id',
        appId: 'valid-app-id'
      }

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.validateFirebaseConfig(validConfig)
      
      expect(result).toBe(true)
    })

    it('should return false for configuration with missing fields', async () => {
      const invalidConfig = {
        apiKey: 'valid-api-key',
        authDomain: 'valid-auth-domain',
        // Missing other required fields
      } as any

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.validateFirebaseConfig(invalidConfig)
      
      expect(result).toBe(false)
    })

    it('should return false for configuration with empty string fields', async () => {
      const invalidConfig = {
        apiKey: '',
        authDomain: 'valid-auth-domain',
        databaseURL: 'valid-database-url',
        projectId: 'valid-project-id',
        storageBucket: 'valid-storage-bucket',
        messagingSenderId: 'valid-sender-id',
        appId: 'valid-app-id'
      }

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.validateFirebaseConfig(invalidConfig)
      
      expect(result).toBe(false)
    })

    it('should return false for configuration with whitespace-only fields', async () => {
      const invalidConfig = {
        apiKey: '   ',
        authDomain: 'valid-auth-domain',
        databaseURL: 'valid-database-url',
        projectId: 'valid-project-id',
        storageBucket: 'valid-storage-bucket',
        messagingSenderId: 'valid-sender-id',
        appId: 'valid-app-id'
      }

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.validateFirebaseConfig(invalidConfig)
      
      expect(result).toBe(false)
    })

    it('should return false for configuration with non-string fields', async () => {
      const invalidConfig = {
        apiKey: 123,
        authDomain: 'valid-auth-domain',
        databaseURL: 'valid-database-url',
        projectId: 'valid-project-id',
        storageBucket: 'valid-storage-bucket',
        messagingSenderId: 'valid-sender-id',
        appId: 'valid-app-id'
      } as any

      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.validateFirebaseConfig(invalidConfig)
      
      expect(result).toBe(false)
    })
  })

  describe('getFirebaseConfig', () => {
    it('should return sanitized configuration without apiKey', async () => {
      const firebaseService = await import('../firebase/firebase')
      
      const result = firebaseService.getFirebaseConfig()
      
      expect(result).toEqual({
        authDomain: 'canvas2notion-3cd84.firebaseapp.com',
        databaseURL: 'https://canvas2notion-3cd84-default-rtdb.firebaseio.com',
        projectId: 'canvas2notion-3cd84',
        storageBucket: 'canvas2notion-3cd84.firebasestorage.app',
        messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
        appId: 'YOUR_APP_ID'
      })
      
      expect(result).not.toHaveProperty('apiKey')
    })
  })

  describe('defaultFirebaseConfig', () => {
    it('should export the default Firebase configuration', async () => {
      const firebaseService = await import('../firebase/firebase')
      
      expect(firebaseService.defaultFirebaseConfig).toEqual({
        apiKey: 'AIzaSyDJ4TOuZQq2715GWU9JlfCE-YU8CXkPNdU',
        authDomain: 'canvas2notion-3cd84.firebaseapp.com',
        databaseURL: 'https://canvas2notion-3cd84-default-rtdb.firebaseio.com',
        projectId: 'canvas2notion-3cd84',
        storageBucket: 'canvas2notion-3cd84.firebasestorage.app',
        messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
        appId: 'YOUR_APP_ID'
      })
    })
  })

  describe('default export', () => {
    it('should export all functions in default object', async () => {
      const firebaseService = await import('../firebase/firebase')
      
      expect(firebaseService.default).toEqual({
        initializeFirebase: firebaseService.initializeFirebase,
        getFirebaseDatabase: firebaseService.getFirebaseDatabase,
        getFirebaseAuth: firebaseService.getFirebaseAuth,
        getFirebaseApp: firebaseService.getFirebaseApp,
        isFirebaseInitialized: firebaseService.isFirebaseInitialized,
        resetFirebaseInstances: firebaseService.resetFirebaseInstances,
        validateFirebaseConfig: firebaseService.validateFirebaseConfig,
        getFirebaseConfig: firebaseService.getFirebaseConfig,
        defaultFirebaseConfig: firebaseService.defaultFirebaseConfig
      })
    })
  })

  describe('Module initialization', () => {
    it('should handle initialization failure on module load gracefully', async () => {
      // Mock console.warn to verify it's called
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock initializeApp to throw an error during module load
      mockGetApps.mockReturnValue([])
      mockInitializeApp.mockImplementation(() => {
        throw new Error('Module load initialization failed')
      })
      
      // Import the module (this will trigger the module-level initialization)
      await import('../firebase/firebase')
      
      // Verify that console.warn was called with the expected message
      expect(consoleSpy).toHaveBeenCalledWith(
        'Firebase initialization failed on module load:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })
}) 
# Canvas to Notion Extension E2E Tests

This directory contains focused end-to-end tests for the Canvas to Notion Chrome extension, covering the essential user flows and functionality.

## Test Overview

The e2e test suite focuses on the core user journey with 6 essential test suites:

### 1. **Signup** (`1-signup.e2e.test.ts`)
- Tests user registration through the webapp
- Verifies user data is saved to Firebase database
- Ensures proper authentication flow from extension to webapp

### 2. **Login** (`2-login.e2e.test.ts`)
- Tests logging into the extension from the webapp
- Verifies authentication persistence in the extension
- Tests both webapp login and direct email login in extension

### 3. **Notion Connection** (`3-notion-connection.e2e.test.ts`)
- Tests connecting a Notion account to the extension
- Handles Notion OAuth flow simulation
- Tests error handling for failed connections

### 4. **Page Selection** (`4-notion-page-selection.e2e.test.ts`)
- Tests selecting a Notion page within the extension
- Verifies page list loading from Notion API
- Tests page selection persistence and UI updates

### 5. **Unsynced Assignments** (`5-unsynced-assignments.e2e.test.ts`) ⚠️ **Expected to Fail**
- Tests fetching unsynced assignments from Canvas
- **Expected to fail** without a real Canvas account
- Verifies graceful error handling when Canvas is not accessible

### 6. **Syncing** (`6-syncing.e2e.test.ts`) ⚠️ **Expected to Fail**
- Tests the assignment syncing functionality
- **Expected to fail** without a real Canvas account
- Verifies proper error states and user feedback

## Test Credentials

All tests use the following test account:
- **Email**: `test@test.test`
- **Password**: `testtest`

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Individual Test Suites
```bash
npm run test:e2e:signup        # User signup
npm run test:e2e:login         # Extension login
npm run test:e2e:notion        # Notion connection
npm run test:e2e:pages         # Page selection
npm run test:e2e:assignments   # Unsynced assignments (expected to fail)
npm run test:e2e:sync          # Syncing (expected to fail)
```

### Development Options
```bash
npm run test:e2e:watch         # Run in watch mode
npm run test:e2e:ui            # Open Vitest UI
```

### Run Specific Suite by Name
```bash
npm run test:e2e -- --suite "Signup"
npm run test:e2e -- --suite "Notion Connection"
```

## Expected Test Results

### ✅ **Should Pass** (4 tests)
- Signup
- Login  
- Notion Connection
- Page Selection

### ⚠️ **Expected to Fail** (2 tests)
- Unsynced Assignments - Requires real Canvas account
- Syncing - Requires real Canvas account

The test runner will clearly distinguish between unexpected failures and expected failures due to missing Canvas account access.

## Test Environment

### Prerequisites
- Chrome browser with extension support
- Node.js and npm
- Built extension in `dist/` directory
- Webapp running on `localhost:5173` (for login tests)

### Test Setup
- Uses Puppeteer with Chrome extension loading
- Simulates real Chrome extension environment
- Mocks Chrome APIs comprehensively
- Uses realistic popup dimensions (400x600)

## Test Architecture

### Core Components
- **`setup.ts`**: Main test setup and browser configuration
- **`run-tests.ts`**: Test runner with focused suite management
- **`vite.config.e2e.ts`**: Vitest configuration for e2e environment

### Test Structure
Each test file follows a consistent pattern:
1. **Setup**: Authentication and environment preparation
2. **Action**: User interaction simulation
3. **Verification**: Expected behavior validation
4. **Cleanup**: Resource cleanup and state reset

## Key Features

### Realistic Extension Environment
- Loads actual Chrome extension
- Comprehensive Chrome API mocking
- Proper popup window simulation
- Extension-specific styling and context

### Focused Test Coverage
- Essential user flows only
- Clear pass/fail expectations
- Realistic error handling
- Canvas account dependency awareness

### Robust Error Handling
- Graceful failure for missing Canvas access
- Network error simulation
- API failure testing
- UI error state verification

## Troubleshooting

### Common Issues

**Tests fail to start**
- Ensure extension is built: `npm run build`
- Check Chrome browser availability
- Verify test file paths

**Webapp connection fails**
- Ensure webapp is running on `localhost:5173`
- Check network connectivity
- Verify webapp authentication endpoints

**Canvas-related tests fail**
- This is expected behavior without Canvas account
- Tests should show appropriate error messages
- Verify error handling is graceful

### Debug Options
- Use `npm run test:e2e:ui` for visual debugging
- Check browser console for extension errors
- Review test output for specific failure points

## Contributing

When adding new tests:
1. Follow the existing naming convention (`X-description.e2e.test.ts`)
2. Use consistent test structure and setup
3. Add appropriate test credentials and mocking
4. Update this README with new test descriptions
5. Consider whether tests should pass or fail by design

## Test Data Cleanup

Tests use mock data and temporary accounts. The test account `test@test.test` should be cleaned up periodically from the Firebase database to prevent data accumulation. 
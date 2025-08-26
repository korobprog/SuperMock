# Development Features

This document describes the development-only features that are available in the SuperMock application.

## Overview

Development features are automatically hidden in production builds and only appear when `import.meta.env.DEV` is `true` (development mode).

## Features

### 1. Development Banner (`DevBanner`)

A banner component that appears on the main page during development, showing:
- Development mode indicator
- Quick access to debug page
- Current user information
- Demo mode toggle

**Location**: `frontend/src/components/ui/dev-banner.tsx`

### 2. Debug Test Page (`DevTest`)

A comprehensive development testing page available at `/dev-test` that includes:

#### Debug Information
- Telegram User data (JSON format)
- User ID
- Demo Mode status with toggle
- Environment information
- Additional development info

#### Testing Controls
- Database seeding operations
- System status monitoring
- Page navigation shortcuts
- Error display

**Location**: `frontend/src/pages/DevTest.tsx`

### 3. Development Route Guard (`DevRouteGuard`)

A component that protects development-only routes by redirecting to the home page in production.

**Location**: `frontend/src/components/ui/dev-route-guard.tsx`

### 4. Development Utilities (`dev-utils.ts`)

Helper functions for development-only operations:

- `isDevelopment()` - Check if in development mode
- `devLog()` - Development-only console logging
- `devWarn()` - Development-only console warnings
- `devError()` - Development-only console errors
- `devOnly()` - Execute functions only in development
- `getDevInfo()` - Get development environment info
- `devMeasure()` - Performance measurement in development
- `devMeasureAsync()` - Async performance measurement

**Location**: `frontend/src/lib/dev-utils.ts`

### 5. Demo Mode

A toggleable demo mode that can be controlled from the development interface:

- Added to the global store (`demoMode` property)
- Can be toggled from DevBanner or DevTest page
- Persisted in localStorage
- Resets on logout

### 6. Test Accounts System

A comprehensive test account system for development:

- **Predefined Accounts**: Multiple test accounts with different roles (candidate/interviewer)
- **Random Account Generation**: Generate random test accounts for testing
- **Account Management**: Apply, clear, and switch between test accounts
- **Persistence**: Test accounts are saved in localStorage and restored on page reload
- **Automatic Integration**: Test accounts automatically integrate with the main application flow
- **Production Safety**: Completely disabled in production builds

#### Available Test Accounts:
- **Test Candidate**: Frontend Developer (ID: 123456789)
- **Test Interviewer**: Senior Developer (ID: 987654321)  
- **Demo User**: Full Stack Developer (ID: 555666777)

#### Features:
- Switch between different roles and professions
- Generate random accounts with random properties
- Visual indicators when test account is active
- Debug information display
- Automatic cleanup after 24 hours

## Usage

### Adding Development Features to Pages

```tsx
import { DevBanner } from '@/components/ui/dev-banner';

// In your component
<DevBanner showDebugInfo={true} className="mt-4" />
```

### Using Test Accounts

```tsx
import { DevTestAccounts } from '@/components/ui/dev-test-accounts';

// In your component
<DevTestAccounts />
```

### Test Account Management

```tsx
import { 
  applyDevTestAccount, 
  clearDevTestAccount, 
  getDevTestAccounts,
  generateRandomDevTestAccount 
} from '@/lib/dev-test-account';

// Apply a test account
const accounts = getDevTestAccounts();
if (accounts.length > 0) {
  applyDevTestAccount(accounts[0]);
}

// Generate and apply random account
const randomAccount = generateRandomDevTestAccount();
applyDevTestAccount(randomAccount);

// Clear test account
clearDevTestAccount();
```

### Using Development Utilities

```tsx
import { devLog, devOnly, getDevInfo } from '@/lib/dev-utils';

// Development-only logging
devLog('Component mounted', { userId, role });

// Development-only execution
devOnly(() => {
  console.log('This only runs in development');
});

// Get development info
const devInfo = getDevInfo();
```

### Protecting Development Routes

```tsx
import { DevRouteGuard } from '@/components/ui/dev-route-guard';

<Route
  path="/dev-only"
  element={
    <DevRouteGuard>
      <DevOnlyComponent />
    </DevRouteGuard>
  }
/>
```

## Security

- All development features are automatically excluded from production builds
- Development routes are protected by both `import.meta.env.DEV` checks and `DevRouteGuard`
- No development code is included in production bundles
- Development utilities are tree-shaken out of production builds

## Environment Variables

The following environment variables are used for development features:

- `import.meta.env.DEV` - Determines if in development mode
- `import.meta.env.MODE` - Current build mode
- `import.meta.env.VITE_API_BASE_URL` - API base URL
- `import.meta.env.VITE_API_URL` - API URL
- `VITE_ENABLE_DEV_TEST_ACCOUNTS` - Enable test accounts system (set to 'true' to enable)

## Debug Information Displayed

The debug page shows the following information:

```
Debug Info:
- Telegram User: {"id":1736594064,"first_name":"Max","last_name":"","username":"korobprog",...}
- User ID: 1699028
- Demo Mode: 0
- Environment: development
- Base URL: http://localhost:3000
```

## Production Safety

- All development features are completely removed in production builds
- No development routes are accessible in production
- Development utilities are not included in production bundles
- The application behaves exactly the same in production as if development features never existed

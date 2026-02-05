# CONSTRUO 2026 - Comprehensive Test Suite

This directory contains a comprehensive end-to-end (E2E) and security test suite for the CONSTRUO 2026 civil engineering symposium website.

## Overview

The test suite covers:
- **E2E Tests**: All 12 steps of the admin panel setup wizard
- **Security Tests**: Authentication, authorization, XSS, SQL injection, and access control
- **Integration Tests**: Supabase database connectivity and data integrity

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Playwright** browsers installed
3. **Running local server** or accessible deployment
4. **Supabase project** with test data

## Installation

```bash
cd tests
npm install
npx playwright install chromium
```

## Configuration

Set the following environment variables (or use `.env` file):

```bash
# Base URL for testing
export TEST_BASE_URL=http://localhost:8080

# Supabase credentials (for database validation)
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_SERVICE_KEY=your-service-key

# Test admin credentials
export TEST_ADMIN_USERNAME=admin
export TEST_ADMIN_PASSWORD=your-test-password
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Security Tests Only
```bash
npm run test:security
```

### Run Tests in Headed Mode (visible browser)
```bash
npm run test:headed
```

### Run Tests Sequentially (recommended for full suite)
```bash
npm run test:sequential
```

### Debug Mode
```bash
npm run test:debug
```

### UI Mode (interactive test runner)
```bash
npm run test:ui
```

## Test Structure

```
tests/
├── playwright.config.js      # Playwright configuration
├── package.json              # Test dependencies
├── run-tests.js              # Sequential test runner
├── README.md                 # This file
├── TEST_SUMMARY.md           # Detailed test coverage
├── e2e/
│   ├── helpers.js            # Test utilities
│   ├── all-steps.spec.js     # Steps 1-10 E2E tests
│   ├── step11-footer.spec.js # Step 11 E2E tests
│   └── step12-registrations.spec.js # Step 12 E2E tests
└── security/
    └── security.spec.js      # Security vulnerability tests
```

## Test Coverage

### E2E Tests (Steps 1-12)

| Step | Feature | Status |
|------|---------|--------|
| 1 | Login | ✅ |
| 2 | Hero Section | ✅ |
| 3 | About Section | ✅ |
| 4 | Stats Section | ✅ |
| 5 | Timeline | ✅ |
| 6 | Events | ✅ |
| 7 | Speakers | ✅ |
| 8 | Sponsors | ✅ |
| 9 | Venue | ✅ |
| 10 | Organizers | ✅ |
| 11 | Footer & Settings | ✅ |
| 12 | Registrations | ✅ |

### Security Tests

| Test | Description | Status |
|------|-------------|--------|
| Authentication | Login/logout functionality | ✅ |
| Authorization | Role-based access control | ✅ |
| Session Management | Token validation, expiration | ✅ |
| XSS Prevention | Input sanitization | ✅ |
| SQL Injection | Query parameterization | ✅ |
| CSRF Protection | Token validation | ✅ |
| Access Control | Unauthenticated access prevention | ✅ |

## Continuous Integration

Tests are configured to run on:
- Local development server
- Staging environment
- Pre-deployment validation

## Troubleshooting

### Tests failing due to network issues
- Ensure the server is running before tests
- Check `TEST_BASE_URL` environment variable

### Supabase connection errors
- Verify Supabase credentials are correct
- Ensure test tables exist and are accessible

### Browser launch failures
- Run `npx playwright install` to update browsers
- Check for system dependencies on Linux

## Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Use helpers from `e2e/helpers.js`
3. Add tests to appropriate `.spec.js` file
4. Update this README with new coverage

## License

Same as the main project.

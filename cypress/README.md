# Cypress E2E Testing Suite for Email Warmup Pro

This comprehensive Cypress testing suite covers all major features and user flows of the Email Warmup Pro application.

## 📁 Test Structure

```
cypress/
├── e2e/                          # End-to-end test files
│   ├── 01-authentication.cy.ts   # Login/signup/logout flows
│   ├── 02-tenant-management.cy.ts # Multi-tenant functionality
│   ├── 03-email-accounts.cy.ts   # Email account management
│   ├── 04-campaigns.cy.ts        # Campaign CRUD operations
│   ├── 05-demo.cy.ts             # Demo simulation tests
│   ├── 06-team-management.cy.ts  # Team member management
│   ├── 07-navigation.cy.ts       # UI navigation and responsiveness
│   ├── 08-error-handling.cy.ts   # Error scenarios and edge cases
│   └── 09-integration.cy.ts      # Full user journey integration tests
├── fixtures/                     # Test data
├── support/                      # Custom commands and utilities
│   ├── commands.ts               # Custom Cypress commands
│   ├── e2e.ts                   # E2E setup and configuration
│   └── page-objects/            # Page Object Model classes
└── scripts/                     # Test setup and utility scripts
```

## 🧪 Test Coverage

### Authentication Tests (`01-authentication.cy.ts`)
- ✅ User signup flow with validation
- ✅ User login with valid/invalid credentials
- ✅ User logout functionality
- ✅ Protected route access control
- ✅ Session management and persistence
- ✅ Password requirements and security

### Tenant Management Tests (`02-tenant-management.cy.ts`)
- ✅ Tenant onboarding process
- ✅ Multi-tenant switching functionality
- ✅ Tenant settings management
- ✅ Data isolation between tenants
- ✅ Tenant access control and permissions

### Email Account Tests (`03-email-accounts.cy.ts`)
- ✅ Adding email accounts (mock OAuth flow)
- ✅ Email accounts list display
- ✅ Account status monitoring
- ✅ Account synchronization
- ✅ Removing email accounts
- ✅ Bulk account operations

### Campaign Tests (`04-campaigns.cy.ts`)
- ✅ Creating new warmup campaigns
- ✅ Campaign configuration and validation
- ✅ Campaign status management (pause/resume)
- ✅ Campaign performance monitoring
- ✅ Campaign editing and deletion
- ✅ Campaign automation handling

### Demo Tests (`05-demo.cy.ts`)
- ✅ Demo simulation startup
- ✅ Real-time metrics updates
- ✅ Demo control operations (pause/resume/stop)
- ✅ Demo completion and results export
- ✅ Demo error handling and recovery

### Team Management Tests (`06-team-management.cy.ts`)
- ✅ Inviting team members
- ✅ Role-based access control
- ✅ Team member management
- ✅ Team activity audit logs
- ✅ Bulk team operations

### Navigation Tests (`07-navigation.cy.ts`)
- ✅ Dashboard navigation
- ✅ Sidebar navigation
- ✅ Responsive behavior across devices
- ✅ Breadcrumb navigation
- ✅ Keyboard navigation and accessibility

### Error Handling Tests (`08-error-handling.cy.ts`)
- ✅ Network error scenarios
- ✅ Form validation errors
- ✅ API timeout and rate limiting
- ✅ Data integrity errors
- ✅ Resource quota limits
- ✅ Session expiration handling

### Integration Tests (`09-integration.cy.ts`)
- ✅ Complete user journey (signup to campaign launch)
- ✅ Multi-tenant workflows
- ✅ Campaign lifecycle management
- ✅ Team collaboration scenarios
- ✅ Demo to production workflows
- ✅ Data consistency and recovery

## 🚀 Running Tests

### Prerequisites
```bash
npm install
# or
yarn install
```

### Development Mode (Interactive)
```bash
# Open Cypress Test Runner
npm run cy:open

# Open for component testing
npm run test:component:dev
```

### Headless Mode (CI/CD)
```bash
# Run all E2E tests
npm run test:e2e

# Run with specific browser
npm run cy:run:chrome
npm run cy:run:firefox
npm run cy:run:edge

# Run with headed mode (see browser)
npm run cy:run:headed
```

### Combined Development Testing
```bash
# Start dev server and run tests
npm run test:e2e:dev

# Start production server and run tests
npm run test:e2e:ci
```

### Component Testing
```bash
# Run component tests headless
npm run test:component

# Open component test runner
npm run test:component:dev
```

## 🔧 Configuration

### Environment Variables
Configure these in `cypress.config.ts` or set as environment variables:

```typescript
env: {
  SUPABASE_URL: 'your-supabase-url',
  SUPABASE_ANON_KEY: 'your-supabase-anon-key',
  TEST_USER_EMAIL: 'test@example.com',
  TEST_USER_PASSWORD: 'testpassword123',
  TEST_ADMIN_EMAIL: 'admin@example.com',
  TEST_ADMIN_PASSWORD: 'adminpassword123'
}
```

### Test Data
Test data is stored in `cypress/fixtures/` and includes:
- User credentials and profiles
- Campaign configurations
- Email account data
- Team member information
- Demo simulation data

## 🎯 Custom Commands

The test suite includes custom commands for common operations:

```typescript
// Authentication
cy.login(email?, password?)
cy.logout()
cy.signUp(email, password, organizationName?)

// Data selection
cy.getByTestId(selector)

// Application-specific actions
cy.createTenant(name)
cy.switchTenant(tenantName)
cy.addEmailAccount(email)
cy.createCampaign(name, options?)
cy.inviteTeamMember(email, role?)
cy.runDemo()

// Utilities
cy.waitForPageLoad()
cy.interceptApiCalls()
```

## 📱 Cross-Browser Testing

Tests are configured to run across multiple browsers:
- ✅ Chrome (default)
- ✅ Firefox
- ✅ Edge
- ✅ Electron

## 📐 Responsive Testing

Tests include viewport testing for:
- 📱 Mobile (320px - 767px)
- 📱 Tablet (768px - 1023px)
- 🖥️ Desktop (1024px+)
- 🖥️ Large Desktop (1920px+)

## 🔍 Page Object Model

The test suite uses Page Object Model pattern for maintainable tests:

```typescript
// Example usage
const dashboardPage = new DashboardPage()
const campaignsPage = dashboardPage.navigateToCampaigns()
campaignsPage.createCampaign('Test Campaign')
  .verifyCampaignExists('Test Campaign')
```

## 🚨 Error Scenarios

Comprehensive error handling tests cover:
- Network failures and timeouts
- API errors (4xx, 5xx)
- Form validation failures
- Resource quota limits
- Concurrent modification conflicts
- Session expiration
- Browser storage limits

## 📊 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          build: npm run build
          start: npm start
          wait-on: 'http://localhost:3000'
          record: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

### GitLab CI Example
```yaml
e2e-tests:
  stage: test
  image: cypress/included
  script:
    - npm ci
    - npm run test:e2e:ci
  artifacts:
    when: always
    paths:
      - cypress/videos
      - cypress/screenshots
    expire_in: 1 week
```

## 🐛 Debugging

### Screenshots and Videos
- Screenshots are automatically taken on test failures
- Videos are recorded for all test runs
- Artifacts are stored in `cypress/screenshots/` and `cypress/videos/`

### Debug Mode
```bash
# Run with debug output
DEBUG=cypress:* npm run cy:run

# Run specific test file
npx cypress run --spec "cypress/e2e/01-authentication.cy.ts"

# Run with browser dev tools
npm run cy:run:headed
```

### Test Data Reset
```bash
# Reset test database (if applicable)
npm run test:reset-db

# Clear test artifacts
npm run test:clean
```

## 🔒 Security Testing

Tests include security considerations:
- XSS prevention validation
- CSRF protection verification
- Authentication bypass attempts
- Authorization boundary testing
- Input sanitization checks

## 📈 Performance Testing

Basic performance testing included:
- Page load time monitoring
- Large dataset handling
- Memory usage validation
- Concurrent user simulation

## 🎯 Best Practices

### Writing Tests
1. Use data-testid attributes for reliable element selection
2. Implement proper wait strategies with `cy.waitForPageLoad()`
3. Use Page Object Model for reusable test logic
4. Include both positive and negative test scenarios
5. Test error boundaries and recovery mechanisms

### Test Data Management
1. Use fixtures for consistent test data
2. Clean up test data between runs
3. Isolate tests to prevent interdependencies
4. Mock external API calls appropriately

### Maintenance
1. Regular test review and updates
2. Monitor test execution times
3. Update selectors when UI changes
4. Maintain comprehensive test documentation

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles/)
- [Page Object Model](https://martinfowler.com/bliki/PageObject.html)

## 🤝 Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Add appropriate test data to fixtures
3. Update this README with new test coverage
4. Ensure tests are reliable and maintainable
5. Include both happy path and error scenarios

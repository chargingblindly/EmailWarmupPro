// Script to set up test data for Cypress tests
// This would typically interact with your database or API to create test data

export interface TestDataSetup {
  users: {
    testUser: any
    adminUser: any
    memberUser: any
  }
  tenants: any[]
  campaigns: any[]
  emailAccounts: any[]
  teamMembers: any[]
}

export async function setupTestData(): Promise<TestDataSetup> {
  // This is a mock implementation
  // In a real scenario, you'd create actual test data in your database
  
  const testData: TestDataSetup = {
    users: {
      testUser: {
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'testpassword123'
      },
      adminUser: {
        id: 'admin-user-id',
        email: 'admin@example.com',
        password: 'adminpassword123',
        role: 'admin'
      },
      memberUser: {
        id: 'member-user-id',
        email: 'member@example.com',
        password: 'memberpassword123',
        role: 'member'
      }
    },
    tenants: [
      {
        id: 'test-tenant-1',
        name: 'Test Organization',
        ownerId: 'test-user-id'
      }
    ],
    campaigns: [],
    emailAccounts: [],
    teamMembers: []
  }

  console.log('Test data setup completed:', testData)
  return testData
}

export async function cleanupTestData(): Promise<void> {
  // Clean up test data after tests
  console.log('Test data cleanup completed')
}

// Helper function to reset database to clean state
export async function resetTestDatabase(): Promise<void> {
  // This would typically truncate test tables and reset sequences
  console.log('Test database reset completed')
}

// Helper to seed specific test scenarios
export async function seedScenario(scenario: string): Promise<any> {
  switch (scenario) {
    case 'empty-tenant':
      return {
        tenant: { id: 'empty-tenant', name: 'Empty Tenant' },
        campaigns: [],
        emailAccounts: [],
        teamMembers: []
      }
    
    case 'full-tenant':
      return {
        tenant: { id: 'full-tenant', name: 'Full Tenant' },
        campaigns: [
          { id: 'campaign-1', name: 'Active Campaign', status: 'active' },
          { id: 'campaign-2', name: 'Paused Campaign', status: 'paused' }
        ],
        emailAccounts: [
          { id: 'account-1', email: 'test1@example.com', status: 'connected' },
          { id: 'account-2', email: 'test2@example.com', status: 'syncing' }
        ],
        teamMembers: [
          { id: 'member-1', email: 'admin@example.com', role: 'admin' },
          { id: 'member-2', email: 'user@example.com', role: 'member' }
        ]
      }
    
    default:
      throw new Error(`Unknown scenario: ${scenario}`)
  }
}

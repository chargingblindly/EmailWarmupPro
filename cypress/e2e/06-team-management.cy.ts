/// <reference types="cypress" />

describe('Team Management', () => {
  let teamMembers: any
  let users: any

  before(() => {
    cy.fixture('teamMembers').then((data) => {
      teamMembers = data
    })
    cy.fixture('users').then((data) => {
      users = data
    })
  })

  beforeEach(() => {
    cy.login()
    cy.visit('/dashboard/team')
  })

  describe('Team Members List', () => {
    it('should display team members list', () => {
      // Mock team members response
      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: teamMembers.mockTeamMembers }
      }).as('getTeamMembers')

      cy.reload()
      cy.wait('@getTeamMembers')

      // Should show team members
      teamMembers.mockTeamMembers.forEach((member: any) => {
        cy.getByTestId(`member-card-${member.id}`).should('be.visible')
        cy.getByTestId(`member-email-${member.id}`).should('contain', member.email)
        cy.getByTestId(`member-role-${member.id}`).should('contain', member.role)
        cy.getByTestId(`member-status-${member.id}`).should('contain', member.status)
      })
    })

    it('should show different member status indicators', () => {
      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: teamMembers.mockTeamMembers }
      }).as('getTeamMembers')

      cy.reload()
      cy.wait('@getTeamMembers')

      // Check active member
      cy.getByTestId('member-status-member-1')
        .should('contain', 'active')
        .and('have.class', 'status-active')

      // Check invited member
      cy.getByTestId('member-status-member-3')
        .should('contain', 'invited')
        .and('have.class', 'status-invited')
    })

    it('should display member roles correctly', () => {
      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: teamMembers.mockTeamMembers }
      }).as('getTeamMembers')

      cy.reload()
      cy.wait('@getTeamMembers')

      // Check different roles
      cy.getByTestId('member-role-member-1').should('contain', 'owner')
      cy.getByTestId('member-role-member-2').should('contain', 'admin')
      cy.getByTestId('member-role-member-3').should('contain', 'member')
    })

    it('should show member activity information', () => {
      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: teamMembers.mockTeamMembers }
      }).as('getTeamMembers')

      cy.reload()
      cy.wait('@getTeamMembers')

      // Check join date
      cy.getByTestId('member-joined-member-1').should('be.visible')
      
      // Check last active
      cy.getByTestId('member-last-active-member-1').should('be.visible')
    })

    it('should display empty state when no team members', () => {
      // Mock empty team response
      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: [] }
      }).as('getEmptyTeam')

      cy.reload()
      cy.wait('@getEmptyTeam')

      // Should show empty state
      cy.getByTestId('empty-team-state').should('be.visible')
      cy.getByTestId('invite-first-member-button').should('be.visible')
    })
  })

  describe('Inviting Team Members', () => {
    it('should open invite member modal', () => {
      cy.getByTestId('invite-team-member-button').click()

      // Should show modal
      cy.getByTestId('invite-member-modal').should('be.visible')
      cy.getByTestId('invite-email-input').should('be.visible')
      cy.getByTestId('invite-role-select').should('be.visible')
      cy.getByTestId('send-invite-button').should('be.visible')
    })

    it('should successfully invite a team member', () => {
      // Mock invite API
      cy.intercept('POST', '**/api/team/invite', {
        statusCode: 200,
        body: { 
          success: true,
          invitation: {
            id: 'invite-123',
            email: teamMembers.newMember.email,
            role: teamMembers.newMember.role,
            status: 'invited'
          }
        }
      }).as('inviteTeamMember')

      cy.inviteTeamMember(teamMembers.newMember.email, teamMembers.newMember.role)
      cy.wait('@inviteTeamMember')

      // Should close modal and show success
      cy.getByTestId('invite-member-modal').should('not.exist')
      cy.get('[role="alert"]').should('contain.text', 'invited')
    })

    it('should validate email format', () => {
      cy.getByTestId('invite-team-member-button').click()
      
      // Enter invalid email
      cy.getByTestId('invite-email-input').type('invalid-email')
      cy.getByTestId('send-invite-button').click()

      // Should show validation error
      cy.get('[role="alert"]').should('contain.text', 'valid email')
    })

    it('should handle duplicate email invitations', () => {
      // Mock duplicate invitation error
      cy.intercept('POST', '**/api/team/invite', {
        statusCode: 409,
        body: { error: 'User already invited or is a member' }
      }).as('duplicateInvite')

      cy.inviteTeamMember(teamMembers.mockTeamMembers[0].email)
      cy.wait('@duplicateInvite')

      // Should show error message
      cy.get('[role="alert"]').should('contain.text', 'already invited')
    })

    it('should select different roles for invitation', () => {
      cy.getByTestId('invite-team-member-button').click()
      
      // Check available roles
      cy.getByTestId('invite-role-select').select('admin')
      cy.getByTestId('invite-role-select').should('have.value', 'admin')
      
      cy.getByTestId('invite-role-select').select('member')
      cy.getByTestId('invite-role-select').should('have.value', 'member')
    })

    it('should close invite modal when cancelled', () => {
      cy.getByTestId('invite-team-member-button').click()
      cy.getByTestId('cancel-invite-button').click()

      // Should close modal
      cy.getByTestId('invite-member-modal').should('not.exist')
    })

    it('should send multiple invitations', () => {
      // Mock successful invitations
      cy.intercept('POST', '**/api/team/invite', {
        statusCode: 200,
        body: { success: true }
      }).as('inviteSuccess')

      // First invitation
      cy.inviteTeamMember('user1@example.com', 'admin')
      cy.wait('@inviteSuccess')

      // Second invitation
      cy.inviteTeamMember('user2@example.com', 'member')
      cy.wait('@inviteSuccess')

      // Should show success for both
      cy.get('[role="alert"]').should('be.visible')
    })
  })

  describe('Managing Team Members', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: teamMembers.mockTeamMembers }
      }).as('getTeamMembers')
      
      cy.reload()
      cy.wait('@getTeamMembers')
    })

    it('should view member details', () => {
      cy.getByTestId('member-card-member-2').click()

      // Should open member details modal
      cy.getByTestId('member-details-modal').should('be.visible')
      cy.getByTestId('member-details-email').should('contain', teamMembers.mockTeamMembers[1].email)
      cy.getByTestId('member-details-role').should('contain', teamMembers.mockTeamMembers[1].role)
      cy.getByTestId('member-details-joined').should('be.visible')
    })

    it('should change member role (admin only)', () => {
      // Mock role change API
      cy.intercept('PUT', '**/api/team/member-2/role', {
        statusCode: 200,
        body: { success: true }
      }).as('changeRole')

      cy.getByTestId('member-menu-member-2').click()
      cy.getByTestId('change-role-button').click()

      // Should show role change modal
      cy.getByTestId('change-role-modal').should('be.visible')
      cy.getByTestId('new-role-select').select('admin')
      cy.getByTestId('confirm-role-change').click()

      cy.wait('@changeRole')

      // Should update member role
      cy.getByTestId('member-role-member-2').should('contain', 'admin')
    })

    it('should remove team member with confirmation', () => {
      // Mock remove member API
      cy.intercept('DELETE', '**/api/team/member-3', {
        statusCode: 200,
        body: { success: true }
      }).as('removeMember')

      cy.getByTestId('member-menu-member-3').click()
      cy.getByTestId('remove-member-button').click()

      // Should show confirmation dialog
      cy.getByTestId('confirm-remove-member-dialog').should('be.visible')
      cy.getByTestId('confirm-remove-member-button').click()

      cy.wait('@removeMember')

      // Should remove member from list
      cy.getByTestId('member-card-member-3').should('not.exist')
    })

    it('should cancel member removal', () => {
      cy.getByTestId('member-menu-member-3').click()
      cy.getByTestId('remove-member-button').click()
      
      // Cancel removal
      cy.getByTestId('cancel-remove-member-button').click()

      // Should close dialog
      cy.getByTestId('confirm-remove-member-dialog').should('not.exist')
    })

    it('should resend invitation to pending member', () => {
      // Mock resend invitation API
      cy.intercept('POST', '**/api/team/member-3/resend-invite', {
        statusCode: 200,
        body: { success: true }
      }).as('resendInvite')

      cy.getByTestId('member-menu-member-3').click()
      cy.getByTestId('resend-invite-button').click()

      cy.wait('@resendInvite')

      // Should show success message
      cy.get('[role="alert"]').should('contain.text', 'invitation sent')
    })

    it('should handle role change permissions', () => {
      // Mock insufficient permissions error
      cy.intercept('PUT', '**/api/team/member-1/role', {
        statusCode: 403,
        body: { error: 'Insufficient permissions' }
      }).as('roleChangeError')

      cy.getByTestId('member-menu-member-1').click()
      
      // Owner role change should be restricted
      cy.getByTestId('change-role-button').should('not.exist')
    })
  })

  describe('Team Member Permissions', () => {
    it('should show different actions based on user role', () => {
      // Mock current user as admin
      cy.intercept('GET', '**/api/user/current', {
        statusCode: 200,
        body: { 
          user: { 
            id: 'current-user',
            role: 'admin' 
          }
        }
      }).as('getCurrentUser')

      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: teamMembers.mockTeamMembers }
      }).as('getTeamMembers')

      cy.reload()
      cy.wait('@getCurrentUser')
      cy.wait('@getTeamMembers')

      // Admin should see management actions
      cy.getByTestId('invite-team-member-button').should('be.visible')
      cy.getByTestId('member-menu-member-3').should('be.visible')
    })

    it('should restrict actions for regular members', () => {
      // Mock current user as member
      cy.intercept('GET', '**/api/user/current', {
        statusCode: 200,
        body: { 
          user: { 
            id: 'current-user',
            role: 'member' 
          }
        }
      }).as('getCurrentUser')

      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: teamMembers.mockTeamMembers }
      }).as('getTeamMembers')

      cy.reload()
      cy.wait('@getCurrentUser')
      cy.wait('@getTeamMembers')

      // Member should not see admin actions
      cy.getByTestId('invite-team-member-button').should('not.exist')
      cy.getByTestId('member-menu-member-3').should('not.exist')
    })

    it('should prevent self-removal', () => {
      // Mock current user in team list
      const currentUserMember = {
        ...teamMembers.mockTeamMembers[1],
        id: 'current-user-id'
      }

      cy.intercept('GET', '**/api/user/current', {
        statusCode: 200,
        body: { 
          user: { 
            id: 'current-user-id',
            role: 'admin' 
          }
        }
      }).as('getCurrentUser')

      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: [currentUserMember, ...teamMembers.mockTeamMembers] }
      }).as('getTeamMembers')

      cy.reload()
      cy.wait('@getCurrentUser')
      cy.wait('@getTeamMembers')

      // Current user should not be able to remove themselves
      cy.getByTestId('member-menu-current-user-id').click()
      cy.getByTestId('remove-member-button').should('not.exist')
    })
  })

  describe('Team Activity and Audit Log', () => {
    it('should display team activity log', () => {
      // Mock activity log
      cy.intercept('GET', '**/api/team/activity', {
        statusCode: 200,
        body: {
          activities: [
            {
              id: 'activity-1',
              type: 'member_invited',
              actor: 'admin@example.com',
              target: 'newuser@example.com',
              timestamp: '2024-01-15T10:30:00Z'
            },
            {
              id: 'activity-2',
              type: 'role_changed',
              actor: 'admin@example.com',
              target: 'member@example.com',
              details: 'Changed from member to admin',
              timestamp: '2024-01-14T15:20:00Z'
            }
          ]
        }
      }).as('getTeamActivity')

      cy.getByTestId('team-activity-tab').click()
      cy.wait('@getTeamActivity')

      // Should show activity log
      cy.getByTestId('team-activity-log').should('be.visible')
      cy.getByTestId('activity-member_invited').should('contain', 'invited')
      cy.getByTestId('activity-role_changed').should('contain', 'role changed')
    })

    it('should filter activity by type', () => {
      cy.intercept('GET', '**/api/team/activity', {
        statusCode: 200,
        body: { activities: [] }
      }).as('getFilteredActivity')

      cy.getByTestId('team-activity-tab').click()
      
      // Filter by invitation activities
      cy.getByTestId('activity-filter-type').select('invitations')
      cy.wait('@getFilteredActivity')

      // Should apply filter
      cy.getByTestId('activity-filter-type').should('have.value', 'invitations')
    })

    it('should show activity details', () => {
      cy.intercept('GET', '**/api/team/activity', {
        statusCode: 200,
        body: {
          activities: [{
            id: 'activity-1',
            type: 'member_invited',
            actor: 'admin@example.com',
            target: 'newuser@example.com',
            timestamp: '2024-01-15T10:30:00Z',
            details: 'Invited as admin role'
          }]
        }
      }).as('getTeamActivity')

      cy.getByTestId('team-activity-tab').click()
      cy.wait('@getTeamActivity')

      // Click on activity item
      cy.getByTestId('activity-item-activity-1').click()

      // Should show activity details
      cy.getByTestId('activity-details-modal').should('be.visible')
      cy.getByTestId('activity-actor').should('contain', 'admin@example.com')
      cy.getByTestId('activity-target').should('contain', 'newuser@example.com')
    })
  })

  describe('Team Settings', () => {
    it('should display team settings', () => {
      cy.getByTestId('team-settings-tab').click()

      // Should show team settings
      cy.getByTestId('team-settings-panel').should('be.visible')
      cy.getByTestId('default-role-setting').should('be.visible')
      cy.getByTestId('invitation-expiry-setting').should('be.visible')
    })

    it('should update default member role', () => {
      // Mock settings update API
      cy.intercept('PUT', '**/api/team/settings', {
        statusCode: 200,
        body: { success: true }
      }).as('updateTeamSettings')

      cy.getByTestId('team-settings-tab').click()
      
      // Change default role
      cy.getByTestId('default-role-select').select('admin')
      cy.getByTestId('save-team-settings').click()

      cy.wait('@updateTeamSettings')

      // Should show success message
      cy.get('[role="alert"]').should('contain.text', 'updated')
    })

    it('should configure invitation expiry', () => {
      cy.getByTestId('team-settings-tab').click()
      
      // Set invitation expiry
      cy.getByTestId('invitation-expiry-input').clear().type('7')
      cy.getByTestId('save-team-settings').click()

      // Should save setting
      cy.getByTestId('invitation-expiry-input').should('have.value', '7')
    })
  })

  describe('Bulk Team Operations', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: teamMembers.mockTeamMembers }
      }).as('getTeamMembers')
      
      cy.reload()
      cy.wait('@getTeamMembers')
    })

    it('should select multiple team members', () => {
      // Select members
      cy.getByTestId('select-member-member-2').click()
      cy.getByTestId('select-member-member-3').click()

      // Should show bulk actions toolbar
      cy.getByTestId('bulk-actions-toolbar').should('be.visible')
      cy.getByTestId('selected-members-count').should('contain', '2')
    })

    it('should bulk remove members', () => {
      // Mock bulk remove API
      cy.intercept('DELETE', '**/api/team/bulk-remove', {
        statusCode: 200,
        body: { success: true }
      }).as('bulkRemoveMembers')

      // Select members
      cy.getByTestId('select-member-member-2').click()
      cy.getByTestId('select-member-member-3').click()

      // Perform bulk removal
      cy.getByTestId('bulk-remove-button').click()
      cy.getByTestId('confirm-bulk-remove').click()

      cy.wait('@bulkRemoveMembers')

      // Should remove selected members
      cy.getByTestId('member-card-member-2').should('not.exist')
      cy.getByTestId('member-card-member-3').should('not.exist')
    })

    it('should select all team members', () => {
      cy.getByTestId('select-all-members').click()

      // Should select all visible members (excluding owner)
      cy.getByTestId('select-member-member-2').should('be.checked')
      cy.getByTestId('select-member-member-3').should('be.checked')
    })
  })
})

// Page Object Model for Dashboard
export class DashboardPage {
  visit() {
    cy.visit('/dashboard')
    cy.waitForPageLoad()
    return this
  }

  // Navigation methods
  navigateToCampaigns() {
    cy.getByTestId('nav-campaigns').click()
    cy.url().should('include', '/campaigns')
    cy.waitForPageLoad()
    return new CampaignsPage()
  }

  navigateToAccounts() {
    cy.getByTestId('nav-accounts').click()
    cy.url().should('include', '/accounts')
    cy.waitForPageLoad()
    return new AccountsPage()
  }

  navigateToTeam() {
    cy.getByTestId('nav-team').click()
    cy.url().should('include', '/team')
    cy.waitForPageLoad()
    return new TeamPage()
  }

  navigateToDemo() {
    cy.getByTestId('nav-demo').click()
    cy.url().should('include', '/demo')
    cy.waitForPageLoad()
    return new DemoPage()
  }

  navigateToSettings() {
    cy.getByTestId('nav-settings').click()
    cy.url().should('include', '/settings')
    cy.waitForPageLoad()
    return new SettingsPage()
  }

  // Widget methods
  getTotalCampaigns() {
    return cy.getByTestId('total-campaigns-widget').invoke('text')
  }

  getActiveAccounts() {
    return cy.getByTestId('active-accounts-widget').invoke('text')
  }

  getDeliveryRate() {
    return cy.getByTestId('delivery-rate-widget').invoke('text')
  }

  getWarmupScore() {
    return cy.getByTestId('warmup-score-widget').invoke('text')
  }

  // Quick actions
  quickCreateCampaign() {
    cy.getByTestId('quick-create-campaign').click()
    return new CampaignsPage()
  }

  quickAddAccount() {
    cy.getByTestId('quick-add-account').click()
    return new AccountsPage()
  }

  quickInviteMember() {
    cy.getByTestId('quick-invite-member').click()
    return new TeamPage()
  }

  // Recent activity
  getRecentActivities() {
    return cy.getByTestId('recent-activity-widget').find('[data-testid^="activity-"]')
  }

  verifyRecentActivity(activityType: string, shouldExist: boolean = true) {
    const assertion = shouldExist ? 'exist' : 'not.exist'
    cy.getByTestId(`activity-${activityType}`).should(assertion)
    return this
  }
}

export class CampaignsPage {
  visit() {
    cy.visit('/dashboard/campaigns')
    cy.waitForPageLoad()
    return this
  }

  createCampaign(name: string, options: any = {}) {
    cy.createCampaign(name, options)
    return this
  }

  getCampaignCard(campaignId: string) {
    return cy.getByTestId(`campaign-card-${campaignId}`)
  }

  pauseCampaign(campaignId: string) {
    cy.getByTestId(`campaign-menu-${campaignId}`).click()
    cy.getByTestId('pause-campaign-button').click()
    return this
  }

  resumeCampaign(campaignId: string) {
    cy.getByTestId(`campaign-menu-${campaignId}`).click()
    cy.getByTestId('resume-campaign-button').click()
    return this
  }

  editCampaign(campaignId: string, updates: any) {
    cy.getByTestId(`campaign-menu-${campaignId}`).click()
    cy.getByTestId('edit-campaign-button').click()
    
    if (updates.emailsPerDay) {
      cy.getByTestId('emails-per-day-input').clear().type(updates.emailsPerDay.toString())
    }
    
    if (updates.duration) {
      cy.getByTestId('campaign-duration-input').clear().type(updates.duration.toString())
    }
    
    cy.getByTestId('save-campaign-button').click()
    return this
  }

  deleteCampaign(campaignId: string) {
    cy.getByTestId(`campaign-menu-${campaignId}`).click()
    cy.getByTestId('delete-campaign-button').click()
    cy.getByTestId('confirm-delete-button').click()
    return this
  }

  filterByStatus(status: string) {
    cy.getByTestId('campaign-filter-status').select(status)
    return this
  }

  sortBy(criteria: string) {
    cy.getByTestId('campaign-sort-select').select(criteria)
    return this
  }

  searchCampaigns(query: string) {
    cy.getByTestId('campaign-search-input').type(query)
    return this
  }

  verifyCampaignExists(campaignName: string) {
    cy.getByTestId('campaigns-list').should('contain', campaignName)
    return this
  }

  verifyCampaignNotExists(campaignName: string) {
    cy.getByTestId('campaigns-list').should('not.contain', campaignName)
    return this
  }

  verifyEmptyState() {
    cy.getByTestId('empty-campaigns-state').should('be.visible')
    return this
  }
}

export class AccountsPage {
  visit() {
    cy.visit('/dashboard/accounts')
    cy.waitForPageLoad()
    return this
  }

  addEmailAccount(email: string) {
    cy.addEmailAccount(email)
    return this
  }

  getAccountCard(accountId: string) {
    return cy.getByTestId(`account-card-${accountId}`)
  }

  syncAccount(accountId: string) {
    cy.getByTestId(`account-menu-${accountId}`).click()
    cy.getByTestId('sync-account-button').click()
    return this
  }

  removeAccount(accountId: string) {
    cy.getByTestId(`account-menu-${accountId}`).click()
    cy.getByTestId('remove-account-button').click()
    cy.getByTestId('confirm-remove-button').click()
    return this
  }

  verifyAccountExists(email: string) {
    cy.getByTestId('email-accounts-list').should('contain', email)
    return this
  }

  verifyAccountStatus(accountId: string, status: string) {
    cy.getByTestId(`account-status-${accountId}`).should('contain', status)
    return this
  }

  verifyEmptyState() {
    cy.getByTestId('empty-accounts-state').should('be.visible')
    return this
  }
}

export class TeamPage {
  visit() {
    cy.visit('/dashboard/team')
    cy.waitForPageLoad()
    return this
  }

  inviteTeamMember(email: string, role: string = 'member') {
    cy.inviteTeamMember(email, role)
    return this
  }

  getMemberCard(memberId: string) {
    return cy.getByTestId(`member-card-${memberId}`)
  }

  changeRole(memberId: string, newRole: string) {
    cy.getByTestId(`member-menu-${memberId}`).click()
    cy.getByTestId('change-role-button').click()
    cy.getByTestId('new-role-select').select(newRole)
    cy.getByTestId('confirm-role-change').click()
    return this
  }

  removeMember(memberId: string) {
    cy.getByTestId(`member-menu-${memberId}`).click()
    cy.getByTestId('remove-member-button').click()
    cy.getByTestId('confirm-remove-member-button').click()
    return this
  }

  resendInvite(memberId: string) {
    cy.getByTestId(`member-menu-${memberId}`).click()
    cy.getByTestId('resend-invite-button').click()
    return this
  }

  verifyMemberExists(email: string) {
    cy.getByTestId('team-members-list').should('contain', email)
    return this
  }

  verifyMemberRole(memberId: string, role: string) {
    cy.getByTestId(`member-role-${memberId}`).should('contain', role)
    return this
  }

  verifyEmptyState() {
    cy.getByTestId('empty-team-state').should('be.visible')
    return this
  }
}

export class DemoPage {
  visit() {
    cy.visit('/dashboard/demo')
    cy.waitForPageLoad()
    return this
  }

  startDemo() {
    cy.runDemo()
    return this
  }

  pauseDemo() {
    cy.getByTestId('pause-demo-button').click()
    return this
  }

  resumeDemo() {
    cy.getByTestId('resume-demo-button').click()
    return this
  }

  stopDemo() {
    cy.getByTestId('stop-demo-button').click()
    cy.getByTestId('confirm-stop-button').click()
    return this
  }

  verifyDemoStatus(status: string) {
    cy.getByTestId('demo-status').should('contain', status)
    return this
  }

  verifyMetrics() {
    cy.getByTestId('demo-metrics').should('be.visible')
    return this
  }

  verifyTimeline() {
    cy.getByTestId('demo-timeline-chart').should('be.visible')
    return this
  }

  exportResults() {
    cy.getByTestId('export-demo-button').click()
    return this
  }
}

export class SettingsPage {
  visit() {
    cy.visit('/dashboard/settings')
    cy.waitForPageLoad()
    return this
  }

  updateTenantName(newName: string) {
    cy.getByTestId('edit-tenant-button').click()
    cy.getByTestId('tenant-name-input').clear().type(newName)
    cy.getByTestId('save-tenant-button').click()
    return this
  }

  deleteTenant() {
    cy.getByTestId('delete-tenant-button').click()
    cy.getByTestId('confirm-delete-button').click()
    return this
  }

  exportAllData() {
    cy.getByTestId('export-all-data-button').click()
    cy.getByTestId('confirm-export-button').click()
    return this
  }

  importData(filePath: string) {
    cy.getByTestId('import-data-button').click()
    cy.getByTestId('import-file-input').selectFile(filePath)
    cy.getByTestId('confirm-import-button').click()
    return this
  }

  verifyTenantInfo(info: any) {
    if (info.name) {
      cy.getByTestId('tenant-name-display').should('contain', info.name)
    }
    return this
  }
}

// EmailWarmup Pro - Application JavaScript with Data Persistence

// Data Persistence Manager
const DataPersistence = {
  STORAGE_KEY: 'emailwarmup_pro_data',
  
  // Save application data to localStorage
  saveAppData() {
    try {
      const dataToSave = {
        emailAccounts: appData.emailAccounts,
        campaigns: appData.campaigns,
        settings: appData.settings,
        user: appData.user,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      this.updateSaveStatus('saved');
      console.log('Data saved to localStorage:', dataToSave);
      return true;
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      this.updateSaveStatus('error');
      this.handleStorageError('Failed to save data');
      return false;
    }
  },
  
  // Load application data from localStorage
  loadAppData() {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Merge saved data with default data
        if (parsedData.emailAccounts) appData.emailAccounts = parsedData.emailAccounts;
        if (parsedData.campaigns) appData.campaigns = parsedData.campaigns;
        if (parsedData.settings) appData.settings = parsedData.settings;
        if (parsedData.user) appData.user = parsedData.user;
        
        console.log('Data loaded from localStorage:', parsedData);
        showToast('Data restored from previous session', 'success', 3000);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      this.handleStorageError('Failed to load saved data');
      return false;
    }
  },
  
  // Enable auto-save functionality
  enableAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
      this.saveAppData();
    }, 30000);
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveAppData();
    });
    
    console.log('Auto-save enabled: every 30 seconds and on page unload');
  },
  
  // Update save status indicator
  updateSaveStatus(status) {
    const indicator = document.getElementById('save-indicator');
    const text = document.getElementById('save-text');
    
    if (indicator && text) {
      indicator.className = `save-indicator ${status}`;
      
      switch (status) {
        case 'saved':
          text.textContent = 'Saved';
          break;
        case 'saving':
          text.textContent = 'Saving...';
          break;
        case 'error':
          text.textContent = 'Save Error';
          break;
        default:
          text.textContent = 'Unknown';
      }
    }
  },
  
  // Handle storage errors gracefully
  handleStorageError(message) {
    showToast(message + ' - Data will not persist', 'error', 5000);
    this.showStorageErrorBanner();
  },
  
  // Show storage error banner
  showStorageErrorBanner() {
    let banner = document.querySelector('.storage-error-banner');
    if (banner) return; // Already shown
    
    banner = document.createElement('div');
    banner.className = 'storage-error-banner';
    banner.innerHTML = `
      <strong>⚠️ Storage Unavailable:</strong> Your data will not be saved across browser sessions. 
      Please check your browser settings or try refreshing the page.
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.insertBefore(banner, mainContent.firstChild);
    }
  },
  
  // Test if localStorage is available
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Application Data with defaults
const appData = {
  "user": {
    "id": 1,
    "name": "John Smith",
    "email": "john@company.com",
    "plan": "Professional",
    "created_at": "2024-01-15"
  },
  "emailAccounts": [
    {
      "id": 1,
      "email": "sales@company.com",
      "provider": "Gmail",
      "status": "active",
      "connected_at": "2024-11-01",
      "last_activity": "2025-01-05",
      "warmup_progress": 85,
      "daily_volume": 45,
      "deliverability_rate": 96
    },
    {
      "id": 2,
      "email": "support@company.com", 
      "provider": "Outlook",
      "status": "active",
      "connected_at": "2024-11-15",
      "last_activity": "2025-01-05",
      "warmup_progress": 72,
      "daily_volume": 32,
      "deliverability_rate": 94
    },
    {
      "id": 3,
      "email": "marketing@company.com",
      "provider": "SMTP",
      "status": "warning",
      "connected_at": "2024-12-01",
      "last_activity": "2025-01-04",
      "warmup_progress": 43,
      "daily_volume": 18,
      "deliverability_rate": 89
    }
  ],
  "campaigns": [
    {
      "id": 1,
      "name": "Sales Team Warmup",
      "email_account_id": 1,
      "email": "sales@company.com",
      "status": "active",
      "strategy": "Gradual",
      "start_date": "2024-11-01",
      "progress": 85,
      "current_volume": 45,
      "target_volume": 100,
      "days_running": 65,
      "created_at": "2024-11-01",
      "last_modified": "2024-12-15"
    },
    {
      "id": 2,
      "name": "Support Warmup Campaign",
      "email_account_id": 2,
      "email": "support@company.com",
      "status": "active", 
      "strategy": "Conservative",
      "start_date": "2024-11-15",
      "progress": 72,
      "current_volume": 32,
      "target_volume": 80,
      "days_running": 51,
      "created_at": "2024-11-15",
      "last_modified": "2024-12-20"
    },
    {
      "id": 3,
      "name": "Marketing Outreach Prep",
      "email_account_id": 3,
      "email": "marketing@company.com",
      "status": "paused",
      "strategy": "Aggressive",
      "start_date": "2024-12-01",
      "progress": 43,
      "current_volume": 18,
      "target_volume": 150,
      "days_running": 35,
      "created_at": "2024-12-01",
      "last_modified": "2024-12-25"
    }
  ],
  "analytics": {
    "overview": {
      "total_accounts": 3,
      "active_campaigns": 2,
      "emails_sent_today": 95,
      "avg_deliverability": 93
    },
    "daily_metrics": [
      {"date": "2025-01-01", "emails_sent": 89, "delivered": 85, "bounced": 2, "complained": 1},
      {"date": "2025-01-02", "emails_sent": 92, "delivered": 88, "bounced": 3, "complained": 1},
      {"date": "2025-01-03", "emails_sent": 94, "delivered": 90, "bounced": 2, "complained": 2},
      {"date": "2025-01-04", "emails_sent": 91, "delivered": 86, "bounced": 4, "complained": 1},
      {"date": "2025-01-05", "emails_sent": 95, "delivered": 91, "bounced": 2, "complained": 2}
    ],
    "deliverability_trends": [
      {"week": "Week 1", "rate": 88},
      {"week": "Week 2", "rate": 91},
      {"week": "Week 3", "rate": 93},
      {"week": "Week 4", "rate": 94},
      {"week": "Week 5", "rate": 96}
    ]
  },
  "notifications": [
    {
      "id": 1,
      "type": "warning",
      "title": "Low Deliverability Alert",
      "message": "marketing@company.com deliverability dropped to 89%",
      "timestamp": "2025-01-05 09:30"
    },
    {
      "id": 2,
      "type": "success", 
      "title": "Campaign Milestone",
      "message": "Sales Team Warmup reached 85% completion",
      "timestamp": "2025-01-04 14:15"
    },
    {
      "id": 3,
      "type": "info",
      "title": "Weekly Report Ready",
      "message": "Your weekly warmup report is now available",
      "timestamp": "2025-01-03 08:00"
    }
  ],
  "settings": {
    "notifications": {
      "email_alerts": true,
      "dashboard_notifications": true,
      "weekly_reports": true
    },
    "defaults": {
      "warmup_strategy": "Gradual",
      "start_volume": 5,
      "target_volume": 100,
      "ramp_duration": 30
    }
  }
};

// Chart instances
let deliverabilityChart;
let volumeChart;

// Current editing campaign ID
let currentEditingCampaignId = null;

// Initialize application
function initializeApp() {
  console.log('EmailWarmup Pro initializing...');
  
  try {
    // Check if localStorage is available
    if (!DataPersistence.isStorageAvailable()) {
      console.warn('localStorage is not available');
      DataPersistence.handleStorageError('Browser storage is not available');
    } else {
      // Load saved data first
      DataPersistence.loadAppData();
      // Enable auto-save
      DataPersistence.enableAutoSave();
    }
    
    // Initialize save status
    DataPersistence.updateSaveStatus('saved');
    
    // Initialize UI components
    initializeNavigation();
    populateDashboard();
    populateAccountsTable();
    populateCampaignsTable();
    initializeProviderSelect();
    setupEventListeners();
    refreshAccountDropdowns();
    loadSettingsFromData();
    
    // Set up global functions for onclick handlers
    setupGlobalFunctions();
    
    console.log('EmailWarmup Pro initialized successfully');
  } catch (error) {
    console.error('Error initializing EmailWarmup Pro:', error);
    showToast('Error initializing application', 'error');
  }
}

// Set up global functions for onclick handlers
function setupGlobalFunctions() {
  // Make functions globally available for onclick handlers
  window.showView = showView;
  window.showAddAccountModal = showAddAccountModal;
  window.showCreateCampaignModal = showCreateCampaignModal;
  window.showEditCampaignModal = showEditCampaignModal;
  window.hideModal = hideModal;
  window.addEmailAccount = addEmailAccount;
  window.editAccount = editAccount;
  window.pauseAccount = pauseAccount;
  window.removeAccount = removeAccount;
  window.createCampaign = createCampaign;
  window.toggleCampaign = toggleCampaign;
  window.editCampaign = editCampaign;
  window.saveCampaignEdit = saveCampaignEdit;
  window.cloneCampaign = cloneCampaign;
  window.exportReport = exportReport;
  window.saveSettings = saveSettings;
  window.resetSettings = resetSettings;
}

// Load settings from data into form elements
function loadSettingsFromData() {
  try {
    // Load user settings
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    
    if (userNameEl) userNameEl.value = appData.user.name;
    if (userEmailEl) userEmailEl.value = appData.user.email;
    
    // Load notification preferences
    const emailAlertsEl = document.getElementById('email-alerts');
    const dashboardNotificationsEl = document.getElementById('dashboard-notifications');
    const weeklyReportsEl = document.getElementById('weekly-reports');
    
    if (emailAlertsEl) emailAlertsEl.checked = appData.settings.notifications.email_alerts;
    if (dashboardNotificationsEl) dashboardNotificationsEl.checked = appData.settings.notifications.dashboard_notifications;
    if (weeklyReportsEl) weeklyReportsEl.checked = appData.settings.notifications.weekly_reports;
    
    // Load default settings
    const defaultStrategyEl = document.getElementById('default-strategy');
    const defaultStartVolumeEl = document.getElementById('default-start-volume');
    const defaultTargetVolumeEl = document.getElementById('default-target-volume');
    const defaultRampDurationEl = document.getElementById('default-ramp-duration');
    
    if (defaultStrategyEl) defaultStrategyEl.value = appData.settings.defaults.warmup_strategy.toLowerCase();
    if (defaultStartVolumeEl) defaultStartVolumeEl.value = appData.settings.defaults.start_volume;
    if (defaultTargetVolumeEl) defaultTargetVolumeEl.value = appData.settings.defaults.target_volume;
    if (defaultRampDurationEl) defaultRampDurationEl.value = appData.settings.defaults.ramp_duration;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Auto-save helper function
function autoSave() {
  DataPersistence.updateSaveStatus('saving');
  setTimeout(() => {
    DataPersistence.saveAppData();
  }, 100);
}

// Navigation Management
function initializeNavigation() {
  console.log('Initializing navigation...');
  
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.removeEventListener('click', handleNavClick);
    link.addEventListener('click', handleNavClick);
  });
  
  console.log('Navigation initialized with', navLinks.length, 'links');
}

function handleNavClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const viewName = this.getAttribute('data-view');
  console.log('Navigation clicked:', viewName);
  
  if (viewName) {
    showView(viewName);
    
    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(nl => nl.classList.remove('active'));
    this.classList.add('active');
  }
}

function showView(viewName) {
  console.log('Showing view:', viewName);
  
  try {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
      view.classList.remove('active');
      view.style.display = 'none';
    });
    
    // Show selected view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
      targetView.classList.add('active');
      targetView.style.display = 'block';
      console.log('View shown:', viewName);
      
      // Refresh dropdowns when entering campaigns view
      if (viewName === 'campaigns') {
        refreshAccountDropdowns();
      }
      
      // Initialize charts when analytics view is shown
      if (viewName === 'analytics') {
        setTimeout(initializeCharts, 100);
      }
    } else {
      console.error('View not found:', `${viewName}-view`);
    }
  } catch (error) {
    console.error('Error showing view:', error);
  }
}

// Account dropdown management
function refreshAccountDropdowns() {
  console.log('Refreshing account dropdowns...');
  
  try {
    // Update the main campaign email account dropdown
    const campaignAccountSelect = document.getElementById('campaign-email-account');
    if (campaignAccountSelect) {
      const currentValue = campaignAccountSelect.value;
      campaignAccountSelect.innerHTML = '<option value="">Select an email account...</option>';
      
      appData.emailAccounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.email;
        campaignAccountSelect.appendChild(option);
      });
      
      if (currentValue && appData.emailAccounts.find(a => a.id.toString() === currentValue)) {
        campaignAccountSelect.value = currentValue;
      }
    }
    
    // Update edit campaign dropdown
    const editCampaignAccountSelect = document.getElementById('edit-campaign-email-account');
    if (editCampaignAccountSelect) {
      const currentValue = editCampaignAccountSelect.value;
      editCampaignAccountSelect.innerHTML = '<option value="">Select an email account...</option>';
      
      appData.emailAccounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.email;
        editCampaignAccountSelect.appendChild(option);
      });
      
      if (currentValue && appData.emailAccounts.find(a => a.id.toString() === currentValue)) {
        editCampaignAccountSelect.value = currentValue;
      }
    }
    
    updateAccountSelectors();
    console.log('Account dropdowns refreshed');
  } catch (error) {
    console.error('Error refreshing account dropdowns:', error);
  }
}

function updateAccountSelectors() {
  const accountSelectors = document.querySelectorAll('.account-selector');
  
  accountSelectors.forEach(selector => {
    if (selector.id === 'campaign-email-account' || selector.id === 'edit-campaign-email-account') return;
    
    const currentValue = selector.value;
    const isMultiple = selector.hasAttribute('multiple');
    
    if (selector.closest('.form-group')) {
      const label = selector.closest('.form-group').querySelector('.form-label');
      if (label && label.textContent.toLowerCase().includes('account')) {
        selector.innerHTML = '';
        
        if (!isMultiple) {
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = 'Select an email account...';
          selector.appendChild(defaultOption);
        }
        
        appData.emailAccounts.forEach(account => {
          const option = document.createElement('option');
          option.value = account.id;
          option.textContent = account.email;
          selector.appendChild(option);
        });
        
        if (currentValue && appData.emailAccounts.find(a => a.id.toString() === currentValue)) {
          selector.value = currentValue;
        }
      }
    }
  });
}

// Dashboard Population
function populateDashboard() {
  updateOverviewCards();
  
  // Populate recent activity
  const activityList = document.getElementById('activity-list');
  if (activityList) {
    activityList.innerHTML = appData.notifications.map(notification => `
      <div class="activity-item">
        <h4>${notification.title}</h4>
        <p>${notification.message}</p>
        <span class="activity-time">${formatTimestamp(notification.timestamp)}</span>
      </div>
    `).join('');
  }
  
  // Populate account status
  const statusList = document.getElementById('account-status-list');
  if (statusList) {
    statusList.innerHTML = appData.emailAccounts.map(account => `
      <div class="status-item">
        <div class="status-indicator">
          <span class="status-dot ${getStatusColor(account.status)}"></span>
          <div>
            <h4>${account.email}</h4>
            <p>${account.provider} • ${account.deliverability_rate}% deliverability</p>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function updateOverviewCards() {
  const totalAccountsEl = document.getElementById('total-accounts');
  const activeCampaignsEl = document.getElementById('active-campaigns');
  const emailsTodayEl = document.getElementById('emails-today');
  const avgDeliverabilityEl = document.getElementById('avg-deliverability');
  
  if (totalAccountsEl) totalAccountsEl.textContent = appData.emailAccounts.length;
  if (activeCampaignsEl) activeCampaignsEl.textContent = appData.campaigns.filter(c => c.status === 'active').length;
  if (emailsTodayEl) emailsTodayEl.textContent = appData.analytics.overview.emails_sent_today;
  if (avgDeliverabilityEl) avgDeliverabilityEl.textContent = appData.analytics.overview.avg_deliverability + '%';
}

// Accounts Table Population
function populateAccountsTable() {
  const tableBody = document.getElementById('accounts-table-body');
  if (tableBody) {
    tableBody.innerHTML = appData.emailAccounts.map(account => `
      <tr>
        <td>${account.email}</td>
        <td>
          <span class="provider-badge">
            ${getProviderIcon(account.provider)} ${account.provider}
          </span>
        </td>
        <td>
          <span class="status status--${getStatusType(account.status)}">${formatStatus(account.status)}</span>
        </td>
        <td>${formatDate(account.last_activity)}</td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${account.warmup_progress}%"></div>
          </div>
          <small>${account.warmup_progress}%</small>
        </td>
        <td>${account.daily_volume} emails/day</td>
        <td>${account.deliverability_rate}%</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn--xs btn--outline" onclick="editAccount(${account.id})">Edit</button>
            <button class="btn btn--xs btn--secondary" onclick="pauseAccount(${account.id})">${account.status === 'active' ? 'Pause' : 'Resume'}</button>
            <button class="btn btn--xs btn--outline" onclick="removeAccount(${account.id})">Remove</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

// Campaigns Table Population
function populateCampaignsTable() {
  const tableBody = document.getElementById('campaigns-table-body');
  if (tableBody) {
    tableBody.innerHTML = appData.campaigns.map(campaign => `
      <tr>
        <td>${campaign.name}</td>
        <td>${campaign.email}</td>
        <td>
          <span class="status status--${getStatusType(campaign.status)}">${formatStatus(campaign.status)}</span>
        </td>
        <td>${campaign.strategy}</td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${campaign.progress}%"></div>
          </div>
          <small>${campaign.progress}%</small>
        </td>
        <td>${campaign.current_volume}</td>
        <td>${campaign.target_volume}</td>
        <td>${campaign.days_running} days</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn--xs btn--primary" onclick="toggleCampaign(${campaign.id})">${campaign.status === 'active' ? 'Pause' : campaign.status === 'paused' ? 'Resume' : 'Start'}</button>
            <button class="btn btn--xs btn--outline" onclick="editCampaign(${campaign.id})">Edit</button>
            <button class="btn btn--xs btn--secondary" onclick="cloneCampaign(${campaign.id})">Clone</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

// Chart Initialization
function initializeCharts() {
  initializeDeliverabilityChart();
  initializeVolumeChart();
}

function initializeDeliverabilityChart() {
  const ctx = document.getElementById('deliverability-chart');
  if (!ctx) return;
  
  if (deliverabilityChart) deliverabilityChart.destroy();
  
  deliverabilityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: appData.analytics.deliverability_trends.map(d => d.week),
      datasets: [{
        label: 'Deliverability Rate (%)',
        data: appData.analytics.deliverability_trends.map(d => d.rate),
        borderColor: '#1FB8CD',
        backgroundColor: 'rgba(31, 184, 205, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 80,
          max: 100
        }
      }
    }
  });
}

function initializeVolumeChart() {
  const ctx = document.getElementById('volume-chart');
  if (!ctx) return;
  
  if (volumeChart) volumeChart.destroy();
  
  volumeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: appData.analytics.daily_metrics.map(d => formatDate(d.date)),
      datasets: [{
        label: 'Emails Sent',
        data: appData.analytics.daily_metrics.map(d => d.emails_sent),
        backgroundColor: '#FFC185',
        borderColor: '#B4413C',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Modal Management
function showModal(modalId) {
  console.log('Showing modal:', modalId);
  
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    console.log('Modal shown:', modalId);
  } else {
    console.error('Modal not found:', modalId);
  }
}

function hideModal(modalId) {
  console.log('Hiding modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function showAddAccountModal() {
  console.log('showAddAccountModal called');
  showModal('add-account-modal');
}

function showCreateCampaignModal() {
  console.log('showCreateCampaignModal called');
  refreshAccountDropdowns();
  showModal('create-campaign-modal');
}

function showEditCampaignModal(campaignId) {
  console.log('showEditCampaignModal called for campaign:', campaignId);
  
  const campaign = appData.campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    showToast('Campaign not found', 'error');
    return;
  }
  
  currentEditingCampaignId = campaignId;
  
  // Populate form with campaign data
  const nameInput = document.getElementById('edit-campaign-name');
  const accountSelect = document.getElementById('edit-campaign-email-account');
  const strategySelect = document.getElementById('edit-campaign-strategy');
  const targetVolumeInput = document.getElementById('edit-target-volume');
  const statusSelect = document.getElementById('edit-campaign-status');
  
  if (nameInput) nameInput.value = campaign.name;
  if (targetVolumeInput) targetVolumeInput.value = campaign.target_volume;
  if (strategySelect) strategySelect.value = campaign.strategy.toLowerCase();
  if (statusSelect) statusSelect.value = campaign.status;
  
  // Refresh dropdowns and set account
  refreshAccountDropdowns();
  
  setTimeout(() => {
    if (accountSelect) accountSelect.value = campaign.email_account_id;
  }, 100);
  
  showModal('edit-campaign-modal');
}

// Provider Select Handler
function initializeProviderSelect() {
  const providerSelect = document.getElementById('provider-select');
  if (providerSelect) {
    providerSelect.addEventListener('change', function() {
      const smtpSettings = document.getElementById('smtp-settings');
      if (smtpSettings) {
        if (this.value === 'smtp') {
          smtpSettings.classList.remove('hidden');
        } else {
          smtpSettings.classList.add('hidden');
        }
      }
    });
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Close modals when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      const modalId = e.target.id;
      hideModal(modalId);
    }
  });
  
  // Handle form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
    });
  });
}

// Email Account Management
function addEmailAccount() {
  console.log('addEmailAccount called');
  
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const providerSelect = document.getElementById('provider-select');
  
  if (!emailInput || !passwordInput || !providerSelect) {
    showToast('Form elements not found', 'error');
    return;
  }
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const provider = providerSelect.value;
  
  if (!email || !password) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  if (appData.emailAccounts.find(a => a.email === email)) {
    showToast('This email account is already connected', 'error');
    return;
  }
  
  showToast('Connecting email account...', 'info', 2000);
  
  setTimeout(() => {
    const newAccount = {
      id: Math.max(...appData.emailAccounts.map(a => a.id)) + 1,
      email: email,
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
      status: 'active',
      connected_at: new Date().toISOString().split('T')[0],
      last_activity: new Date().toISOString().split('T')[0],
      warmup_progress: 0,
      daily_volume: 0,
      deliverability_rate: 85
    };
    
    appData.emailAccounts.push(newAccount);
    
    refreshAccountDropdowns();
    populateAccountsTable();
    updateOverviewCards();
    autoSave();
    
    hideModal('add-account-modal');
    showToast('Email account connected successfully!', 'success');
    
    // Clear form
    emailInput.value = '';
    passwordInput.value = '';
    providerSelect.value = 'gmail';
    
    console.log('New account added and data saved');
  }, 1500);
}

function editAccount(accountId) {
  showToast('Edit account functionality would open edit modal', 'info');
}

function pauseAccount(accountId) {
  const account = appData.emailAccounts.find(a => a.id === accountId);
  if (account) {
    account.status = account.status === 'active' ? 'paused' : 'active';
    populateAccountsTable();
    updateOverviewCards();
    autoSave();
    showToast(`Account ${account.status === 'active' ? 'resumed' : 'paused'} successfully`, 'success');
  }
}

function removeAccount(accountId) {
  if (confirm('Are you sure you want to remove this account? This will also remove any associated campaigns.')) {
    // Remove associated campaigns first
    appData.campaigns = appData.campaigns.filter(c => c.email_account_id !== accountId);
    
    // Remove the account
    appData.emailAccounts = appData.emailAccounts.filter(a => a.id !== accountId);
    
    refreshAccountDropdowns();
    populateAccountsTable();
    populateCampaignsTable();
    updateOverviewCards();
    autoSave();
    showToast('Account and associated campaigns removed successfully', 'success');
  }
}

// Campaign Management Functions
function createCampaign() {
  console.log('createCampaign called');
  
  const nameInput = document.getElementById('campaign-name');
  const accountSelect = document.getElementById('campaign-email-account');
  const strategySelect = document.getElementById('campaign-strategy');
  const targetVolumeInput = document.getElementById('target-volume');
  
  if (!nameInput || !accountSelect || !strategySelect || !targetVolumeInput) {
    showToast('Form elements not found', 'error');
    return;
  }
  
  const name = nameInput.value.trim();
  const accountId = parseInt(accountSelect.value);
  const strategy = strategySelect.value;
  const targetVolume = parseInt(targetVolumeInput.value);
  
  if (!name || !accountId || !strategy || !targetVolume) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  const account = appData.emailAccounts.find(a => a.id === accountId);
  if (!account) {
    showToast('Selected account not found', 'error');
    return;
  }
  
  showToast('Creating campaign...', 'info', 2000);
  
  setTimeout(() => {
    const newCampaign = {
      id: Math.max(...appData.campaigns.map(c => c.id)) + 1,
      name: name,
      email_account_id: accountId,
      email: account.email,
      status: 'active',
      strategy: strategy.charAt(0).toUpperCase() + strategy.slice(1),
      start_date: new Date().toISOString().split('T')[0],
      progress: 0,
      current_volume: 1,
      target_volume: targetVolume,
      days_running: 1,
      created_at: new Date().toISOString().split('T')[0],
      last_modified: new Date().toISOString().split('T')[0]
    };
    
    appData.campaigns.push(newCampaign);
    populateCampaignsTable();
    updateOverviewCards();
    autoSave();
    hideModal('create-campaign-modal');
    showToast('Campaign created successfully!', 'success');
    
    // Clear form
    nameInput.value = '';
    targetVolumeInput.value = '100';
    accountSelect.value = '';
    strategySelect.value = 'gradual';
  }, 1500);
}

function toggleCampaign(campaignId) {
  const campaign = appData.campaigns.find(c => c.id === campaignId);
  if (campaign) {
    if (campaign.status === 'active') {
      campaign.status = 'paused';
    } else {
      campaign.status = 'active';
    }
    campaign.last_modified = new Date().toISOString().split('T')[0];
    
    populateCampaignsTable();
    updateOverviewCards();
    autoSave();
    showToast(`Campaign ${campaign.status === 'active' ? 'resumed' : 'paused'} successfully`, 'success');
  }
}

function editCampaign(campaignId) {
  console.log('editCampaign called for campaign:', campaignId);
  showEditCampaignModal(campaignId);
}

function saveCampaignEdit() {
  console.log('saveCampaignEdit called');
  
  if (!currentEditingCampaignId) {
    showToast('No campaign selected for editing', 'error');
    return;
  }
  
  const campaign = appData.campaigns.find(c => c.id === currentEditingCampaignId);
  if (!campaign) {
    showToast('Campaign not found', 'error');
    return;
  }
  
  const nameInput = document.getElementById('edit-campaign-name');
  const accountSelect = document.getElementById('edit-campaign-email-account');
  const strategySelect = document.getElementById('edit-campaign-strategy');
  const targetVolumeInput = document.getElementById('edit-target-volume');
  const statusSelect = document.getElementById('edit-campaign-status');
  
  if (!nameInput || !accountSelect || !strategySelect || !targetVolumeInput || !statusSelect) {
    showToast('Form elements not found', 'error');
    return;
  }
  
  const name = nameInput.value.trim();
  const accountId = parseInt(accountSelect.value);
  const strategy = strategySelect.value;
  const targetVolume = parseInt(targetVolumeInput.value);
  const status = statusSelect.value;
  
  if (!name || !accountId || !strategy || !targetVolume) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  const account = appData.emailAccounts.find(a => a.id === accountId);
  if (!account) {
    showToast('Selected account not found', 'error');
    return;
  }
  
  showToast('Updating campaign...', 'info', 1500);
  
  setTimeout(() => {
    // Update campaign
    campaign.name = name;
    campaign.email_account_id = accountId;
    campaign.email = account.email;
    campaign.strategy = strategy.charAt(0).toUpperCase() + strategy.slice(1);
    campaign.target_volume = targetVolume;
    campaign.status = status;
    campaign.last_modified = new Date().toISOString().split('T')[0];
    
    populateCampaignsTable();
    updateOverviewCards();
    autoSave();
    hideModal('edit-campaign-modal');
    showToast('Campaign updated successfully!', 'success');
    
    currentEditingCampaignId = null;
  }, 1000);
}

function cloneCampaign(campaignId) {
  const campaign = appData.campaigns.find(c => c.id === campaignId);
  if (campaign) {
    const clonedCampaign = {
      ...campaign,
      id: Math.max(...appData.campaigns.map(c => c.id)) + 1,
      name: campaign.name + ' (Copy)',
      status: 'inactive',
      progress: 0,
      current_volume: 1,
      days_running: 0,
      start_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0],
      last_modified: new Date().toISOString().split('T')[0]
    };
    
    appData.campaigns.push(clonedCampaign);
    populateCampaignsTable();
    autoSave();
    showToast('Campaign cloned successfully!', 'success');
  }
}

// Settings Management
function saveSettings() {
  try {
    // Save user settings
    const userName = document.getElementById('user-name')?.value;
    const userEmail = document.getElementById('user-email')?.value;
    
    if (userName) appData.user.name = userName;
    if (userEmail) appData.user.email = userEmail;
    
    // Save notification preferences
    const emailAlerts = document.getElementById('email-alerts')?.checked;
    const dashboardNotifications = document.getElementById('dashboard-notifications')?.checked;
    const weeklyReports = document.getElementById('weekly-reports')?.checked;
    
    if (emailAlerts !== undefined) appData.settings.notifications.email_alerts = emailAlerts;
    if (dashboardNotifications !== undefined) appData.settings.notifications.dashboard_notifications = dashboardNotifications;
    if (weeklyReports !== undefined) appData.settings.notifications.weekly_reports = weeklyReports;
    
    // Save default settings
    const defaultStrategy = document.getElementById('default-strategy')?.value;
    const defaultStartVolume = document.getElementById('default-start-volume')?.value;
    const defaultTargetVolume = document.getElementById('default-target-volume')?.value;
    const defaultRampDuration = document.getElementById('default-ramp-duration')?.value;
    
    if (defaultStrategy) appData.settings.defaults.warmup_strategy = defaultStrategy.charAt(0).toUpperCase() + defaultStrategy.slice(1);
    if (defaultStartVolume) appData.settings.defaults.start_volume = parseInt(defaultStartVolume);
    if (defaultTargetVolume) appData.settings.defaults.target_volume = parseInt(defaultTargetVolume);
    if (defaultRampDuration) appData.settings.defaults.ramp_duration = parseInt(defaultRampDuration);
    
    autoSave();
    showToast('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings', 'error');
  }
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    // Reset to default values
    appData.settings = {
      "notifications": {
        "email_alerts": true,
        "dashboard_notifications": true,
        "weekly_reports": true
      },
      "defaults": {
        "warmup_strategy": "Gradual",
        "start_volume": 5,
        "target_volume": 100,
        "ramp_duration": 30
      }
    };
    
    loadSettingsFromData();
    autoSave();
    showToast('Settings reset to defaults', 'info');
  }
}

// Utility Functions
function getStatusColor(status) {
  const colors = {
    'active': 'green',
    'warning': 'yellow',
    'paused': 'yellow',
    'error': 'red',
    'inactive': 'red'
  };
  return colors[status] || 'gray';
}

function getStatusType(status) {
  const types = {
    'active': 'success',
    'warning': 'warning',
    'paused': 'warning',
    'error': 'error',
    'inactive': 'error'
  };
  return types[status] || 'info';
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getProviderIcon(provider) {
  const icons = {
    'Gmail': '📧',
    'Outlook': '📬',
    'Yahoo': '📮',
    'SMTP': '⚙️'
  };
  return icons[provider] || '📧';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    console.error('Toast container not found');
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const typeIcons = {
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="toast-title">${typeIcons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}</div>
    <div class="toast-message">${message}</div>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, duration);
  
  toast.addEventListener('click', () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  });
}

// Export functionality
function exportReport() {
  showToast('Report export functionality would generate and download report', 'info');
}
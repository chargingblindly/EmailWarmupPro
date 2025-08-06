// Supabase Configuration
let supabase;

// Application State
let currentUser = null;
let isAuthenticated = false;
let currentView = 'dashboard';
let isSignupMode = false;

// Mock Data
const mockData = {
  warmupSchedules: [
    {
      name: "Conservative",
      description: "Slow and steady warmup over 8 weeks",
      dailyLimits: [5, 8, 12, 15, 20, 25, 30, 35],
      duration: 56
    },
    {
      name: "Standard", 
      description: "Balanced approach over 6 weeks",
      dailyLimits: [5, 10, 15, 20, 25, 30, 35, 40],
      duration: 42
    },
    {
      name: "Aggressive",
      description: "Fast warmup over 4 weeks", 
      dailyLimits: [10, 15, 25, 35, 45, 55, 65, 75],
      duration: 28
    }
  ],
  emailProviders: [
    {"name": "Gmail", "icon": "📧", "coverage": "45%"},
    {"name": "Outlook", "icon": "📨", "coverage": "35%"},
    {"name": "Yahoo", "icon": "📩", "coverage": "15%"},
    {"name": "Other", "icon": "✉️", "coverage": "5%"}
  ],
  sampleAnalytics: {
    deliveryRate: 94.5,
    inboxPlacement: 87.2,
    spamRate: 3.8,
    engagementScore: 76.3,
    reputationScore: 8.4,
    totalEmailsSent: 1247,
    weeklyProgress: [
      {"week": 1, "sent": 35, "delivered": 33, "inbox": 28},
      {"week": 2, "sent": 70, "delivered": 68, "inbox": 61},
      {"week": 3, "sent": 105, "delivered": 102, "inbox": 92},
      {"week": 4, "sent": 140, "delivered": 136, "inbox": 125}
    ]
  },
  sampleAccounts: [
    {
      email: "sales@example.com",
      status: "Active",
      progress: 65,
      dailySent: 25,
      reputation: 8.2,
      connectedDate: "2024-01-15"
    },
    {
      email: "marketing@example.com", 
      status: "Warming",
      progress: 40,
      dailySent: 15,
      reputation: 7.8,
      connectedDate: "2024-02-01"
    }
  ]
};

// Global Functions (exposed to window for onclick handlers)
window.showAuthModal = function(mode) {
  isSignupMode = mode === 'signup';
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-title');
  const btnText = document.getElementById('auth-btn-text');
  const switchText = document.getElementById('auth-switch-text');
  const switchLink = document.getElementById('auth-switch-link');

  if (isSignupMode) {
    title.textContent = 'Sign Up';
    btnText.textContent = 'Sign Up';
    switchText.textContent = 'Already have an account?';
    switchLink.textContent = 'Sign In';
  } else {
    title.textContent = 'Sign In';
    btnText.textContent = 'Sign In';
    switchText.textContent = "Don't have an account?";
    switchLink.textContent = 'Sign Up';
  }

  modal.classList.remove('hidden');
};

window.closeAuthModal = function() {
  const modal = document.getElementById('auth-modal');
  modal.classList.add('hidden');
  const form = document.getElementById('auth-form');
  if (form) {
    form.reset();
  }
};

window.toggleAuthMode = function() {
  isSignupMode = !isSignupMode;
  window.showAuthModal(isSignupMode ? 'signup' : 'signin');
};

window.signOut = async function() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  
  localStorage.removeItem('mockUser');
  localStorage.removeItem('onboardingCompleted');
  currentUser = null;
  isAuthenticated = false;
  showLanding();
  showToast('Signed out successfully', 'info');
};

window.showConnectAccountModal = function() {
  const modal = document.getElementById('connect-account-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
};

window.closeConnectAccountModal = function() {
  const modal = document.getElementById('connect-account-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  const form = document.getElementById('connect-account-form');
  if (form) {
    form.reset();
  }
};

window.showMS365Modal = function() {
  const modal = document.getElementById('ms365-modal');
  if (!modal) return;

  const config = getUserPreference('ms365Config') || {};
  
  const clientIdEl = document.getElementById('modal-client-id');
  const clientSecretEl = document.getElementById('modal-client-secret');
  const tenantIdEl = document.getElementById('modal-tenant-id');

  if (clientIdEl) clientIdEl.value = config.clientId || '';
  if (clientSecretEl) clientSecretEl.value = config.clientSecret || '';
  if (tenantIdEl) tenantIdEl.value = config.tenantId || '';
  
  modal.classList.remove('hidden');
};

window.closeMS365Modal = function() {
  const modal = document.getElementById('ms365-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
};

window.testMS365Connection = function() {
  showToast('Testing connection...', 'info');
  
  setTimeout(() => {
    showToast('Connection test successful!', 'success');
  }, 2000);
};

window.connectEmailAccount = function() {
  const emails = ['sales@yourdomain.com', 'marketing@yourdomain.com', 'support@yourdomain.com'];
  const randomEmail = emails[Math.floor(Math.random() * emails.length)];
  
  showToast(`Connecting ${randomEmail}...`, 'info');
  
  setTimeout(() => {
    const newAccount = {
      email: randomEmail,
      status: 'Warming',
      progress: 0,
      dailySent: 0,
      reputation: 7.0,
      connectedDate: new Date().toISOString().split('T')[0]
    };
    
    addUserAccount(newAccount);
    showToast(`Successfully connected ${randomEmail}!`, 'success');
  }, 2000);
};

window.completeOnboarding = function() {
  localStorage.setItem('onboardingCompleted', 'true');
  const onboarding = document.getElementById('onboarding');
  const app = document.getElementById('app');
  
  if (onboarding) onboarding.classList.add('hidden');
  if (app) app.classList.remove('hidden');
  
  showToast('Welcome to Email Warmup Pro!', 'success');
  initializeDashboard();
  renderViews();
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  initializeSupabase();
  setupEventListeners();
  checkAuthState();
});

function initializeSupabase() {
  const supabaseUrl = window.ENV?.SUPABASE_URL || 'https://your-project.supabase.co';
  const supabaseKey = window.ENV?.SUPABASE_ANON_KEY || 'your-anon-key';
  
  try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.log('Supabase not configured, using mock authentication');
    supabase = null;
  }
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      if (view) {
        switchView(view);
      }
    });
  });

  // Auth form
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', handleAuth);
  }

  // Onboarding forms
  const ms365Form = document.getElementById('ms365-config-form');
  if (ms365Form) {
    ms365Form.addEventListener('submit', handleMS365Config);
  }

  const connectForm = document.getElementById('connect-account-form');
  if (connectForm) {
    connectForm.addEventListener('submit', handleConnectAccount);
  }

  const ms365ModalForm = document.getElementById('ms365-modal-form');
  if (ms365ModalForm) {
    ms365ModalForm.addEventListener('submit', handleMS365ModalConfig);
  }

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }

  // Modal click outside to close
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
    
    if (e.target.classList.contains('modal-close')) {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    }
  });

  // ESC key to close modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
        modal.classList.add('hidden');
      });
    }
  });
}

function setupConfigListeners() {
  setTimeout(() => {
    document.querySelectorAll('.schedule-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.schedule-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        saveUserPreference('selectedSchedule', option.dataset.schedule);
      });
    });

    document.querySelectorAll('.provider-option').forEach(option => {
      option.addEventListener('click', () => {
        option.classList.toggle('selected');
        updateSelectedProviders();
      });
    });
  }, 100);
}

function updateSelectedProviders() {
  const selected = Array.from(document.querySelectorAll('.provider-option.selected'))
    .map(el => el.dataset.provider);
  saveUserPreference('selectedProviders', selected);
}

async function checkAuthState() {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        currentUser = session.user;
        isAuthenticated = true;
        showApp();
        return;
      }
    } catch (error) {
      console.log('Auth check failed:', error);
    }
  }

  const mockUser = localStorage.getItem('mockUser');
  if (mockUser) {
    currentUser = JSON.parse(mockUser);
    isAuthenticated = true;
    showApp();
    return;
  }

  showLanding();
}

function showLanding() {
  document.getElementById('landing-page').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('onboarding').classList.add('hidden');
}

function showApp() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('onboarding').classList.add('hidden');
  
  if (currentUser) {
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('profile-email').value = currentUser.email;
  }

  const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
  if (!hasCompletedOnboarding) {
    showOnboarding();
    return;
  }

  initializeDashboard();
  renderViews();
}

function showOnboarding() {
  document.getElementById('app').classList.add('hidden');
  document.getElementById('onboarding').classList.remove('hidden');
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showToast('Please enter both email and password', 'error');
    return;
  }

  if (supabase) {
    try {
      let result;
      if (isSignupMode) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) {
        showToast(result.error.message, 'error');
        return;
      }

      currentUser = result.data.user;
      isAuthenticated = true;
      window.closeAuthModal();
      showToast('Authentication successful!', 'success');
      showApp();
    } catch (error) {
      showToast('Authentication failed', 'error');
    }
  } else {
    // Mock authentication
    currentUser = { email, id: 'mock-user-id' };
    isAuthenticated = true;
    localStorage.setItem('mockUser', JSON.stringify(currentUser));
    window.closeAuthModal();
    showToast('Authentication successful!', 'success');
    showApp();
  }
}

function switchView(viewName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeItem = document.querySelector(`[data-view="${viewName}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }

  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
  });

  const targetView = document.getElementById(`${viewName}-view`);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  const titles = {
    dashboard: 'Dashboard',
    accounts: 'Email Accounts',
    warmup: 'Warmup Configuration',
    analytics: 'Analytics',
    settings: 'Settings'
  };
  const titleElement = document.getElementById('page-title');
  if (titleElement) {
    titleElement.textContent = titles[viewName];
  }

  currentView = viewName;
  
  if (viewName === 'analytics') {
    setTimeout(() => renderAnalyticsChart(), 100);
  }
}

function initializeDashboard() {
  const analytics = mockData.sampleAnalytics;
  const totalSentEl = document.getElementById('total-sent');
  const deliveryRateEl = document.getElementById('delivery-rate');
  const inboxRateEl = document.getElementById('inbox-rate');
  const reputationScoreEl = document.getElementById('reputation-score');

  if (totalSentEl) totalSentEl.textContent = analytics.totalEmailsSent.toLocaleString();
  if (deliveryRateEl) deliveryRateEl.textContent = analytics.deliveryRate + '%';
  if (inboxRateEl) inboxRateEl.textContent = analytics.inboxPlacement + '%';
  if (reputationScoreEl) reputationScoreEl.textContent = analytics.reputationScore;

  setTimeout(() => renderProgressChart(), 100);
  renderAccountsList();
}

function renderViews() {
  renderAccountsTable();
  renderWarmupConfig();
  loadUserSettings();
}

function renderProgressChart() {
  const canvas = document.getElementById('progress-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const data = mockData.sampleAnalytics.weeklyProgress;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => `Week ${d.week}`),
      datasets: [
        {
          label: 'Emails Sent',
          data: data.map(d => d.sent),
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          fill: true
        },
        {
          label: 'Delivered',
          data: data.map(d => d.delivered),
          borderColor: '#FFC185',
          backgroundColor: 'rgba(255, 193, 133, 0.1)',
          fill: true
        },
        {
          label: 'Inbox',
          data: data.map(d => d.inbox),
          borderColor: '#B4413C',
          backgroundColor: 'rgba(180, 65, 60, 0.1)',
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
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

function renderAnalyticsChart() {
  const canvas = document.getElementById('analytics-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const data = mockData.sampleAnalytics.weeklyProgress;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => `Week ${d.week}`),
      datasets: [
        {
          label: 'Delivery Rate %',
          data: data.map(d => ((d.delivered / d.sent) * 100).toFixed(1)),
          backgroundColor: '#1FB8CD'
        },
        {
          label: 'Inbox Rate %',
          data: data.map(d => ((d.inbox / d.sent) * 100).toFixed(1)),
          backgroundColor: '#FFC185'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

function renderAccountsList() {
  const container = document.getElementById('accounts-list');
  if (!container) return;

  const accounts = getUserAccounts();
  
  container.innerHTML = accounts.map(account => `
    <div class="account-item">
      <div class="account-email">${account.email}</div>
      <div class="account-status">
        <span class="status status--${account.status.toLowerCase() === 'active' ? 'success' : 'info'}">
          ${account.status}
        </span>
        <span class="account-progress">${account.progress}% complete</span>
      </div>
    </div>
  `).join('');
}

function renderAccountsTable() {
  const container = document.getElementById('accounts-table');
  if (!container) return;

  const accounts = getUserAccounts();
  
  container.innerHTML = `
    <div class="table-header">
      <div>Email Address</div>
      <div>Status</div>
      <div>Progress</div>
      <div>Daily Sent</div>
      <div>Reputation</div>
    </div>
    ${accounts.map(account => `
      <div class="table-row">
        <div>${account.email}</div>
        <div>
          <span class="status status--${account.status.toLowerCase() === 'active' ? 'success' : 'info'}">
            ${account.status}
          </span>
        </div>
        <div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${account.progress}%"></div>
          </div>
          <span style="font-size: 12px; color: var(--color-text-secondary)">${account.progress}%</span>
        </div>
        <div>${account.dailySent}</div>
        <div>${account.reputation}</div>
      </div>
    `).join('')}
  `;
}

function renderWarmupConfig() {
  const scheduleContainer = document.getElementById('schedule-options');
  if (!scheduleContainer) return;

  const selectedSchedule = getUserPreference('selectedSchedule') || 'Standard';
  
  scheduleContainer.innerHTML = mockData.warmupSchedules.map(schedule => `
    <div class="schedule-option ${schedule.name === selectedSchedule ? 'selected' : ''}" data-schedule="${schedule.name}">
      <div class="schedule-name">${schedule.name}</div>
      <div class="schedule-description">${schedule.description}</div>
    </div>
  `).join('');

  const providerContainer = document.getElementById('provider-options');
  if (!providerContainer) return;

  const selectedProviders = getUserPreference('selectedProviders') || ['Gmail', 'Outlook'];
  
  providerContainer.innerHTML = mockData.emailProviders.map(provider => `
    <div class="provider-option ${selectedProviders.includes(provider.name) ? 'selected' : ''}" data-provider="${provider.name}">
      <div class="provider-icon">${provider.icon}</div>
      <div class="provider-name">${provider.name}</div>
      <div class="provider-coverage">${provider.coverage}</div>
    </div>
  `).join('');

  setupConfigListeners();
}

function handleMS365Config(e) {
  e.preventDefault();
  const clientId = document.getElementById('client-id').value;
  const clientSecret = document.getElementById('client-secret').value;
  const tenantId = document.getElementById('tenant-id').value;

  const config = { clientId, clientSecret, tenantId };
  saveUserPreference('ms365Config', config);
  
  showToast('MS365 configuration saved!', 'success');
  
  const step1 = document.getElementById('onboarding-step-1');
  const step2 = document.getElementById('onboarding-step-2');
  if (step1) step1.classList.add('hidden');
  if (step2) step2.classList.remove('hidden');
}

function handleMS365ModalConfig(e) {
  e.preventDefault();
  const clientId = document.getElementById('modal-client-id').value;
  const clientSecret = document.getElementById('modal-client-secret').value;
  const tenantId = document.getElementById('modal-tenant-id').value;

  const config = { clientId, clientSecret, tenantId };
  saveUserPreference('ms365Config', config);
  
  window.closeMS365Modal();
  showToast('MS365 configuration updated!', 'success');
}

function handleConnectAccount(e) {
  e.preventDefault();
  const email = document.getElementById('connect-email').value;
  
  const newAccount = {
    email: email,
    status: 'Warming',
    progress: 0,
    dailySent: 0,
    reputation: 7.0,
    connectedDate: new Date().toISOString().split('T')[0]
  };
  
  addUserAccount(newAccount);
  window.closeConnectAccountModal();
  showToast(`Successfully connected ${email}!`, 'success');
  renderAccountsTable();
  renderAccountsList();
}

function handleProfileUpdate(e) {
  e.preventDefault();
  const timezone = document.getElementById('timezone').value;
  saveUserPreference('timezone', timezone);
  showToast('Profile updated successfully!', 'success');
}

function loadUserSettings() {
  const timezone = getUserPreference('timezone') || 'UTC';
  const timezoneEl = document.getElementById('timezone');
  if (timezoneEl) {
    timezoneEl.value = timezone;
  }
}

function getUserAccounts() {
  const accounts = localStorage.getItem('userAccounts');
  return accounts ? JSON.parse(accounts) : mockData.sampleAccounts;
}

function addUserAccount(account) {
  const accounts = getUserAccounts();
  accounts.push(account);
  localStorage.setItem('userAccounts', JSON.stringify(accounts));
}

function getUserPreference(key) {
  const prefs = localStorage.getItem('userPreferences');
  const preferences = prefs ? JSON.parse(prefs) : {};
  return preferences[key];
}

function saveUserPreference(key, value) {
  const prefs = localStorage.getItem('userPreferences');
  const preferences = prefs ? JSON.parse(prefs) : {};
  preferences[key] = value;
  localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

console.log(`
Email Warmup Pro - Environment Variables Required:

For Supabase integration, please set these environment variables in your Netlify deployment:

1. SUPABASE_PROJECT_ID - Your Supabase project ID
2. SUPABASE_API_KEY - Your Supabase anon key

Without these variables, the app will use mock authentication for demonstration purposes.

GitHub Repository: https://github.com/chargingblindly/EmailWarmupLabs
`);
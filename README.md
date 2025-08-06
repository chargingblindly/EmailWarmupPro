# Email Warmup Pro

A professional email warmup service to improve email deliverability through gradual sender reputation building.

## Features

- **MS365 Integration**: Seamless connection with Microsoft 365 email accounts
- **Smart Warmup Algorithm**: Gradual volume increase with reputation monitoring
- **Multi-Tenant Architecture**: Team collaboration with role-based access control
- **Real-Time Analytics**: Comprehensive campaign metrics and performance tracking
- **Demo Simulation**: Interactive demonstration of the warmup process
- **Team Management**: Invite and manage team members with different roles

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Charts**: Recharts for data visualization
- **Testing**: Cypress for end-to-end testing
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chargingblindly/EmailWarmupPro.git
cd EmailWarmupPro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application uses Supabase with the following main tables:

- `tenants` - Organization/tenant information
- `tenant_members` - Team member relationships and roles
- `email_accounts` - Connected MS365 email accounts
- `warmup_campaigns` - Email warmup campaign configurations
- `warmup_emails` - Individual email sending records

## Usage

### First Time Setup

1. **Sign Up**: Create your account on the landing page
2. **Create Organization**: Set up your first tenant/organization
3. **Connect Email**: Add your MS365 email account (demo mode available)
4. **Create Campaign**: Set up your first warmup campaign
5. **Monitor Progress**: Track your email reputation and delivery metrics

### Team Management

- **Invite Members**: Add team members via email invitation
- **Assign Roles**: Set permissions (Owner, Admin, Member)
- **Collaborate**: Work together on email warmup campaigns

### Demo Mode

Try the interactive demo to see how email warmup works:
- Navigate to "Demo Simulation" in the dashboard
- Click "Start Demo" to see real-time warmup progress
- Watch metrics improve over the simulated campaign period

## Testing

Run the test suite:

```bash
# Unit and integration tests
npm run test

# End-to-end tests
npm run cypress:open

# Run all Cypress tests headlessly
npm run cypress:run
```

## Deployment

### Netlify Deployment

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

The app will automatically deploy on every push to the main branch.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@emailwarmuppro.com or open an issue on GitHub.

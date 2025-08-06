# Email Warmup Pro

A professional email warmup service to improve your sender reputation and avoid the spam folder.

## Features

- **Gradual Warmup**: Slowly increase sending volume to build trust with email providers
- **Real-time Analytics**: Monitor delivery rates, spam placement, and reputation scores
- **MS365 Integration**: Secure connection to your Microsoft 365 email accounts
- **Dashboard**: Comprehensive overview of your email warmup progress

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-open
- `npm run build` - Build the project (currently just validates files)
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier

## Project Structure

```
EmailWarmupPro/
├── index.html      # Main HTML file
├── app.js          # JavaScript application logic
├── style.css       # Styles and layout
├── package.json    # Project configuration
└── README.md       # This file
```

## Configuration

The application uses Supabase for backend services. You'll need to configure your Supabase credentials in the `app.js` file.

## Development

This is a static web application that can be served directly from any web server. The `http-server` package is included for local development.

## License

MIT License

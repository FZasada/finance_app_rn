# Expo Deployment Guide

This guide covers how to deploy the Finance App using Expo Application Services (EAS).

## Prerequisites

- Node.js (v16 or later)
- Expo CLI installed globally: `npm install -g @expo/cli`
- EAS CLI installed globally: `npm install -g eas-cli`
- Expo account (sign up at https://expo.dev)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to EAS

```bash
eas login
```

Enter your Expo account credentials when prompted.

## Deployment Options

### Web Deployment

#### Option A: Static Export (Recommended for hosting services)

```bash
# Export the web app as static files
npx expo export --platform web

# Files will be generated in the 'dist' folder
# Upload the 'dist' folder contents to your web hosting service
```

#### Option B: EAS Update (For live updates)

```bash
# Build and deploy web version
eas build --platform web

# Or deploy updates to existing builds
eas update --branch production --message "Update description"
```

### Mobile Deployment

#### iOS Build

```bash
# Development build
eas build --platform ios --profile development

# Production build for App Store
eas build --platform ios --profile production
```

#### Android Build

```bash
# Development build
eas build --platform android --profile development

# Production build for Google Play Store
eas build --platform android --profile production
```

#### Build for both platforms

```bash
eas build --platform all --profile production
```

## Build Profiles

The app uses different build profiles defined in `eas.json`:

- **development**: For testing with Expo development tools
- **preview**: For internal testing and sharing
- **production**: For App Store/Play Store submission

## Environment Variables

Make sure to set up environment variables in EAS:

```bash
# Set environment variables for your project
eas secret:create --scope project --name SUPABASE_URL --value "your-supabase-url"
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "your-supabase-anon-key"
```

## Publishing Updates

After initial deployment, you can push over-the-air updates:

```bash
# Publish an update to the production branch
eas update --branch production --message "Bug fixes and improvements"

# Publish to a specific channel
eas update --channel production --message "Update description"
```

## Web Hosting Options

### Netlify

1. Build the web version:
   ```bash
   npx expo export --platform web
   ```

2. Upload the `dist` folder to Netlify or connect your Git repository

3. Set build command: `npx expo export --platform web`
4. Set publish directory: `dist`

### Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   npx expo export --platform web
   vercel --prod
   ```

### Traditional Web Hosting

1. Export the web build:
   ```bash
   npx expo export --platform web
   ```

2. Upload all files from the `dist` folder to your web server

## Common Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Check project configuration
eas config

# Submit to app stores
eas submit --platform ios
eas submit --platform android

# Monitor app performance
eas analytics

# Manage app versions
eas update:list
```

## Troubleshooting

### Build Failures

1. Check `eas.json` configuration
2. Verify all dependencies are correctly installed
3. Ensure environment variables are set
4. Check build logs: `eas build:view [BUILD_ID]`

### Web Export Issues

1. Clear Metro cache: `npx expo start --clear`
2. Delete `dist` folder and rebuild
3. Check for platform-specific code that might not work on web

### Update Issues

1. Verify the branch/channel name matches your configuration
2. Check that your app supports over-the-air updates
3. Ensure the runtime version matches between builds and updates

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)

## Project-Specific Notes

This Finance App includes:
- Supabase integration for backend services
- Multi-language support (German, English, Dutch, Polish)
- Real-time features that require proper environment configuration
- Charts and visualizations that work across all platforms

Make sure to test thoroughly on all target platforms before production deployment.
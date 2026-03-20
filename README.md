# FitLog - Workout Tracker PWA

A fast, reliable workout tracker that works great on iPhone via Safari > Add to Home Screen.

## Features

- **Workout Logging**: Quick set entry with reps, weight, and optional RPE
- **Previous Set Reference**: See your last workout's performance while logging
- **Exercise Library**: 98+ pre-loaded exercises, searchable and filterable
- **Custom Exercises**: Add your own exercises that integrate seamlessly
- **Workout Templates**: Push/Pull/Legs and more, with custom template support
- **Progress Tracking**: Per-exercise charts showing your progression
- **Body Weight Tracking**: Log and visualize weight over time
- **Rest Timer**: Auto-starts after completing a set
- **Backup/Restore**: Export and import your data as JSON
- **Offline Support**: Works without internet after first load
- **No Account Required**: All data stored locally on your device

## Tech Stack

- React + TypeScript
- Vite (build tool)
- IndexedDB via Dexie.js (data storage)
- Recharts (charts)
- PWA with Service Worker

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

### Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview

# The built files are in the 'dist' folder
```

## Self-Hosting

### Option 1: Static File Host (Recommended)

After building, upload the contents of the `dist` folder to any static hosting:

- **GitHub Pages**: Free, push to `gh-pages` branch
- **Netlify**: Free, drag & drop deploy
- **Vercel**: Free, connect to Git repo
- **Cloudflare Pages**: Free, fast global CDN
- **Your own server**: Just serve the static files

### Option 2: Self-Host with Docker

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
```

```bash
docker build -t fitlog .
docker run -p 80:80 fitlog
```

### Option 3: Simple Python Server

```bash
cd dist
python -m http.server 8080
```

## Installing as iPhone App

1. Open the hosted URL in Safari on your iPhone
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

The app will now appear on your home screen and work like a native app.

## Data Storage

- **IndexedDB**: All workout data, exercises, templates stored in browser's IndexedDB
- **localStorage**: Only used for lightweight settings (units, timer prefs)
- **No Server**: Your data never leaves your device
- **Per-Device**: Each device has its own separate data

### Important: Backup Your Data!

Since data is stored locally:
- Clearing browser data will delete your workouts
- Use Settings > Export Backup regularly
- Store backups somewhere safe (cloud drive, email to yourself)

## Optional AI Features

AI features are completely optional and disabled by default.

To enable:
1. Get an OpenAI API key from https://platform.openai.com
2. Go to Settings > Add OpenAI API Key
3. Enter your key (stored locally, never sent to our servers)

Note: You'll be charged by OpenAI for usage. AI calls go directly from your browser to OpenAI.

## License

MIT - Do whatever you want with it.

## Contributing

Feel free to submit issues and PRs!

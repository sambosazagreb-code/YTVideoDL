# YTVideoDL

YouTube video downloader. Download videos and play them locally offline with an integrated media player.

## Requirements

- Node.js v14+
- npm v6+
- Modern browser (Chrome, Firefox, Safari, Edge)

## Installation

```bash
git clone https://github.com/sambosazagreb-code/YTVideoDL.git
cd YTVideoDL
```

## Running

Install Live Server globally:
```bash
npm install -g live-server
```

Then run:
```bash
live-server
```

The app opens at `http://localhost:8080`

**Alternative methods:**

Python 3:
```bash
python -m http.server 8000
```

Node.js:
```bash
npx http-server
```

VS Code: Right-click `index.html` → "Open with Live Server"

## Usage

1. Paste a YouTube URL in the input field
2. Click Download
3. Video saves locally
4. Play from the media player

## Project Structure

```
YTVideoDL/
├── index.html    Main HTML file
├── style.css     Styling
├── app.js        JavaScript logic
└── README.md     This file
```

## Browser Storage

- Local storage: 5-10 MB per browser
- IndexedDB: 50+ MB per browser
- Downloaded files limited by disk space

## Security

All processing happens locally. No data sent to external servers except YouTube fetch requests. No tracking, no account required.

## Development

Edit `index.html`, `style.css`, or `app.js` and save. Changes appear instantly with Live Server.

## Troubleshooting

**App won't load** - Use a local server, not file://

**Download fails** - Check URL is correct and video is public

**Video won't play** - Verify browser supports HTML5 video

**CORS errors** - Ensure using local server (http://localhost)

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/name`
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/name`
5. Open a Pull Request

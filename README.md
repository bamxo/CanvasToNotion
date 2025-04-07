# Canvas To Notion Chrome Extension

This Chrome extension allows you to seamlessly transfer content from Canvas to Notion. 

## Components Overview

### Background Script
The background script runs in the background of the Chrome browser and manages the extension's core functionality. It:
- Handles communication between different parts of the extension
- Manages API calls to Notion
- Processes data from Canvas before sending to Notion
- Runs independently of any open webpage

### Popup
The popup is the user interface that appears when you click the extension icon in Chrome. It:
- Provides user controls and settings
- Shows the current status of the extension
- Allows users to configure Notion integration
- Acts as the frontend interface for user interaction

## Development Setup

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CanvasToNotion.git
cd CanvasToNotion
```

2. Install dependencies:
```bash
npm install
```

### Development Workflow

1. Build the extension:
```bash
npm run build
```
This will create a `dist` folder containing the built extension files.

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" in the top left
   - Select the `dist` folder from your project directory

3. Making Changes:
   - After making changes to the code, run `npm run build` again
   - Go to the extension card in `chrome://extensions/`
   - Click the refresh icon in the bottom right of the Canvas to Notion card

### Development Commands

- `npm run dev`: Start development server
- `npm run build`: Build the extension
- `npm run test`: Run all tests with coverage
- `npm run test:watch`: Run tests in watch mode with coverage
- `npm run test:ui`: Run tests with UI interface and coverage
- `npm run test:popup`: Run tests only for popup component
- `npm run test:content`: Run tests only for content scripts
- `npm run test:background`: Run tests only for background scripts
- `npm run lint`: Run linter

## Project Structure

```
CanvasToNotion/
├── src/              # Source code
│   ├── background/   # Background script
│   ├── popup/       # Popup interface
│   └── content/     # Content scripts
├── public/          # Static assets
└── dist/           # Built extension (generated)
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Canvas to Notion Chrome Extension

A Chrome extension that allows users to sync their Canvas LMS assignments directly to Notion.

## Prerequisites

- Chrome browser
- A Notion account
- A Canvas LMS account
- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

1. Clone the repository and navigate to the extension directory:
```bash
cd CanvasToNotion-Extension
```

2. Install dependencies:
```bash
npm install
```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `CanvasToNotion-Extension` directory

## Development

The extension is built using:
- Manifest V3
- TypeScript
- Chrome Extension APIs

### Project Structure
- `manifest.json`: Extension configuration
- `src/`: Source code directory
  - `background/`: Background service worker
  - `content/`: Content scripts for Canvas integration
  - `popup/`: Extension popup UI

### Building

The extension will be built automatically when loaded in Chrome's developer mode. Any changes to the source code will be reflected after reloading the extension.

## Features

- Sync Canvas assignments to Notion
- Automatic authentication with Canvas LMS
- Integration with the Canvas to Notion web application

## Permissions

The extension requires the following permissions:
- `storage`: For saving user preferences and authentication data
- `tabs`: For accessing Canvas LMS pages
- `scripting`: For injecting content scripts
- `identity`: For OAuth authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

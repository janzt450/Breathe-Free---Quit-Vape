import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to reconstruct __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false, // Optional: Hide dev tools in production
    },
    // In production (dist), icon is at ../dist/favicon.ico
    icon: path.join(__dirname, '../dist/favicon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#020617', // Match the body background color
  });

  // Load the built index.html
  const startUrl = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(startUrl);

  // 1. Handle new window requests (window.open, target="_blank")
  // This is the most critical part for your React app's external links
  mainWindow.webContents.setWindowOpenHandler((details) => {
    const { url } = details;
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      // Open in system default browser
      shell.openExternal(url).catch(err => console.error('Failed to open external URL:', err));
      return { action: 'deny' }; // Prevent Electron from creating its own internal window
    }
    return { action: 'allow' };
  });

  // 2. Handle direct navigation (clicking a link that replaces the current page)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isExternal = url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:');
    // Ensure we don't block navigation to our own index.html or local files
    const isLocal = url.includes('index.html') || url.startsWith('file:');
    
    if (isExternal && !isLocal) {
      event.preventDefault();
      shell.openExternal(url).catch(err => console.error('Failed to open external URL:', err));
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
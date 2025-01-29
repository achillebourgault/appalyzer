const { app, BrowserWindow, ipcMain, shell, session, nativeImage, net } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');
const pngToIco = require('png-to-ico');

let mainWindow = null;
const store = new Store();
const isDev = process.env.NODE_ENV === 'development';

app.commandLine.appendSwitch('enable-features', 'WebviewTag');
app.commandLine.appendSwitch('disable-site-isolation-trials');

const userDataPath = app.getPath('userData');
const sessionStoragePath = path.join(userDataPath, 'sessions');

if (!fs.existsSync(sessionStoragePath)) {
  fs.mkdirSync(sessionStoragePath, { recursive: true });
}

function configureSession(sessionId) {
  const sess = session.fromPartition(sessionId);
  
  // Configure persistant storage
  const sessionPath = path.join(sessionStoragePath, sessionId.replace('persist:', ''));
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  // Configure permissions
  sess.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  sess.cookies.set({
    url: 'https://*.com',
    name: 'session-persistence',
    value: 'true',
    expirationDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 an
    session: false,
    secure: true
  }).catch(err => console.log('Cookie setting error:', err));

  return sess;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      partition: 'persist:main',
      nativeWindowOpen: true
    },
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#000000',
      symbolColor: '#ffffff',
      height: 32
    }
  });

  // Locales permissions
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  // Security policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ws:"]
      }
    });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'allow' };
  });

  // Retrieve arguments from the command line
  let startupAppId = null;
  const args = process.argv.slice(1);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--app-id=')) {
      startupAppId = arg.split('=')[1];
      break;
    }
  }

  // Check if the app exists at startup
  const checkAppExists = async (appId) => {
    try {
      const apps = await store.get('apps', []);
      return apps.some(app => app.id === appId);
    } catch (error) {
      console.error('Error checking app existence:', error);
      return false;
    }
  };

  // If a startup app-id is specified, check if it exists
  if (startupAppId) {
    mainWindow.webContents.on('did-finish-load', async () => {
      const exists = await checkAppExists(startupAppId);
      if (exists) {
        mainWindow.webContents.send('open-app', startupAppId);
      } else {
        mainWindow.webContents.send('app-not-found', startupAppId);
      }
    });
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const indexPath = path.join(__dirname, '../build/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });

  // Display the window when it's ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    mainWindow.webContents.openDevTools(); // DevTools
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// OAuth window
function createAuthWindow(url, parentSession) {
  const authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      partition: parentSession,
      nativeWindowOpen: true,
      sandbox: false,
      webviewTag: true
    },
    parent: mainWindow,
    modal: true,
    show: true
  });

  // Configure permissions for popups
  authWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  // Allow new windows to open
  authWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'allow' };
  });

  // Handle redirects and navigations
  authWindow.webContents.on('will-navigate', (event, newUrl) => {
    handleAuthCallback(newUrl, authWindow);
  });

  authWindow.webContents.on('will-redirect', (event, newUrl) => {
    handleAuthCallback(newUrl, authWindow);
  });

  // Handle loading errors
  authWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Auth window failed to load:', errorCode, errorDescription);
  });

  authWindow.loadURL(url);
  return authWindow;
}

function handleAuthCallback(url, authWindow) {
  const callbackParams = ['code=', 'token=', 'auth_token=', 'access_token=', 'id_token='];
  if (callbackParams.some(param => url.includes(param))) {
    setTimeout(() => authWindow.close(), 100);
  }
}

function normalizeUrl(url) {
  try {
    url = url.trim();
  
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const urlObj = new URL(url);
    
    if (urlObj.hostname.startsWith('www.'))
      urlObj.hostname = urlObj.hostname.slice(4);
    return urlObj.toString();
  } catch (error) {
    if (!url.includes('.')) {
      return normalizeUrl(url + '.com');
    }
    
    // If the URL doesn't start with http:// or https://, try adding it
    if (!url.includes('://')) {
      return normalizeUrl('https://' + url);
    }
    
    throw new Error('Invalid URL');
  }
}

function setupIpcHandlers() {
  ipcMain.handle('get-apps', async () => {
    return store.get('apps', []);
  });

  ipcMain.handle('get-app-data', async (event, id) => {
    const apps = store.get('apps', []);
    return apps.find(app => app.id === id);
  });

  ipcMain.handle('save-app-data', async (event, appData) => {
    const apps = store.get('apps', []);
    apps.push(appData);
    store.set('apps', apps);
    
    // Configure a new persistent session for the app
    const sessionId = `persist:app-${appData.id}`;
    configureSession(sessionId);
    
    return true;
  });

  ipcMain.handle('delete-app', async (event, appId) => {
    const apps = store.get('apps', []);
    const updatedApps = apps.filter(app => app.id !== appId);
    store.set('apps', updatedApps);
    
    // Clear storage data for the app's session
    const sessionId = `persist:app-${appId}`;
    const sess = session.fromPartition(sessionId);
    await sess.clearStorageData();
    
    // Remove the app's session folder
    const sessionPath = path.join(sessionStoragePath, `app-${appId}`);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    
    return true;
  });

  ipcMain.handle('rename-app', async (event, { appId, newName }) => {
    const apps = store.get('apps', []);
    const updatedApps = apps.map(app => 
      app.id === appId ? { ...app, name: newName } : app
    );
    store.set('apps', updatedApps);
    return true;
  });

  ipcMain.handle('add-app', async (event, appData) => {
    try {
      // URL Validation
      if (!appData.url || appData.url.trim() === '') {
        throw new Error('URL is required');
      }

      appData.url = normalizeUrl(appData.url);

      try {
        await net.request(appData.url).abort();
      } catch (error) {
        throw new Error('URL is not accessible');
      }

      const apps = store.get('apps', []);
      const id = Date.now().toString();
      const newApp = { id, ...appData };
      
      apps.push(newApp);
      store.set('apps', apps);
      return newApp;
    } catch (error) {
      console.error('Error adding app:', error);
      throw error;
    }
  });

  ipcMain.handle('clear-app-data', async (event, appId) => {
    const sessionId = `persist:app-${appId}`;
    const sess = session.fromPartition(sessionId);
    await sess.clearStorageData();
    return true;
  });

  ipcMain.handle('clear-data', async () => {
    try {
      store.clear();
      const sessions = await session.defaultSession.getAllSessions();
      await Promise.all(sessions.map(s => s.clearStorageData()));
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  });

  ipcMain.handle('open-external-url', async (event, url) => {
    require('electron').shell.openExternal(url);
  });

  // Settings handlers
  ipcMain.handle('get-settings', async () => {
    return store.get('settings') || {
      startAtLogin: false
    };
  });

  ipcMain.handle('set-settings', async (event, settings) => {
    try {
      store.set('settings', settings);
      if ('startAtLogin' in settings) {
        app.setLoginItemSettings({
          openAtLogin: settings.startAtLogin,
          path: app.getPath('exe')
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  });

  ipcMain.handle('save-setting', async (event, { key, value }) => {
    const settings = store.get('settings') || {};
    settings[key] = value;
    store.set('settings', settings);

    if (key === 'startAtLogin') {
      app.setLoginItemSettings({
        openAtLogin: value,
        path: app.getPath('exe')
      });
    }

    return true;
  });

  // Window handlers
  ipcMain.handle('window-control', async (event, action) => {
    switch (action) {
      case 'minimize':
        mainWindow.minimize();
        break;
      case 'maximize':
        mainWindow.maximize();
        break;
      case 'unmaximize':
        mainWindow.unmaximize();
        break;
      case 'close':
        mainWindow.close();
        break;
    }
  });

  ipcMain.handle('open-auth-window', async (event, { url, sessionId }) => {
    return createAuthWindow(url, sessionId);
  });

  ipcMain.handle('set-window-title', async (event, appName) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setTitle(appName ? `${appName} - Appalyzer` : 'Appalyzer');
    }
  });

  const defaultIconPath = isDev 
    ? path.join(process.cwd(), 'public', 'icon.ico')
    : path.join(process.resourcesPath, 'icon.ico');

  console.log('Default icon path:', defaultIconPath);
  console.log('Icon exists:', fs.existsSync(defaultIconPath));

  ipcMain.handle('set-window-icon', async (event, iconUrl) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (iconUrl.startsWith('http')) {
          const chunks = [];
          const request = net.request(iconUrl);
          
          await new Promise((resolve, reject) => {
            request.on('response', (response) => {
              response.on('data', (chunk) => chunks.push(chunk));
              response.on('end', resolve);
              response.on('error', reject);
            });
            request.on('error', reject);
            request.end();
          });

          const buffer = Buffer.concat(chunks);
          const icon = nativeImage.createFromBuffer(buffer);
          win.setIcon(icon);
        } else {
          // Use local icon
          win.setIcon(iconUrl);
        }
      }
    } catch (error) {
      console.error('Error setting window icon:', error);
      // In case of error, reset to default icon
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.setIcon(defaultIconPath);
      }
    }
  });

  ipcMain.handle('reset-window-icon', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (!fs.existsSync(defaultIconPath)) {
          console.error('Default icon not found at:', defaultIconPath);
          return;
        }
        console.log('Setting default icon:', defaultIconPath);
        win.setIcon(defaultIconPath);
      }
    } catch (error) {
      console.error('Error resetting window icon:', error);
    }
  });

  ipcMain.handle('normalize-url', async (event, url) => {
    return normalizeUrl(url);
  });

  ipcMain.handle('reorder-apps', async (event, apps) => {
    store.set('apps', apps);
    return apps;
  });

  ipcMain.handle('clear-all-data', async () => {
    try {
      const apps = store.get('apps', []);
      
      for (const app of apps) {
        const sessionId = `persist:app-${app.id}`;
        const sess = session.fromPartition(sessionId);
        await sess.clearStorageData();
      }
      
      store.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  });

  // Download image from URL
  async function downloadImage(url, filePath) {
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      function download(currentUrl) {
        console.log('Downloading from:', currentUrl);
        const client = currentUrl.startsWith('https') ? https : http;
        
        client.get(currentUrl, (res) => {
          // Handle redirections
          if (res.statusCode === 301 || res.statusCode === 302) {
            const newUrl = res.headers.location;
            console.log('Redirecting to:', newUrl);
            download(newUrl);
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download image: ${res.statusCode}`));
            return;
          }

          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(filePath, buffer);
            resolve(filePath);
          });
        }).on('error', (err) => {
          console.error('Download error:', err);
          reject(err);
        });
      }

      download(url);
    });
  }

  // Function to convert an image to an icon
  async function convertIcon(imagePath) {
    try {
      const iconName = path.basename(imagePath, path.extname(imagePath)) + '.ico';
      const iconPath = path.join(app.getPath('userData'), iconName);
      
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Source image not found: ${imagePath}`);
      }
      
      const buf = await fs.promises.readFile(imagePath);
      console.log('Image file read, size:', buf.length);
      const icoBuffer = await pngToIco(buf);
      console.log('Image converted to ico, size:', icoBuffer.length);
      await fs.promises.writeFile(iconPath, icoBuffer);
      console.log('Icon file written successfully to:', iconPath);
      
      return iconPath;
    } catch (error) {
      console.error('Detailed error converting icon:', error);
      throw error;
    }
  }

  // 
  ipcMain.handle('create-desktop-shortcut', async (event, appData) => {
    try {
      const desktopPath = app.getPath('desktop');
      const shortcutPath = path.join(desktopPath, `${appData.name}.lnk`);
      
      let iconPath = appData.logo;
      if (!iconPath) {
        throw new Error('No logo provided for app');
      }

      if (iconPath.startsWith('http')) {
        const downloadPath = path.join(app.getPath('userData'), `${appData.id}.png`);
        iconPath = await downloadImage(iconPath, downloadPath);
      }
      
      const iconFile = await convertIcon(iconPath);
      
      // Create the Windows shortcut with the --app-id argument and the app icon
      const shortcut = {
        target: process.execPath,
        args: `--app-id=${appData.id}`,
        description: `Launch ${appData.name} in Appalyzer`,
        icon: iconFile,
        iconIndex: 0 // Make sure the first icon in the file is used
      };
      console.log('Shortcut config:', shortcut);

      shell.writeShortcutLink(shortcutPath, 'create', shortcut);
      console.log('Shortcut created successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Detailed error creating shortcut:', error);
      // Check if the file exists
      if (error.code === 'ENOENT') {
        console.error('File not found error. Checking paths...');
        console.log('App exe path exists:', fs.existsSync(process.execPath));
        if (appData && appData.logo) {
          console.log('Icon file exists:', fs.existsSync(appData.logo));
        }
      }
      throw error;
    }
  });

  ipcMain.handle('update-window-icon', async (event, iconPath) => {
    try {
      if (mainWindow && iconPath) {
        const iconFile = await convertIcon(iconPath);
        mainWindow.setIcon(iconFile);
      }
    } catch (error) {
      console.error('Error updating window icon:', error);
    }
  });

  ipcMain.handle('save-app', async (event, app) => {
    try {
      const apps = store.get('apps', []);
      const existingAppIndex = apps.findIndex(a => a.id === app.id);
      
      if (existingAppIndex !== -1) {
        apps[existingAppIndex] = app;
      } else {
        apps.push(app);
      }
      store.set('apps', apps);
      mainWindow.webContents.send('apps-updated');

      return { success: true };
    } catch (error) {
      console.error('Error saving app:', error);
      throw error;
    }
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

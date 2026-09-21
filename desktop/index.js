const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 650,
    height: 520,
    resizable: false,
    title: 'BiblioGest Launcher',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'launcher.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});

// IPC Controls
ipcMain.on('start-server', (event) => {
  checkServerStatus((running) => {
    if (running) {
      event.reply('server-status', { running: true, message: 'Servidor já está em execução na porta 3000.' });
      shell.openExternal('http://localhost:3000');
      return;
    }

    const backendPath = path.join(__dirname, '../backend');
    backendProcess = spawn('npm', ['start'], { cwd: backendPath, shell: true });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    setTimeout(() => {
      shell.openExternal('http://localhost:3000');
      event.reply('server-status', { running: true, message: 'Servidor iniciado com sucesso.' });
    }, 3000);
  });
});

ipcMain.on('stop-server', (event) => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
    event.reply('server-status', { running: false, message: 'Servidor interrompido.' });
  } else {
    event.reply('server-status', { running: false, message: 'Nenhum servidor em execução.' });
  }
});

ipcMain.on('open-browser', () => {
  shell.openExternal('http://localhost:3000');
});

ipcMain.on('open-data-folder', () => {
  const dataPath = path.join(__dirname, '../database');
  shell.openPath(dataPath);
});

function checkServerStatus(callback) {
  const req = http.get('http://localhost:3000/health', (res) => {
    callback(res.statusCode === 200);
  });
  req.on('error', () => callback(false));
  req.end();
}

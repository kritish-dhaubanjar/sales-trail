const php = require('./php')
const { join } = require('path')
const { spawn } = require('child_process')
const { app, BrowserWindow } = require('electron/main')

let server
let splash;
app.disableHardwareAcceleration();

const createWindow = () => {
  splash = new BrowserWindow({
    width: 620,
    height: 300,
    resizable: false,
    frame: false,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
    },
    icon: './assets/icon.png'
  })

  splash.loadFile('./assets/splash.html')

  splash.once('ready-to-show', () => {
    splash.show();
  });

  const win = new BrowserWindow({
    minWidth: 1024,
    minHeight: 768,
    autoHideMenuBar: true,
    show: false,
    icon: './assets/icon.png'
  })

  win.once('ready-to-show', () => {
    splash.close()
    win.show()
  })

  server = spawn(php, ['-S', 'localhost:8000'], { cwd: join(__dirname, 'api', 'public') })

  server.stdout.on('data', (data) => console.log(data.toString()))
  server.stderr.on('data', (data) => console.error(data.toString()))

  server.on('spawn', () => setTimeout(() => win.loadURL('http://localhost:8000'), 1000))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

const quit = () => {
  try {
    server.kill('SIGTERM')

    server.on('close', () => {
      app.quit()
    })
  } catch (error) {
    console.error(error)
    app.quit()
  }
}

app.on('before-quit', quit)
app.on('window-all-closed', quit)

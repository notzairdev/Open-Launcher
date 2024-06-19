const { app, ipcMain, BrowserWindow, Menu, globalShortcut } = require("electron");
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main')

//Discord RPC
const DiscordRPC = require('discord-rpc')

const path = require("path");

//AutoUpdater
const { autoUpdater, AppUpdater } = require("electron-updater");
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

//Dotenv
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

//Providers
const { getXboxAuth } = require('./resources/providers/launcher.provider')
const { createConfiguration, readConfiguration } = require('./resources/providers/storage.provider')

let appWin = null;
let authWindow = null;

setupTitlebar()

createWindow = () => {
    appWin = new BrowserWindow({
        width: 1300,
        height: 650,
        frame: false,
        title: 'Open Launcher',
        // titleBarOverlay: true,
        resizable: false,
        maximizable: false,
        icon: path.resolve(__dirname, 'resources/icon', 'icon_app_2.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: `${__dirname}/preload.js`
        }
    });

    const menu = Menu.buildFromTemplate(exampleMenuTemplate)
    Menu.setApplicationMenu(menu)

    appWin.loadURL(`file://${__dirname}/../dist/client/browser/index.html`);

    // appWin.webContents.openDevTools();

    attachTitlebarToWindow(appWin)

    globalShortcut.register('CommandOrControl+Shift+I', () => {
        appWin.webContents.openDevTools();
    });

    appWin.on("closed", () => {
        appWin = null;
    });
}

createMicrosoftPopup = () => {
    authWindow = new BrowserWindow({
        width: 400,
        height: 600,
        autoHideMenuBar: true,
        title: 'Open Launcher - Microsoft Authentication',
        minimizable: false,
        maximizable: false,
        resizable: false,
        icon: path.resolve(__dirname, 'resources/icon', 'icon_app_2.png'),
        modal: true,
        parent: appWin,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    authWindow.loadURL('http://localhost:8080')

    authWindow.on('closed', () => {
        authWindow = null;
    })
}

function closeAuthWindow() {
    if (authWindow) {
        authWindow.close();
    } else {
        console.log("No hay ventana de autenticación abierta para cerrar.");
    }
}

app.on("ready", () => {
    createConfiguration();
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        rpc.destroy();
        app.quit();
    }
});

const exampleMenuTemplate = [
    {
        label: 'Test',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { type: 'separator' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { role: 'resetZoom' },
        ]
    }
]

//AutoUpdater
autoUpdater.on("update-available", (info) => {
    ipcMain.emit("update:available", {
        available: true,
        information: info
    });
})

autoUpdater.on("update-not-available", (info) => {
    ipcMain.emit("update:available", {
        available: false,
        information: info
    });
});

autoUpdater.on("update-downloaded", (progress) => {
    ipcMain.emit("update:downloaded", {
        downloaded: true,
        progress: progress
    });
});

//Discord RPC
const clientId = process.env.DISCORD_CLIENT;

DiscordRPC.register(clientId)

const rpc = new DiscordRPC.Client({
    transport: 'ipc'
})

const startTimestamp = new Date();

async function setActivity() {
    if (!rpc || !appWin) {
        return;
    }

    rpc.setActivity({
        details: 'Iniciando sesión en el launcher',
        largeImageKey: 'launchericon',
        largeImageText: 'Open Launcher',
        startTimestamp,
        instance: false
    });
}

// rpc.on('ready', () => {
//   setActivity();

//   setInterval(() => {
//     setActivity();
//   }, 15e3);
// });

// rpc.login({ clientId }).catch(console.error);

ipcMain.on("configuration:verify", async (event) => {
    const data = await readConfiguration();
    event.reply("configuration:reply", data);
})

ipcMain.on("configuration:updates", (event) => {
    autoUpdater.checkForUpdates();
});

ipcMain.on("discord:change", (event, args) => {
    // console.log(args)
})

ipcMain.on("auth:microsoft", async (event, args) => {
    // console.log(args)
    
    createMicrosoftPopup();
    const microsoftResponse = await getXboxAuth();

    if(microsoftResponse[0].isCancelled == true){
        closeAuthWindow();
    }

    event.reply("auth:microsoft:reply", { authData: microsoftResponse });
});

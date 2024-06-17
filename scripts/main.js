const { app, ipcMain, BrowserWindow, Menu } = require("electron");
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main')

//File data
const fs = require('fs')
const path = require('path')

//Discord RPC
const DiscordRPC = require('discord-rpc')

//AutoUpdater
const { autoUpdater, AppUpdater } = require("electron-updater");
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

//Storage data
const os = require('os');
const storage = require('electron-json-storage');
storage.setDataPath(path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'ApplicationData'));

//Dotenv
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

let appWin;
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

    appWin.on("closed", () => {
        appWin = null;
    });
}

function generateNewConfigurationJSON() {
    const downloadsDir = fs.existsSync(path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'DownloadData'))
    const instancesDir = fs.existsSync(path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'Instances'))
    const updatesDir = fs.existsSync(path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'Updates'))

    if (downloadsDir === false) {
        fs.mkdir(path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'DownloadData'), { recursive: true }, (err) => {
            if (err) throw err;
        });
    }

    if (instancesDir === false) {
        fs.mkdir(path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'Instances'), { recursive: true }, (err) => {
            if (err) throw err;
        });
    }

    if (updatesDir === false) {
        fs.mkdir(path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'Updates'), { recursive: true }, (err) => {
            if (err) throw err;
        });
    }

    storage.get('configuration', (error, data) => {
        if (error) throw error;

        const stringify = JSON.stringify(data)

        if (stringify === '{}') {
            const data = {
                init: true,
                currentVersion: '0.0.1',
                launcher: {
                    downloadsDir: path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'DownloadData'),
                    instances: path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'Instances'),
                    tempUpdates: path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'Updates'),
                }
            }

            storage.set('configuration', data, function (err) {
                if (err) throw err;
            })

            console.log("First time opening the app, generating new configuration file...");

        }
        else {
            console.log("Configuration file already exists, skipping generation...");
        }
    });
}

app.on("ready", () => {
    generateNewConfigurationJSON();

    autoUpdater.checkForUpdates();

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

//Discord RPC
const clientId = process.env.DISCORD_CLIENT;

DiscordRPC.register(clientId)

const rpc = new DiscordRPC.Client({
    transport: 'ipc'
})

async function setActivity() {
    if (!rpc || !appWin) {
        return;
    }

    rpc.setActivity({
        details: `Song name`,
        state: 'Artists name',
        smallImageKey: 'appicon',
        smallImageText: 'Aurora Music',
        instance: false,
    });
}

/* ipcMain is listening the "message" channel, and when the message arrives, 
it replies with "pong" */
ipcMain.on("message", (event) => event.reply("reply", "pong"));

ipcMain.on("configuration:verify", (event) => {
    storage.get('configuration', (error, data) => {
        if (error) throw error;

        event.reply("configuration:reply", data);
    });
})

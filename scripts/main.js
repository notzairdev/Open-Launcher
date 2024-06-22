const { app, ipcMain, BrowserWindow, Menu, globalShortcut } = require("electron");
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main')

const path = require("path");

//AutoUpdater
const { autoUpdater, AppUpdater } = require("electron-updater");
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

//Dotenv
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

//Providers
const { getXboxAuth } = require('./resources/providers/launcher.provider')
const { createConfiguration, readConfiguration, readManifestVersion } = require('./resources/providers/storage.provider')
const { closeConnection, onChange, createRPC } = require('./resources/providers/discord.provider')
const { listManifest, downloadAndInstall, executeInstance } = require('./resources/providers/versions.provider')

let appWin = null;

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

    attachTitlebarToWindow(appWin)

    globalShortcut.register('CommandOrControl+Shift+I', () => {
        appWin.webContents.openDevTools();
    });

    appWin.on("closed", () => {
        appWin = null;
    });
}

app.on("ready", () => {
    createConfiguration();
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        closeConnection();

        app.quit();
        process.exit(1);
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

ipcMain.on("configuration:verify", async (event) => {
    const data = await readConfiguration();
    event.reply("configuration:reply", data);
})

ipcMain.on("configuration:updates", (event) => {
    autoUpdater.checkForUpdates();
});

ipcMain.on("minecraft:versions", async (event) => {
    const returnable = await listManifest();

    if(returnable == null){
        event.reply("minecraft:versions:reply", { error: true });
    }
    else{
        event.reply("minecraft:versions:reply", returnable);
    }
});

ipcMain.on("minecraft:manifest", async (event) => {
    const returnable = await readManifestVersion();
    
    event.reply("minecraft:manifest:reply", returnable);
});

ipcMain.on("minecraft:install", async (event, args) => {
    try{
        await downloadAndInstall(args, (progress) => {
            event.reply("minecraft:install:progress", progress);
        });

        event.reply("minecraft:install:reply", { success: true });
    } catch (error){
        event.reply("minecraft:install:reply", { success: false, error: error });
    }
});

ipcMain.once("discord:init", async (event) => {
    try{
        await createRPC();

        event.reply("discord:init:reply", { success: true });
    }
    catch{
        event.reply("discord:init:reply", { success: false });
    }
});

ipcMain.on("discord:change", async (event, args) => {
    // console.log(args)
    try{
        await onChange(args.status, args.option);

        event.reply("discord:change:reply", { success: true });
    }
    catch{
        event.reply("discord:change:reply", { success: false });
    }
})

ipcMain.on("auth:microsoft", async (event, args) => {
    // console.log(args)
    
    // createMicrosoftPopup();
    const microsoftResponse = await getXboxAuth();

    if(microsoftResponse[0].isCancelled == true){
        event.reply("auth:microsoft:reply", { isCancelled: true });
    }
    else{
        event.reply("auth:microsoft:reply", { authData: microsoftResponse });
    }
});

ipcMain.on("minecraft:run", async (event, args) => {
    try{
        await executeInstance(args.version, (progress) => {
            // console.log(progress.code)
            if (progress.code === 'LAUNCHER_JVM_START'){
                appWin.minimize();
            }

            if (progress.code === 'LAUNCHER_JVM_STDOUT' && progress.chunk.includes('Stopping!')){
                appWin.restore();
            }
            
            event.reply("minecraft:run:progress", progress);
        });

        event.reply("minecraft:run:reply", { success: true });
    } 
    catch (error){
        event.reply("minecraft:run:reply", { success: false, error: error });
    }
});
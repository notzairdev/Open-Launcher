const { app, ipcMain, BrowserWindow, Menu, globalShortcut, shell, nativeImage, Tray } = require("electron");
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main')

const path = require("path");

//Dotenv
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

//Providers
const { getXboxAuth, createOfflineAuth, isOnlineSession, deleteCurrentSession } = require('./resources/providers/launcher.provider')
const { createConfiguration, readConfiguration, readManifestVersion, readLaunchManifest, isNew, verifyConfiguration, writeLastPlayed } = require('./resources/providers/storage.provider')
const { listManifest, downloadAndInstall, executeInstance, saveNewVersion } = require('./resources/providers/versions.provider')
const { checkNewUpdates } = require('./resources/providers/updates.provider')
const { saveTimePlayed } = require('./resources/providers/timestamp.provider');
const { initialize, destroy, onChange } = require("./resources/providers/discord.provider");
const { getEnvVersions } = require("./resources/providers/common.provider");
const { watchDiscord } = require("./resources/providers/watch.provider");

let appWin = null;

setupTitlebar()

createWindow = () => {
    appWin = new BrowserWindow({
        width: 1300,
        height: 650,
        frame: false,
        title: 'Open Launcher (BETA)',
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
        appWin.webContents.openDevTools()
    });

    appWin.on("closed", () => {
        appWin = null;
    });
}

app.on("ready", () => {
    createWindow();
    
    let icon = nativeImage.createFromPath(path.resolve(__dirname, 'resources/icon', 'icon_app_2.png'));
    icon.resize({ width: 16, height: 16 });
    tray = new Tray(icon);

    tray.setToolTip('Open Launcher (BETA)');

    tray.on('click', () => {
        if(!appWin.isVisible()){
            appWin.show();
        }
    })
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        // closeConnection();
        destroy();
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

ipcMain.on("configuration:new", async (event, args) => {
    const _result = await isNew();

    event.reply("configuration:new:reply", { result: _result })
});

ipcMain.on("configuration:create", async (event, args) => {
    try{
        await createConfiguration(app.getVersion());

        event.reply("configuration:create:reply", { success: true });
    }
    catch{
        event.reply("configuration:create:reply", { success: false });
    }
});

ipcMain.on("configuration:directory", async (event, args) => {
    try{
        await verifyConfiguration();
        event.reply("configuration:directory:reply", { success: true });
    }
    catch{
        event.reply("configuration:directory:reply", { success: false });
    }
});

ipcMain.on("configuration:verify", async (event) => {
    const data = await readConfiguration();
    const versions = await readManifestVersion();
    event.reply("configuration:reply", { data: JSON.parse(data), versions: JSON.parse(versions) });
})

ipcMain.on("configuration:online", async (event) => {
    const _result = await isOnlineSession();

    event.reply("configuration:online:reply", { result: _result })
})

ipcMain.on("configuration:launch", async (event) => {
    try{
        const results = await readLaunchManifest();

        event.reply("configuration:launch:reply", { success: true, data: results });
    }
    catch{
        event.reply("configuration:launch:reply", { success: false });
    }
})

ipcMain.on("configuration:updates", async (event, args) => {
    try {
        await checkNewUpdates(args, (returnable) => {
            event.reply("configuration:updates:reply", returnable);
        });

        // event.reply("configuration:updates:reply", { success: true });
    }
    catch {
        event.reply("configuration:updates:reply", { success: false });
    }
});

ipcMain.on("common:versions", async (event) => {
    const returnable = await getEnvVersions();
    event.reply("common:versions:reply", returnable);
})

ipcMain.on("common:close-app", async () => {
    await destroy();
    app.quit();
    process.exit(1);
})

ipcMain.on("common:openWindow", (event, args) => {
    shell.openPath(args.url);
})

ipcMain.on("common:restart", () => {
    app.relaunch();
    app.quit();
    process.exit(1);
})

ipcMain.once("discord:init", (event) => {
    try{
        watchDiscord(async (isRunning) => {
            if(isRunning){
                await initialize().then(() => {
                    event.reply("discord:init:reply", { success: true });
                }).catch((e) => {
                    throw new Error(e);
                });
            }
            else{
                event.reply("discord:init:reply", { success: false });
            }
        });
    }
    catch{
        event.reply("discord:init:reply", { success: false });
    }
});

ipcMain.on("discord:change", async (event, args) => {
    // console.log(args)
    try{
        await onChange(args.status, args.option).then(() => {
            event.reply("discord:change:reply", { success: true });
        }).catch((e) => { throw new Error(e) });

    }
    catch{
        event.reply("discord:change:reply", { success: false });
    }
})

ipcMain.on("auth:microsoft", async (event) => {
    const microsoftResponse = await getXboxAuth();

    if(microsoftResponse[0].isCancelled == true){
        event.reply("auth:microsoft:reply", { isCancelled: true });
    }
    else{
        event.reply("auth:microsoft:reply", { authData: microsoftResponse });
    }
});

ipcMain.on("auth:delete", async (event) => {
    try{
        await deleteCurrentSession();
        event.reply("auth:delete:reply", { success: true });
    }
    catch{
        event.reply("auth:delete:reply", { success: false });
    }
});

ipcMain.on("auth:offline", async (event, args) => {
    try{
        await createOfflineAuth(args.username);

        event.reply("auth:offline:reply", { success: true });
    }
    catch{
        event.reply("auth:offline:reply", { success: false });
    }
});

ipcMain.on("minecraft:versions", async (event) => {
    const returnable = await listManifest();

    if (returnable == null) {
        event.reply("minecraft:versions:reply", { error: true });
    }
    else {
        event.reply("minecraft:versions:reply", returnable);
    }
});

ipcMain.on("minecraft:manifest", async (event) => {
    const returnable = await readManifestVersion();

    event.reply("minecraft:manifest:reply", returnable);
});

ipcMain.on("minecraft:new", async (event, args) => {
    try{
        await saveNewVersion(args);
        event.reply("minecraft:new:reply", { success: true });
    }
    catch{
        event.reply("minecraft:new:reply", { success: false });
    }
});

ipcMain.on("minecraft:install", async (event, args) => {
    try {
        await downloadAndInstall(args, (progress) => {
            event.reply("minecraft:install:progress", progress);
        });

        event.reply("minecraft:install:reply", { success: true });
    } catch (error) {
        event.reply("minecraft:install:reply", { success: false, error: error });
    }
});

ipcMain.on("minecraft:run", async (event, args) => {
    try{
        await executeInstance(args.version, async (progress) => {
            // console.log(progress.code)
            if (progress.code === 'LAUNCHER_JVM_START'){
                // appWin.minimize();
                appWin.hide();
            }

            if (progress.code === 'LAUNCHER_JVM_STDOUT' && progress.chunk.includes('Stopping!')){
            //     appWin.restore();
                await writeLastPlayed(args.version)
            }
            
            event.reply("minecraft:run:progress", progress);
        });

        event.reply("minecraft:run:reply", { success: true });
    } 
    catch (error){
        event.reply("minecraft:run:reply", { success: false, error: error });
    }
});

ipcMain.on("minecraft:time", async (event, args) => {
    try{
        await saveTimePlayed(args.version, args.date);
        event.reply("minecraft:time:reply", { success: true });
    }
    catch{
        event.reply("minecraft:time:reply", { success: false });
    }
});
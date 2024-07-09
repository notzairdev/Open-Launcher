//Logger
const log = require('electron-log');

//AutoUpdater
const { autoUpdater } = require("electron-updater");
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

//AutoUpdater
function checkNewUpdates(args, callback){
    return new Promise((resolve, reject) => {
        
        autoUpdater.on("update-available", (info) => {
            log.info("Update available, SHA512: " + info.sha512);
            callback({isAvailable: true, data: info})
            resolve();
        })

        autoUpdater.on("update-not-available", () => {
            log.info("Update not available");
            callback({isAvailable: false})
            resolve();
        });

        autoUpdater.on("update-downloaded", (data) => {
            callback({isDownloaded: true, data: data})
            resolve();
        });

        autoUpdater.on("checking-for-update", () => log.info("Checking for update"))

        autoUpdater.on("download-progress", (progress) => {
            callback({isDownloading: true, progress: progress})
        });

        autoUpdater.on('error', (error) => {
            log.error(error);
            callback({error: true})
            reject(error)
        });

        if(args.activity === 0){
            autoUpdater.checkForUpdates();
        }
        else if(args.activity === 1){
            autoUpdater.downloadUpdate();
        }
        else if(args.activity === 2){
            autoUpdater.quitAndInstall(true, true);
        }
        else{
            log.error("Invalid activity provided.");
            callback({error: true})
            reject("Invalid activity")
        }

    })
}

module.exports = {
    checkNewUpdates
}
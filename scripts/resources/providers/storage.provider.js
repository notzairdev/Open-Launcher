const os = require('os');
const fs = require('fs')
const path = require('path')

const storage = require('electron-json-storage');
const fullPath = path.join(os.homedir(), 'Aurora', 'MinecraftLauncher')

storage.setDataPath(path.join(fullPath, 'ApplicationData'));

function createConfiguration() {

    const downloadsPath = path.join(fullPath, 'DownloadData')
    const instancesPath = path.join(fullPath, 'Instances')
    const updatesPath = path.join(fullPath, 'Updates')

    const downloadsDir = fs.existsSync(downloadsPath)
    const instancesDir = fs.existsSync(instancesPath)
    const updatesDir = fs.existsSync(updatesPath)

    if (downloadsDir === false) {
        fs.mkdir(downloadsPath, { recursive: true }, (err) => {
            if (err) throw err;
        });
    }

    if (instancesDir === false) {
        fs.mkdir(instancesPath, { recursive: true }, (err) => {
            if (err) throw err;
        });
    }

    if (updatesDir === false) {
        fs.mkdir(updatesPath, { recursive: true }, (err) => {
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
                    downloadsDir: downloadsPath,
                    instances: instancesPath,
                    tempUpdates: updatesPath,
                },
                account: {
                    active: false,
                    data: {}
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

function readConfiguration(){
    return new Promise((resolve) => {
        storage.get('configuration', (error, data) => {
            if (error) throw error;
            resolve(data)
        });
    })
}

function modifyConfiguration(newData){
    return new Promise(async (resolve, reject) => {
        storage.set('configuration', newData, function (err) {
            if (err) reject(err);

            resolve(true)
        });
    })
}

module.exports = {
    createConfiguration,
    readConfiguration,
    modifyConfiguration
}
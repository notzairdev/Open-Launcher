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
                },
                manifest: {
                    directory: path.join(fullPath, 'ApplicationData', 'manifest.json'),
                }
            }

            storage.set('configuration', data, function (err) {
                if (err) throw err;
            })

            storage.set('manifest', { "versions": [], "lastplayed": null }, function (err) {
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

function readManifestVersion(){
    return new Promise(async (resolve, reject) => {
        storage.get('manifest', (error, data) => {
            if (error) reject(error);
            
            const stringify = JSON.stringify(data)
            
            resolve(stringify)
        });
    });
}

function writeManifestVersion(newVersion){
    return new Promise(async (resolve, reject) => {
        const currentManifest = JSON.parse(await readManifestVersion());
        const versionTree = currentManifest.versions;

        if(versionTree.length != 0){
            for (let i = 0; i < versionTree.length; i++) {
                if (versionTree[i].id == newVersion.id) {
                    versionTree[i].currentState = newVersion.currentState;
                }
            }
        }
        else{
            versionTree.push(newVersion);
        }

        currentManifest.versions = versionTree;

        storage.set('manifest', currentManifest, function (err) {
            if (err) reject(err);

            resolve(true)
        });
    });
}

function readCurrentTickInstall(versionId){
    return new Promise(async (resolve) => {
        const currentManifest = JSON.parse(await readManifestVersion());
        const versionTree = currentManifest.versions;

        if(versionTree.length != 0){
            for (let i = 0; i < versionTree.length; i++) {
                if (versionTree[i].id == versionId) {
                    resolve(versionTree[i].currentState);
                }
                else{
                    resolve(0);
                }
            }
        }
        else{
            resolve(0);
        }
    });

}

function writeLastPlayed(newVersion){
    return new Promise(async (resolve, reject) => {
        
        const currentManifest = JSON.parse(await readManifestVersion());
        currentManifest.lastplayed = newVersion;

        storage.set('manifest', currentManifest, function (err) {
            if (err) reject(err);

            resolve(true)
        });
    });

}

module.exports = {
    createConfiguration,
    readConfiguration,
    modifyConfiguration,
    readManifestVersion,
    writeManifestVersion,
    writeLastPlayed,
    readCurrentTickInstall
}
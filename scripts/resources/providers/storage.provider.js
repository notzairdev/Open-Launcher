const os = require('os');
const fs = require('fs')
const path = require('path')

const storage = require('electron-json-storage');
const fullPath = path.join(os.homedir(), 'Aurora', 'MinecraftLauncher')

storage.setDataPath(path.join(fullPath, 'ApplicationData'));

function createConfiguration(currentAppVersion) {
    return new Promise(async (resolve, reject) => {

        const downloadsPath = path.join(fullPath, 'DownloadData')
        const instancesPath = path.join(fullPath, 'Instances')
        const updatesPath = path.join(fullPath, 'Updates')

        const downloadsDir = fs.existsSync(downloadsPath)
        const instancesDir = fs.existsSync(instancesPath)
        const updatesDir = fs.existsSync(updatesPath)

        if (downloadsDir === false) {
            fs.mkdir(downloadsPath, { recursive: true }, (err) => {
                if (err) reject();
            });
        }

        if (instancesDir === false) {
            fs.mkdir(instancesPath, { recursive: true }, (err) => {
                if (err) reject();
            });
        }

        if (updatesDir === false) {
            fs.mkdir(updatesPath, { recursive: true }, (err) => {
                if (err) reject();
            });
        }

        const data = {
            currentVersion: currentAppVersion,
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
            },
            launchOptions: {
                directory: path.join(fullPath, 'ApplicationData', 'launch.json'),
            }
        }

        const launchOptions = {
            options: {
                ram: 4096,
                hide: true
            }
        };

        storage.set('configuration', data, function (err) {
            if (err) reject();
        })

        storage.set('manifest', { "versions": [], "lastplayed": null }, function (err) {
            if (err) reject();
        })

        storage.set('launch', launchOptions, function (err) {
            if (err) reject();
        })

        console.log("First time opening the app, generating new configuration file...");
        resolve()
    });
}

function verifyConfiguration(){
    return new Promise(async (resolve, reject) => {
        const downloadsPath = path.join(fullPath, 'DownloadData')
        const instancesPath = path.join(fullPath, 'Instances')
        const updatesPath = path.join(fullPath, 'Updates')

        const downloadsDir = fs.existsSync(downloadsPath)
        const instancesDir = fs.existsSync(instancesPath)
        const updatesDir = fs.existsSync(updatesPath)

        if (downloadsDir === false) {
            fs.mkdir(downloadsPath, { recursive: true }, (err) => {
                if (err) reject();
            });
        }

        if (instancesDir === false) {
            fs.mkdir(instancesPath, { recursive: true }, (err) => {
                if (err) reject();
            });
        }

        if (updatesDir === false) {
            fs.mkdir(updatesPath, { recursive: true }, (err) => {
                if (err) reject();
            });
        }

        resolve();
    });
}

function isNew(){
    return new Promise((resolve) => {
        const bool = fs.existsSync(path.join(fullPath));
        resolve(bool);
    })
}

function readConfiguration(){
    return new Promise((resolve) => {
        storage.get('configuration', (error, data) => {
            if (error) throw error;

            const stringify = JSON.stringify(data)
            
            resolve(stringify)
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

function writeNewVersion(version){
    return new Promise(async (resolve, reject) => {
        const currentManifest = JSON.parse(await readManifestVersion());
        const versionTree = currentManifest.versions;

        if(versionTree.length != 0){
            for(let i = 0; i < versionTree.length; i++){
                if(versionTree[i].id == version.id){
                    break;
                }
                else{
                    versionTree.push(version);
                }
            }
        }
        else{
            versionTree.push(version);
        }

        currentManifest.versions = versionTree;

        storage.set('manifest', currentManifest, function (err) {
            if (err) reject(err);

            resolve(true)
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
                    // break;
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

function saveNewTimes(time, index){
    return new Promise(async (resolve, reject) => {
        const currentManifest = JSON.parse(await readManifestVersion());
        const versionTree = currentManifest.versions;

        versionTree[index].timePlayed = time;

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

function deleteVersionManifest(version){
    return new Promise((resolve, reject) => {
        storage.get('manifest', (error, data) => {
            if (error) reject(error);

            const stringify = JSON.stringify(data)
            const parsed = JSON.parse(stringify)

            const versions = parsed.versions

            const filtered = versions.filter((item) => item.id !== version)

            parsed.versions = filtered

            storage.set('manifest', parsed, function (err) {
                if (err) reject(err);

                resolve(true)
            });
        });
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

function readLaunchManifest(){
    return new Promise(async (resolve, reject) => {
        storage.get('launch', (error, data) => {
            if (error) reject(null);

            const stringify = JSON.stringify(data)

            resolve(stringify)
        });
    })
}

module.exports = {
    isNew,
    verifyConfiguration,
    createConfiguration,
    readConfiguration,
    modifyConfiguration,
    readManifestVersion,
    writeManifestVersion,
    writeLastPlayed,
    readCurrentTickInstall,
    writeNewVersion,
    readLaunchManifest,
    saveNewTimes
}
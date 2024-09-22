const _path = require('path')
const os = require('os')

const fullPath = _path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'ApplicationData')

const gmll = require("gmll");

const { readConfiguration, writeManifestVersion, readCurrentTickInstall, writeNewVersion } = require('./storage.provider');
const { refreshMinecraftToken } = require('./launcher.provider');

function listManifest(){
    return new Promise(async (resolve) => {
        try{
            const requireToMeta = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
            if (requireToMeta.status !== 200) return resolve(null);
            const json = await requireToMeta.json();

            let versions = [];
            for (let i = 0; i < json.versions.length; i++) {
                if (json.versions[i].type == "release") {
                    versions.push(json.versions[i]);
                }
            }

            resolve(versions);
        }
        catch (e){
            resolve(null);
        }
    })
}

function downloadAndInstall(version, progressCallback){
    return new Promise(async (resolve, reject) => {
        let savedPayloads = await readCurrentTickInstall(version.version);
        let currentPayloads = 0;
        // let saveNumber = 0;

        const configuration = JSON.parse(await readConfiguration());
        const instancesPath = configuration.launcher.instances;
        console.log(instancesPath)

        gmll.config.setLauncherName('Open Launcher')
        gmll.config.setInstances(instancesPath);
        gmll.config.setRoot(_path.join(fullPath, 'launcher'))
        
        gmll.init().then(async () => {
            const instance = new gmll.Instance({ version: version.version })
            const getDir = instance.getDir();

            gmll.config.getEventListener().on('download.setup', async () => {
                progressCallback({ code: 'LAUNCHER_STARTING', payloads: currentPayloads })
            })
            gmll.config.getEventListener().on('download.progress', (key, index, total, left) => {
                progressCallback({ code: 'LAUNCHER_DOWNLOADING', file: key, index: index, totalfiles: total, remaining: left })
            })
            gmll.config.getEventListener().on('download.done', async () => {
                currentPayloads++;
                
                if (currentPayloads === 3) {
                    progressCallback({ code: 'LAUNCHER_FINISHED', tick: 4 })
                    await writeManifestVersion({ id: version.version, directory: getDir.path.join('\\'), currentState: 4, timePlayed: null });
                    resolve(true)
                }
                else{
                    await writeManifestVersion({ id: version.version, directory: getDir.path.join('\\'), currentState: currentPayloads, timePlayed: null });
                }
            });

            gmll.config.getEventListener().on('download.fail', (key, type, error) => {
                if(type == 'fail' || type == 'system'){
                    progressCallback({ code: 'LAUNCHER_FAILED', file: key, type: type, error: error })
                    reject('Failed to download file')
                }
            })

            try{
                instance.install();
            }
            catch{}
        });
    })
}

function saveNewVersion(version){
    return new Promise(async (resolve, reject) => {
        try{
            const instance = new gmll.Instance({ version: version.version })
            const getDir = instance.getDir();

            await writeNewVersion({ id: version.version, directory: getDir.path.join('\\'), currentState: 0, timePlayed: null });
            resolve(true)
        }
        catch{
            reject('Failed to save new version')
        }
    })
}

function executeInstance(version, callbackExecution){
    return new Promise(async (resolve, reject) => {
        const response = await refreshMinecraftToken();
        
        if(response == false){
            callbackExecution({ code: 'LAUNCHER_FAILED_AUTH', error: 'Failed to refresh token' });
            reject('Failed to refresh token');
        }
        else{
            callbackExecution({ code: 'LAUNCHER_STARTING_MC' });

            const configuration = JSON.parse(await readConfiguration());
            const instancesPath = configuration.launcher.instances;

            gmll.config.setRoot(_path.join(fullPath, 'launcher'))
            gmll.config.setInstances(instancesPath);
            gmll.config.setLauncherName('Open Launcher')

            gmll.init().then(async () => {
                const instance = new gmll.Instance({ version: version, ram: 4 })

                try {
                    gmll.config.getEventListener().on('jvm.start', (app, cwd) => {
                        callbackExecution({ code: 'LAUNCHER_JVM_START', app: app, cwd: cwd })
                    })

                    gmll.config.getEventListener().on('jvm.stdout', (app, chunk) => {
                        const bytes = new Uint8Array(chunk);
                        const chunkStringfly = new TextDecoder("utf-8").decode(bytes);
                        callbackExecution({ code: 'LAUNCHER_JVM_STDOUT', app: app, chunk: chunkStringfly })

                        if(chunkStringfly.includes('Stopping!')){
                            resolve(true)
                        }
                    })

                    instance.launch(response)
                }
                catch (e) {
                    reject(e)
                }
            });
        }
    })
}

module.exports = {
    listManifest,
    downloadAndInstall,
    saveNewVersion,
    executeInstance
}
const _path = require('path')
const os = require('os')

const fullPath = _path.join(os.homedir(), 'Aurora', 'MinecraftLauncher', 'ApplicationData')

const gmll = require("gmll");

const { readConfiguration, writeManifestVersion, readCurrentTickInstall } = require('./storage.provider');
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
        let countPayloads = 0;
        let isSecondCondition = false;

        const configuration = await readConfiguration();
        const instancesPath = configuration.launcher.instances;

        gmll.config.setRoot(_path.join(fullPath, 'launcher'))
        gmll.config.setInstances(instancesPath);
        
        gmll.init().then(async () => {
            const instance = new gmll.Instance({ version: version.version })

            try{
                gmll.config.getEventListener().on('download.progress', (key, index, total, left) => {
                    progressCallback({ code: 'LAUNCHER_DOWNLOADING', file: key, index: index, totalfiles: total, remaining: left })
                })

                gmll.config.getEventListener().on('download.setup', async () => {
                    progressCallback({ code: 'LAUNCHER_STARTING', tick: countPayloads })
                    console.log('Starting download -------------------------------------------')
                    isSecondCondition = true;
                    
                    const getDir = instance.getDir();
                    await writeManifestVersion({ id: version.version, directory: getDir.path.join('\\'), currentState: countPayloads });

                    countPayloads++;
                })

                gmll.config.getEventListener().on('download.done', async () => {

                    progressCallback({ code: 'LAUNCHER_FINISHED', tick: countPayloads })

                    if(countPayloads == 2){                        
                        const getDir = instance.getDir();

                        await writeManifestVersion({ id: version.version, directory: getDir.path.join('\\'), currentState: 3 });
                        
                        resolve(true)
                    }
                });

                gmll.config.getEventListener().on('download.fail', (key, type, error) => {
                    if(type == 'fail' || type == 'system'){
                        progressCallback({ code: 'LAUNCHER_FAILED', file: key, type: type, error: error })
                    }
                })

                instance.install();
            }
            catch (e){
                reject(e)
            }
        });
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

            const configuration = await readConfiguration();
            const instancesPath = configuration.launcher.instances;

            gmll.config.setRoot(_path.join(fullPath, 'launcher'))
            gmll.config.setInstances(instancesPath);

            gmll.init().then(async () => {
                const instance = new gmll.Instance({ version: version })

                try {
                    gmll.config.getEventListener().on('jvm.start', (app, cwd) => {
                        callbackExecution({ code: 'LAUNCHER_JVM_START', app: app, cwd: cwd })
                    })

                    gmll.config.getEventListener().on('jvm.stdout', (app, chunk) => {
                        const bytes = new Uint8Array(chunk);
                        const chunkStringfly = new TextDecoder("utf-8").decode(bytes);
                        callbackExecution({ code: 'LAUNCHER_JVM_STDOUT', app: app, chunk: chunkStringfly })
                    })

                    instance.launch(response);
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
    executeInstance
}
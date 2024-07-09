const { readManifestVersion, saveNewTimes } = require('./storage.provider');

function getTimePlayed(version) {
    return new Promise(async (resolve) => {
        const manifest = JSON.parse(await readManifestVersion());

        for (let i = 0; i < manifest.versions.length; i++) {
            if (manifest.versions[i].id == version) {
                if (manifest.versions[i].timePlayed == null) {
                    resolve(0);
                }
                else {
                    resolve(manifest.versions[i].timePlayed);
                }
            }
        }
    });
}

function getIndex(manifest, version){
    return new Promise(async (resolve) => {
        const manifest = JSON.parse(await readManifestVersion());
        for (let i = 0; i < manifest.versions.length; i++) {
            if (manifest.versions[i].id == version) {
                resolve(i);
            }
        }
    });
}

async function saveTimePlayed(version, date){
    return new Promise(async (resolve, reject) => {
        const manifest = JSON.parse(await readManifestVersion());
        const index = await getIndex(manifest, version);

        const savedTime = await getTimePlayed(version);
        const current = Date.now();

        const newTime = savedTime + (current - date);

        try {
            await saveNewTimes(newTime, index);
            resolve(true);
        }
        catch (e) {
            console.error(e)
            reject(false);
        }
    });
}

module.exports = {
    saveTimePlayed
}
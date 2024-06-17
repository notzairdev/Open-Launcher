const _path = require('path')
const _fs = require('fs-extra');

async function listManifest(){
    return new Promise(async (resolve) => {
        const requireToMeta = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
        const json = await requireToMeta.json();
        
        resolve(json);
    })
}
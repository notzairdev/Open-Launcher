const packagejson = require('../../../package.json');

function getEnvVersions(){
    return {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        angular: packagejson.dependencies['@angular/core'].replace('^',''),
        updater: packagejson.dependencies['electron-updater'].replace('^',''),
    }
}

module.exports = {
    getEnvVersions
}
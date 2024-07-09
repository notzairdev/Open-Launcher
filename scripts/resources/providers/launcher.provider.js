const { Auth } = require('msmc')
const { modifyConfiguration, readConfiguration } = require('./storage.provider');

async function getXboxAuth() {
    return new Promise(async (resolve) => {

        try{
            const authManager = new Auth("select_account");
            const xboxManager = await authManager.launch("raw");
            const token = await xboxManager.getMinecraft();
            
            if(!token){
                throw new Error("Failed to get Minecraft token");
            }
            
            const currentPacket = JSON.parse(await readConfiguration());

            if (!currentPacket) {
                throw new Error("Failed to read configuration");
            }

            currentPacket.account.active = true;
            currentPacket.account.data = token;

            const _isEditable = await modifyConfiguration(currentPacket);

            if (!_isEditable) {
                throw new Error("Failed to modify configuration");
            }
            
            resolve([{ isCancelled: false, account: token }]);
        }
        catch(e){
            console.log(e)
            resolve([{isCancelled: true}]);
        }

    })
}

function refreshMinecraftToken(){
    return new Promise(async (resolve) => {
        const configurationJson = JSON.parse(await readConfiguration());
        const data = configurationJson.account.data;
        
        if(!data.openlauncher){
            const token = data.parent.msToken.refresh_token;

            try {
                const authManager = new Auth('login').refresh(token);
                const xbxManager = (await authManager).validate();

                if (xbxManager == true) {
                    const tokenObject = await (await authManager).getMinecraft();
                    resolve(tokenObject.gmll());
                }
                else {
                    resolve(false);
                }
            }
            catch (e) {
                resolve(null);
            }
        }
        else{
            resolve(data.openlauncher.username);            
        }
    })
}

function createOfflineAuth(name){
    return new Promise(async (resolve) => {
        try{
            const currentPacket = JSON.parse(await readConfiguration());
            currentPacket.account.active = true;
            currentPacket.account.data = {
                openlauncher: {
                    username: name
                }
            }

            const _isEditable = await modifyConfiguration(currentPacket);

            if (!_isEditable) {
                throw new Error("Failed to modify configuration");
            }

            resolve([{ isCancelled: false, account: token }]);
        }
        catch {
            resolve([{isCancelled: true}]);
        }
    })

}

function isOnlineSession(){
    return new Promise(async (resolve) => {
        try{
            // const data = await fetch('https://http.cat/200')
            // if(data.status !== 200){
            //     resolve(false)
            // }
            // else{
            //     resolve(true)
            // }
            resolve(false)
        }
        catch{
            resolve(false)
        }
    })
}

function deleteCurrentSession(){
    return new Promise(async (resolve) => {
        const currentPacket = JSON.parse(await readConfiguration());
        currentPacket.account.active = false;
        currentPacket.account.data = null;

        const _isEditable = await modifyConfiguration(currentPacket);

        if (!_isEditable) {
            throw new Error("Failed to modify configuration");
        }

        resolve(true);
    })

}

module.exports = {
    getXboxAuth,
    refreshMinecraftToken,
    createOfflineAuth,
    deleteCurrentSession,
    isOnlineSession
}
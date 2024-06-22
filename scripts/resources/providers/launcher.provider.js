const { Auth, Xbox } = require('msmc')
const { modifyConfiguration, readConfiguration } = require('./storage.provider')

async function getXboxAuth() {
    return new Promise(async (resolve) => {

        try{
            const authManager = new Auth("select_account");
            const xboxManager = await authManager.launch("raw");
            const token = await xboxManager.getMinecraft();
            
            if(!token){
                throw new Error("Failed to get Minecraft token");
            }
            
            const currentPacket = await readConfiguration();

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
        const configurationJson = await readConfiguration();
        const data = configurationJson.account.data;
        const token = data.parent.msToken.refresh_token;

        try{
            const authManager = new Auth('login').refresh(token);
            const xbxManager = (await authManager).validate();
            
            if(xbxManager == true){
                const tokenObject = (await authManager).getMinecraft();
                resolve(tokenObject);
            }
            else{
                resolve(false);
            }
        }
        catch(e){
            console.log(e);
            resolve(null);
        }

    })
}

module.exports = {
    getXboxAuth,
    refreshMinecraftToken
}
const _auth = require('minecraft-auth')
const { modifyConfiguration, readConfiguration } = require('./storage.provider')

require('dotenv').config({path: '../../.env'})

async function getXboxAuth() {
    return new Promise(async (resolve) => {
        const MicrosoftAuth = _auth.MicrosoftAuth;

        let account = new _auth.MicrosoftAccount();
        console.log("Client ID:", process.env.MICROSOFT_CLIENTID);
        console.log("App Secret:", process.env.MICROSOFT_APPSECRET);
        MicrosoftAuth.setup({
            appID: process.env.MICROSOFT_CLIENTID,
            appSecret: process.env.MICROSOFT_APPSECRET,
        });

        try {
            let pkce = MicrosoftAuth.generatePKCEPair();
            let code = await MicrosoftAuth.listenForCode({pkcePair: pkce});

            if (code !== undefined) {
                await account.authFlow(code);
                
                const currentDataFile = await readConfiguration();
                
                currentDataFile.account.data = account;

                const _editable = await modifyConfiguration(currentDataFile);

                if(_editable === false) throw new Error("Failed to modify configuration file");

                console.log(account)

                resolve([{isCancelled: false, account: account}]);
            }
        } catch (exception) {
            console.error(exception);
            resolve([{
                isCancelled: true,
                reason: exception
            }])
        }
    })
}

module.exports = {
    getXboxAuth
}
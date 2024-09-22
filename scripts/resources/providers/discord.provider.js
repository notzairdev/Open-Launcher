const DiscordRPC = require('discord-rpc')
require('dotenv').config({path: '../../.env'});

const clientID = process.env.DISCORD_CLIENT;

DiscordRPC.register(clientID);
let rich;

function setActivity(){
    if (!rich) {
        return false;
    }

    rich.setActivity({
        details: 'Iniciando launcher...',
        largeImageKey: 'icon',
        largeImageText: 'Open Launcher (BETA)',
        instance: false
    });
}

function initialize(){
    return new Promise((resolve, reject) => {
        try{
            rich = new DiscordRPC.Client({ transport: 'ipc' });

            rich.on('ready', () => {
                console.log('Discord RPC is ready');
            })

            rich.login({ clientId: clientID }).then(() => {
                setActivity();

                resolve(true);
            }).catch((e) => {
                reject('RPC error: ' + e);
            });

        }
        catch (e){
            reject('RPC error: ' + e);
        }
    });
}

function onChange(newActivity, option){
    return new Promise((resolve, reject) => {
        try {
            if (!rich) {
                reject('RPC change error: Discord RPC is not initialized.');
            }

            const startTimestamp = new Date();

            if (option == 0) {
                rich.setActivity({
                    details: newActivity[0],
                    largeImageKey: 'icon',
                    largeImageText: 'Open Launcher (BETA)',
                    instance: false
                });
            }
            else if (option == 1) {
                rich.setActivity({
                    details: newActivity[0],
                    startTimestamp,
                    largeImageKey: 'minecraft',
                    largeImageText: 'Minecraft ' + newActivity[1],
                    smallImageKey: 'icon',
                    smallImageText: 'Open Launcher (BETA)',
                    instance: false
                });
            }
            else {
                reject('Is not a available option...');
            }

            resolve(true)
        }
        catch (e) {
            reject('RPC change error: ' + e);
        }
    })
}

function destroy(){
    return new Promise((resolve, reject) => {
        try {
            if (rich) {
                rich.destroy().then(() => {
                    resolve(true);
                }).catch((e) => {
                    reject('RPC destroy error: ' + e);
                });
            }
            else{
                resolve(true);
            }
        }
        catch (e) {
            reject('RPC destroy error: ' + e);
        }
    });
}

module.exports = {
    initialize,
    destroy,
    onChange
};
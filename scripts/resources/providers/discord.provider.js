// const DiscordRPC = require('discord-rpc')
require('dotenv').config({path: '../../.env'});

const clientID = process.env.DISCORD_CLIENT;

const discord = require('discord-rich-presence')(clientID);

// let rich;

function setActivity(){
    if (!discord) {
        return false;
    }

    const startTimestamp = new Date();

    // rich.setActivity({
    //     details: 'Iniciando launcher...',
    //     largeImageKey: 'launchericon',
    //     largeImageText: 'Open Launcher',
    //     startTimestamp,
    //     instance: false
    // });

    discord.updatePresence({
        details: 'Iniciando launcher...',
        largeImageKey: 'icon',
        largeImageText: 'Open Launcher',
        startTimestamp,
        instance: false
    })

    return true;
}

function createRPC(){
    return new Promise((resolve, reject) => {
        try{
            discord.updatePresence({
                details: 'Iniciando launcher...',
                largeImageKey: 'icon',
                startTimestamp: startTimestamp,
                instance: false
            })

            resolve(true);
        }
        catch (e){
            reject('RPC error: ' + e);
        }
    });
}

function onChange(newActivity, option){
    return new Promise((resolve, reject) => {
        try {
            if (!discord) {
                reject('RPC change error: Discord RPC is not initialized.');
            }

            const startTimestamp = new Date();

            if (option == 0) {
                // rich.setActivity({
                //     details: newActivity[0],
                //     largeImageKey: 'launchericon',
                //     largeImageText: 'Open Launcher',
                //     startTimestamp,
                //     instance: false
                // });
                discord.updatePresence({
                    details: newActivity[0],
                    largeImageKey: 'launchericon',
                    largeImageText: 'Open Launcher',
                    startTimestamp: startTimestamp,
                    instance: false
                })
            }
            else if (option == 1) {
                // rich.setActivity({
                //     details: newActivity[0],
                //     startTimestamp,
                //     largeImageKey: 'minecraft',
                //     largeImageText: 'Minecraft ' + newActivity[1],
                //     smallImageKey: 'launchericon',
                //     smallImageText: 'Open Launcher',
                //     instance: false
                // });
                discord.updatePresence({
                    details: newActivity[0],
                    startTimestamp: startTimestamp,
                    largeImageKey: 'minecraft',
                    largeImageText: 'Minecraft ' + newActivity[1],
                    smallImageKey: 'launchericon',
                    smallImageText: 'Open Launcher',
                    instance: false
                })
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

function closeConnection(){
    if(discord){
        discord.disconnect();
    }
}

module.exports = {
    createRPC,
    closeConnection,
    onChange
};
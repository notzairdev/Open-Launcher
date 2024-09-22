const ps = require('ps-node');

function watchDiscord(callback) {
    ps.lookup({
        command: 'Discord'
    }, (err, resultList) => {
        if(err){
            throw new Error(err);
        }

        const isRunning = resultList.length > 0;
        callback(isRunning);
    })
}

module.exports = { watchDiscord };
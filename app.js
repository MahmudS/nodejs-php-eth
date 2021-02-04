let helper = require('./helper');

// if (process.platform === "win32") {
//     let rl = require("readline").createInterface({
//         input: process.stdin,
//         output: process.stdout
//     });
//     rl.on("SIGINT", function () {
//         process.emit("SIGINT");
//     });
// }

// process.on("SIGINT", function () {
//     helper.setStop(true);
//     console.log('Stop command called');
//     helper.savePrivateKeyToFile('exit');
// });


function start()
{
    helper.setStop(false);
    helper.setLimit(256000);
    helper.initConsoleLog();

    let promise = helper.getPromise();

    return promise.then(
        () => {
            return helper.readWalletList();
        }
    ).then(
        (count) => {
            return new Promise((resolve, reject) => {
                if (!count) {
                    reject(401, {err: 'count is empty'});
                    return
                }
                resolve(count);
            });
        }
    ).then(
        (count) => {
            // https://keys.lol/ethereum/641534649490513739252419950558232515682305637399334407349168037385448445199
            let start_key = '0xb58c4156bea5f9b7bf91297fad63cfb569f6040a7002ffe64d16bed32bea8700';
            helper.setPrivateKeyString(start_key);
            console.log('Started from random value, checking ' + count + ' wallets, first key: ' + start_key);
            helper.setRandom(true);
            return helper.callMainFunction(true);
        }
    ).catch(
        (json) => {
            console.log(json);
        }
    );
}

start();
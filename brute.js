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
    helper.setLimit(102400);
    helper.initConsoleLog();
    helper.configureThreads();

    let privateKeyString = false;

    let promise = helper.getPromise();

    return promise.then(
        () => {
            return helper.readFromValue();
        }
    ).then(
        (key) => {
            return new Promise((resolve, reject) => {
                if (!key) {
                    reject(401, {err: 'key is empty'});
                    return
                }
                privateKeyString = key;
                resolve();
            });
        }
    ).then(
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
            let currentThread = helper.getThreadNumber();
            let totalThreads = helper.getTotalThreads();
            console.log('Started from: ' + privateKeyString + ' , thread ' + currentThread + ' from ' + totalThreads);
            helper.setRandom(false);
            return helper.callMainFunction();
        }
    ).catch(
        (json) => {
            console.log(json);
        }
    );
}

start();
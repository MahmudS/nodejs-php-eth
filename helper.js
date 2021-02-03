let ethUtil  = require('ethereumjs-util');
let Wallet   = require('ethereumjs-wallet').default;
let fs       = require('fs');
let util     = require('util');
let bigInt   = require("big-integer");

let path = __dirname + '/wallets';
let file_wallets = path + '/wallets.txt';
let file_from = path + '/from.txt';

let wallets = {};
let threads_total = 1;
let thread_number = 0;
let length = 32;

let privateKeyString = false;
let privateKeyStringIntStart;

let stop = false;

let limit = 409600;

let is_random = false;

const getPromise = () => {
    return Promise.resolve()
};

const getPrivateKeyString = () => {
    return privateKeyString;
};

function initConsoleLog()
{
    let log_file = fs.createWriteStream(__dirname + '/debug_' + thread_number + '.log', {flags : 'a+'});
    let log_stdout = process.stdout;

    console.log = function(d) { //
        log_file.write(util.format(d) + '\n');
        log_stdout.write(util.format(d) + '\n');
    };
}

function convertHexToBigInt(hex) {
    if (hex !== undefined) {
        if (hex.length > 2) {
            if (hex.substring(0, 2) === '0x') hex = hex.substr(2);
        }
    }
    let arr = hex.match(/.{1}/g);
    let result = bigInt(0);
    let length = arr.length;
    for (let i = 0; i < arr.length; i++) {
        result = result.plus(bigInt(parseInt(arr[i], 16)).multiply(bigInt(16).pow(bigInt(length - (i + 1)))));
    }
    return result;
}

function readWalletList() {
    let promise = getPromise();

    return promise.then(
        () => {
            return new Promise((resolve, reject) => {
                return fs.readFile(file_wallets, 'utf8', (err, data) => {
                    if (err) {
                        reject({status: 401, err});
                        return
                    }
                    resolve(data);
                });
            });
        }
    ).then(
        (data) => {
            return new Promise((resolve, reject) => {
                if (data === '') {
                    reject({status: 401, err: 'data is empty'});
                    return
                }
                let _wallets = data.split("\r\n");
                if (!_wallets.length) {
                    reject({status: 401, err: 'wallets array is empty'});
                    return
                }

                let added_wallets = 0;
                for (let i = 0; i < _wallets.length; i++) {
                    let key = _wallets[i];
                    if (key !== '') {
                        wallets[key] = 1;
                        added_wallets++;
                    }
                }

                if (!added_wallets) {
                    reject({status: 401, err: 'empty wallets list'});
                    return
                }

                resolve(added_wallets);
            });
        }
    ).then(
        (added_wallets) => {
            return added_wallets;
        }
    )
}

function readFromValue() {
    let promise = getPromise();

    return promise.then(
        () => {
            return new Promise((resolve, reject) => {
                return fs.access(file_from, fs.F_OK, (err) => {
                    if (err) {
                        reject({status: 401, err});
                        return
                    }
                    resolve(true);
                });
            });
        }
    ).then(
        (fileExists) => {
            if (fileExists) {
                return new Promise((resolve, reject) => {
                    return fs.readFile(file_from, 'utf8', (err, data) => {
                        if (err) {
                            reject({status: 401, err});
                            return
                        }
                        resolve(data);
                    });
                });
            }
        }
    ).then(
        (data) => {
            if (data !== '') privateKeyString = data;

            return privateKeyString;
        }
    )
}

function intToBuffer(privateKeyStringInt){
    let _privateKey = ethUtil.intToBuffer(privateKeyStringInt);
    if (_privateKey.length === length) return _privateKey;
    let rawBytes = new global.Uint8Array(length);
    
    for (let i = 0; i < _privateKey.length; i++) {
        rawBytes[length - _privateKey.length + i] = _privateKey[i];
    }
    return Buffer.from(rawBytes.buffer);
}

function actionsForCallback(callback) {
    if (callback === 'exit') {
        stop = true;
        console.log(privateKeyString);
        console.log("Caught interrupt signal");
        process.exit();
    }
    if (!stop) {
        callMainFunction();
    }
}

function savePrivateKeyToFile(callback) {
    if (thread_number === 0) { // only main thread could save current position to file
        fs.writeFile(file_from, privateKeyString, (err) => {
            if (err) throw err;
            actionsForCallback(callback);
        });
    } else {
        actionsForCallback(callback);
    }
}

function getHashrateValue(total_hashes, time_ms)
{
    let result = total_hashes * 1000 / time_ms;

    return (result.toFixed(2)) + ' H/s';
}

function checkWalletAndSave(wallet_obj)
{
    let address = wallet_obj.getAddressString();
    if (typeof(wallets[address]) !== 'undefined') {
        console.log(wallet_obj.getPrivateKeyString() + ': ' + address);
        fs.writeFile(path + '/' + address + '.txt', wallet_obj.getPrivateKeyString() + "\r\n", {flag: 'a+'}, (err) => {
            if (err) throw err;
        });
    }
}

function callMainFunction() {
    let global_counter = -1;
    let time_start = new Date().getTime();
    let current_time;
    let counter = thread_number;
    if (!is_random) {
        privateKeyStringIntStart = convertHexToBigInt(getPrivateKeyString());
    }
    do {
        let wallet_obj;
        if (is_random) {
            wallet_obj = Wallet.generate();
        } else {
            let privateKeyStringInt = privateKeyStringIntStart.plus(bigInt(counter));
            let privateKey = intToBuffer(privateKeyStringInt);
            wallet_obj = Wallet.fromPrivateKey(privateKey);
        }
        checkWalletAndSave(wallet_obj);
        counter += threads_total;
        global_counter++;
        privateKeyString = wallet_obj.getPrivateKeyString();
    } while ((counter <= limit + thread_number) && !stop);

    current_time = new Date().getTime();
    let interval = (current_time - time_start);
    console.log(privateKeyString + '; ' + global_counter + ' for ' + (interval * 0.001).toFixed(2) + ' seconds (' + getHashrateValue(global_counter, interval) + ')');

    if (!is_random) {
        // next wallet, not from file
        let privateKeyStringInt = privateKeyStringIntStart.plus(bigInt(limit));
        let privateKey = intToBuffer(privateKeyStringInt);
        let wallet_obj = Wallet.fromPrivateKey(privateKey);
        privateKeyString = wallet_obj.getPrivateKeyString();
    }

    if (is_random) {
        actionsForCallback('main');
    } else {
        savePrivateKeyToFile('main');
    }
}

function configureThreads()
{
    let args = process.argv.slice(2);
    thread_number = 0;
    threads_total = 1;

    if (args[0]) {
        threads_total = parseInt(args[0], 10);
        limit *= threads_total;
        thread_number = parseInt(args[1], 10);
    }

    if (threads_total > 1) {
        file_from = path + '/from_' + threads_total + '.txt';
    }
}

const helper = {
    setStop: (value) => {
        stop = value;
    },
    setLimit: (value) => {
        limit = value;
    },
    setRandom: (value) => {
        is_random = value;
    },
    getThreadNumber: () => {
        return thread_number + 1; // human friendly lol
    },
    getTotalThreads: () => {
        return threads_total;
    },
    getPrivateKeyString,
    getPromise,
    initConsoleLog,
    configureThreads,
    readFromValue,
    readWalletList,
    callMainFunction
}

module.exports = helper;
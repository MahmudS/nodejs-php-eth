var ethUtil  = require('ethereumjs-util');
var Wallet   = require('ethereumjs-wallet');
var fs       = require('fs');
var util     = require('util');
var bigInt   = require("big-integer");

var path = __dirname + '/wallets';
var file_wallets = path + '/wallets.txt';
var file_from = path + '/from.txt';

var wallets = {};
var threads_total = 1;
var thread_number = 0;
var length = 32;
var start_from;

var isMain = false;

var privateKey;
var privateKeyString = '0x0000000000000000000000000000000000000000000000000000000000000001';
//var privateKeyString = '0x36d08e8a7ef3e646e295594d9ae6d3a785a075047a7708cb2443378d7540ffff';
var privateKeyStringIntStart;

var stop = false;

var limit = 10240;
var limit_for_console = 1024000;
var global_counter = 0;

console.log = function(d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

function convertHexToBigInt(hex) {
    if (hex.substring(0, 2) == '0x') hex = hex.substr(2);
    var arr = hex.match(/.{1}/g);
    var result = bigInt(0);
    var length = arr.length;
    for (var i = 0; i < arr.length; i++) {
        result = result.plus(bigInt(parseInt(arr[i], 16)).multiply(bigInt(16).pow(bigInt(length - (i + 1)))));
    }
    return result;
}

function readWalletList() {
    fs.readFile(file_wallets, 'utf8', (err, data) => {
        if (err) throw err;
        var _wallets = data.split("\r\n");
        for (i = 0; i < _wallets.length; i++) {
            var key = _wallets[i];
            if (key != '') wallets[key] = 1;
        }
        
        console.log(privateKeyString);
        counter = start_from;
        callMainFunction();
    });
}

function readFromValue() {
    fs.access(file_from, fs.constants.F_OK, (err) => {
        if (err) {
            fs.writeFile(file_from, privateKeyString, (err) => {
                if (err) throw err;
            });
        }
        fs.readFile(file_from, 'utf8', (err, data) => {
            if (data != '') privateKeyString = data;
        });
    });
}

function intToBuffer(privateKeyStringInt){
    _privateKey = ethUtil.intToBuffer(privateKeyStringInt);
    if (_privateKey.length == length) return _privateKey;
    var rawBytes = new global.Uint8Array(length);
    
    for (var i = 0; i < _privateKey.length; i++) {
        rawBytes[length - _privateKey.length + i] = _privateKey[i];
    }
    return Buffer.from(rawBytes.buffer);
}

function actionsForCallback(callback) {
    if (callback == 'exit') {
        console.log(privateKeyString);
        console.log("Caught interrupt signal");
        process.exit();
    }
    if (!stop && (callback == 'main')) {
        //console.log(privateKeyString);
        callMainFunction();
    }
}

function savePrivateKeyToFile(callback) {
    //if (isMain) {
        fs.writeFile(file_from, wallet.getPrivateKeyString(), (err) => {
            if (err) throw err;
            actionsForCallback(callback);
        });
    //} else {
    //    actionsForCallback(callback);
    //}
}

function callMainFunction() {
    var counter = start_from;
    privateKeyStringIntStart = convertHexToBigInt(privateKeyString);
    do {
        var privateKeyStringInt = privateKeyStringIntStart.plus(bigInt(counter));
        privateKey = intToBuffer(privateKeyStringInt);
        wallet = new Wallet(privateKey);
        address = wallet.getAddressString();
        if (typeof(wallets[address]) !== 'undefined') {
            console.log(wallet.getPrivateKeyString() + ': ' + address);
            fs.writeFile(path + '/' + address + '.txt', wallet.getPrivateKeyString() + "\r\n", {flag: 'a+'}, (err) => {
                if (err) throw err;
            });
        }
        global_counter++;
        if (global_counter >= limit_for_console) {
            global_counter = 0;
            console.log(privateKeyString);
        }
        counter += threads_total;
    } while ((counter <= limit + start_from) && !stop);
    start_from = 0;
    privateKeyString = wallet.getPrivateKeyString();
    savePrivateKeyToFile('main');
}

if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function () {
    stop = true;
    //if (isMain) {
        savePrivateKeyToFile('exit');
    //} else {
    //    actionsForCallback('exit')
    //}
});

function start() {
    readFromValue();
    readWalletList();
}

var args = process.argv.slice(2);
start_from = 0;
isMain = true;

if (args[0]) {
    threads_total = parseInt(args[0], 10);
    limit *= threads_total;
}

if (args[1] != 0) {
    thread_number = parseInt(args[1], 10);
    isMain = false;
} else {
    thread_number = 0;
    isMain = true;
}
//start_from = thread_number;
var file_from = path + '/from_' + thread_number + '.txt';
var log_file = fs.createWriteStream(__dirname + '/debug_' + thread_number + '.log', {flags : 'a+'});
var log_stdout = process.stdout;

start();
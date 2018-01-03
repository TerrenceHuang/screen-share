var net = require('net');

let account = 'dog@gmail.com';
let password = '12345';
let name = '';

var client = new net.Socket();
client.connect(8000, '127.0.0.1', function() {
    console.log('Connected');
    // register();
    login();
});

client.on('data', function(data) {
    console.log('Received: ' + data);
    switch ('' + data) {
        case 'login|T\n':
            connectSend();
            break;
        case 'connectRecv|dog@gmail.com\n':
            client.write('connectRecv|T');
            break;
        case 'connectRecv|terrence@gmail.com\n':
            client.write('connectRecv|T');
            break;
        case 'connectResult|T\n':
            client.write('pictureSend|picture\n');
            break;
        case 'pictureSend|T\n':
            break;
        default:

            break;
    }
    // client.destroy();
});

client.on('close', function() {
	console.log('Connection closed');
});

client.on('error', (e) => {
    console.log(e);
});

function register() {
	client.write('register|' + account + '|' + password + '|' + name);
};

function login() {
	client.write('login|' + account + '|' + password);
}

function connectSend() {
    client.write('connectSend|terrence@gmail.com');
    console.log('in');
}
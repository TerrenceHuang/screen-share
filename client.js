var net = require('net');

let account = '';
let password = '';
let name = '';

var client = new net.Socket();
client.connect(8000, '127.0.0.1', function() {
    console.log('Connected');
    // register();
    login();
});

client.on('data', function(data) {
    console.log('Received: ' + data);
    client.destroy();
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
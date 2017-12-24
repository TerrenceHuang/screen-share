"use strict";

const net = require('net');
const database = require('./database');

const port = 8000;

const server = net.createServer((client) => {
    // 'connection' listener
    console.log('client connected');
    client.on('end', () => {
        console.log('client disconnected');
    });
    client.on('data', (data) => {
        // to string
        data = '' + data;
        console.log(data);
        let datas = data.split('|');
        switch (datas[0]) {
            case 'register':
                if (datas.length == 4)
                    database.createUser(datas[1], datas[2], datas[3], (success) => {
                        if (success)
                            client.write('register|T\n');
                        else
                            client.write('register|F\n');
                    });
                else
                    sendWrongAttributeMessage(client);
                break;
            case 'login':
                if (datas.length == 3)
                    database.login(datas[1], datas[2], (success) => {
                        if (success)
                            client.write('login|T\n');
                        else
                            client.write('login|F\n');
                    });
                else
                    sendWrongAttributeMessage(client);
                break;
            default:
                console.log('Client data no event');
                break;
        }
    });
    // c.write('hello\r\n');
});

// send wrong message and disconnect
function sendWrongAttributeMessage(socket) {
    console.log('Client wrong attribute and disconnect');
    socket.write('error|wrong attribute\n');
    socket.destroy();
}

server.on('error', (err) => {
    throw err;
});

server.listen(port, () => {
    console.log(`server bound at ${port}`);
});
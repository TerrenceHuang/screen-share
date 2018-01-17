"use strict";

const net = require('net');
const database = require('./database');
const model = require('./model');
const util = require('./util');

const port = 8000;

const myClients = [];

const server = net.createServer((client) => {

    // 'connection' listener
    console.log('client connected');
    createConnection(client);

    client.on('end', () => {
        console.log('client disconnected');
        deleteConnection(client);
    });

    client.on('data', (data) => {
        // to string
        data = '' + data;
        // let index = data.indexOf('\n');
        // if (index >= 0) {
        //     data.substring(0, index);
        // }
        console.log(data);

        // get connection object
        let myClient = findConnection(client);
        if (myClient == null) {
            console.log('something went wrong!');
        }

        // get data array
        let datas = data.split('|');
        let dataNotEnd;
        do {
            dataNotEnd = false;
            switch (datas[0]) {
                case 'register':
                    if (datas.length == 4) {

                        let account = datas[1];
                        let password = datas[2];
                        let name = datas[3];
                        database.createUser(account, password, name, (success) => {
                            if (success)
                                client.write('register|T\n');
                            else
                                client.write('register|F\n');
                        });
                    } else
                        sendWrongAttributeMessage(client);
                    break;
                case 'login':
                    if (datas.length == 3) {

                        let account = datas[1];
                        let password = datas[2];
                        database.login(account, password, (success) => {
                            if (success) {
                                
                                myClient.login = true;
                                myClient.account = account;
                                client.write('login|T\n');
                            } else
                                client.write('login|F\n');
                        });
                    } else
                        sendWrongAttributeMessage(client);
                    break;
                case 'connectSend':
                    if (myClient.login) {
                        if (datas.length == 2) {
                            let account = datas[1];
                            database.checkExistence(account, (success) => {
                                if (success) {
                                    let otherClient = findConnectionByAccount(account);

                                    if (otherClient == null) {
                                        client.write('connectSend|offline\n');
                                    } else {
                                        client.write('connectSend|online\n');
                                        myClient.connectAccount = account;
                                        otherClient.socket.write('connectRecv|' + myClient.account + '\n');
                                        otherClient.connectAccount = myClient.account;
                                    }
                                } else
                                    client.write('connectSend|noAccount\n');
                            });
                        }else
                            sendWrongAttributeMessage(client);
                    } else
                        sendLoginFirstMessage(client);
                    break;
                case 'connectRecv':
                    if (myClient.login) {
                        if (datas.length == 2) {
                            if (datas[1] == 'T') {
                                let otherClient = findConnectionByAccount(myClient.connectAccount);
                                if (otherClient == null) {
                                    console.log(otherClient.account + ' has disconnected!');
                                } else {
                                    myClient.connection = true;
                                    otherClient.connection = true;
                                    otherClient.socket.write('connectResult|T\n');
                                }
                            } else {
                                otherClient.socket.write('connectResult|F\n');
                            }
                        }else
                            sendLoginFirstMessage(client);
                    } else
                        client.write('error|you need to login first\n');
                    break;
                case 'screensharepictureSend':
                    if (myClient.login) {
                        if (datas.length == 3) {
                            if (myClient.connection) {
                                let otherClient = findConnectionByAccount(myClient.connectAccount);
                                if (otherClient == null) {
                                    console.log('something went wrong!');
                                }else {
                                    myClient.pictureSize = parseInt(datas[1]);
                                    myClient.buffer = datas[2];
                                    if (checkPictureSendEnd(myClient)) {
                                        sendPictureRecv(myClient, otherClient);
                                    }
                                }
                            } else {
                                console.log('Client need to connect first and disconnect');
                                client.write('error|you need to connect first\n');
                                client.destroy();
                            }
                        }else
                            sendWrongAttributeMessage(client);
                    } else
                        sendLoginFirstMessage(client);
                    break;
                default:
                    if (myClient.login) {
                        if (datas.length == 1) {
                            pictureRecvHandler(myClient, datas[0]);
                            
                        }else {
                            let index = datas[0].indexOf('screenshare');
                            let pictureSendEnd;
                            if (index >= 0) {
                                pictureSendEnd = datas[0].substring(0, index);
                                index = datas[0].indexOf('pictureSend');
                                if (index >= 0) {
                                    pictureRecvHandler(myClient, pictureSendEnd);
                                    datas[0] = "screensharepictureSend";
                                    dataNotEnd = true;
                                }else {
                                    sendWrongAttributeMessage(client);
                                }
                            }else
                                sendWrongAttributeMessage(client);
                        }
                    }else
                        sendLoginFirstMessage(client);
                    break;
            }
        }while (dataNotEnd);
    });
});

// send wrong message and disconnect
function sendWrongAttributeMessage(socket) {
    console.log('Client wrong attribute and disconnect');
    socket.write('error|wrong attribute\n');
    socket.destroy();
    deleteConnection(socket);
};

// send login first message and disconnect
function sendLoginFirstMessage(socket) {
    console.log('Client need to login first and disconnect');
    socket.write('error|you need to login first\n');
    socket.destroy();
};

function createConnection(socket) {

    // save connection
    let myClent = util.cloneObject(model.myConnection);
    myClent.socket = socket;
    myClients.push(myClent);
}

// find connection object
function findConnection(socket) {

    for (let i = 0; i < myClients.length; i++) {
        if (socket == myClients[i].socket) {
            return myClients[i];
        }
    }

    return null;
}

// find connection object by account
function findConnectionByAccount(account) {

    for (let i = 0; i < myClients.length; i++) {
        if (account == myClients[i].account) {
            return myClients[i];
        }
    }

    return null;
}

// delete connection
function deleteConnection(socket) {

    for (let i = 0; i < myClients.length; i++) {
        if (socket == myClients[i].socket) {
            myClients.splice(i, 1);
        }
    }
}

function checkPictureSendEnd(client) {

    if (client.pictureSize == client.buffer.length)
        return true;
    else
        console.log('picture not end');
        return false;
}

function sendPictureRecv(client, otherClient){

    console.log('\nsend PicturRecv');
    console.log(client.pictureSize);
    otherClient.socket.write('pictureRecv|' + client.pictureSize + '|' + client.buffer + '\n');
}

function pictureRecvHandler(client, datas) {
    if (client.connection) {
        let otherClient = findConnectionByAccount(client.connectAccount);
        if (otherClient == null) {
            console.log('something went wrong!');
        }else {
            client.buffer = client.buffer + datas;
            if (checkPictureSendEnd(client)) {
                sendPictureRecv(client, otherClient);
            }
        }
    }else {
        console.log('Client need to connect first and disconnect');
        client.write('error|you need to connect first\n');
        client.destroy();
    }
}

server.on('error', (err) => {
    throw err;
});

server.listen(port, () => {
    console.log(`server bound at ${port}`);
});
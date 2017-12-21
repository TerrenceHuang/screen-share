"use strict";

const MongoClient = require('mongodb').MongoClient;
const model = require('./model');
const util = require('./util');
const url = "mongodb://localhost:27017/mydb";

const dbName = "screen_share";
const collectionName = "account";

exports.createUser = (account, password, name, createUserCallback) => {
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;

        let dbase = db.db(dbName);
        let query = util.cloneObject(model.account);
        query.account = account;

        dbase.collection(collectionName).find(query).toArray((err, result) => {
            if (err) throw err;

            if (result.length == 0) {
                // ok
                let obj = util.cloneObject(model.user);
                obj.account = account;
                obj.password = password;
                obj.name = name;

                dbase.collection(collectionName).insertOne(obj, (err, res) => {

                    if (err) throw err;

                    console.log('Account create: ' + account);
                    createUserCallback(true);
                    db.close();
                });
            } else {
                // already exist
                console.log('Account already exist: ' + account);
                createUserCallback(false);
                db.close();
            }
        });
    });
};

exports.login = (account, password, loginCallback) => {
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;

        let dbase = db.db(dbName);
        let query = util.cloneObject(model.login);
        query.account = account;
        query.password = password;

        dbase.collection(collectionName).find(query).toArray((err, result) => {
            if (err) throw err;

            if (result.length == 1) {
                // ok
                console.log('Login success: ' + account);
                loginCallback(true);
            } else {
                // wrong
                console.log('Login failure: ' + account);
                loginCallback(false);
            }
            db.close();
        });
    });
};
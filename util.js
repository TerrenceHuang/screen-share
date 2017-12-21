"use strict";

exports.cloneObject = (obj) => {

    return JSON.parse(JSON.stringify(obj));
}
// import package
const WebSocket = require("ws");
const mongoose = require("mongoose");
const axios = require("axios");
let async = require('async');

let common = require("../helpers/common.helper");
var query_helper = require("../helpers/query.helper");

// import model


let oArrayOB = [];
function _intervalFuncOB(orderwith) {
    orderwith = orderwith.toString();
    var index = oArrayOB.indexOf(orderwith);
    if (index > -1) {
        oArrayOB.splice(index, 1);
    }
}

let oArrayOBSend = [];
function _intervalFuncOBSend(orderwith) {
    orderwith = orderwith.toString();
    var index = oArrayOBSend.indexOf(orderwith);
    if (index > -1) {
        oArrayOBSend.splice(index, 1);
    }
}

let oArrayRT = [];
function _intervalFuncRT(orderwith) {
    orderwith = orderwith.toString();
    var index = oArrayRT.indexOf(orderwith);
    if (index > -1) {
        oArrayRT.splice(index, 1);
    }
}

let oArray = [],
    activePairs = [],
    activePairsDet = {},
    recentTrade = {},
    tradeWS;


var socket = 0;

// here socket connect
exports.SocketInit = function (socketIO) {
    socket = socketIO;
};

exports.initialCall = async function () {
    
}
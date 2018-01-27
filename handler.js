'use strict';

var http = require('http');
const util = require('./util.js');

//Lambda環境変数の読み込み
const IpAddress = process.env.IpAddress;
const RemoteWalletAddress = process.env.RemoteWalletAddress;

const URL = 'http://' + IpAddress + ':7890/account/status?address=' + RemoteWalletAddress;
const topicARN = process.env.topicARN;
const region = process.env.region;

var AWS = require('aws-sdk');
var sns = new AWS.SNS();

module.exports.checkHarvestStatus = (event, context, callback) => {
    var promise = new Promise(function(resolve, reject) {
        //リモートノードへアクセス、必要な情報を抽出
        resolve(module.exports.checkRemoteStatus(URL));
    }).then(function(result) {
        //SNS用メール・サブジェクトを生成
        result.subject = module.exports.createSubject();
        return result;

    }).then(function(result) {
        console.log("result " + JSON.stringify(result));
        console.log("topicARN   " + topicARN);

        if (result.message.status != "UNLOCKED") {
          //UNLOCKED以外のステータスの場合、デリゲートハーベスティング（委任）が停止しているため通知
            return util.publishToTopic(JSON.stringify(result.message), result.subject, topicARN);
        } else {
            console.log("Harvest status is UNLOCKED. (OK)");
            return true;
        }
    }).then(function(result) {

        callback(null, result);

    }).catch(function(err) {
        console.log("err#  " + JSON.stringify(err));
        callback(err);
    });

};

module.exports.checkRemoteStatus = (URL) => {
    var message = {};

    return new Promise(function(resolve, reject) {
        console.log("URL:" + URL);
        //リモートステータスの確認
        http.get(URL, function(res) {
            message.statusCode = res.statusCode;

            res.setEncoding('utf8');
            res.on('data', function(str) {
                console.log(str);
                message.message = JSON.parse(str);
            });
            resolve(message);
        });
    });
};


module.exports.publishToTopic = (sns, message, subject, targetArn) => {
    var params = {
        Message: message,
        Subject: subject,
        TargetArn: targetArn
    };
    return sns.publish(params).promise();
};

//subject作成
module.exports.createSubject = () => {
    var subject = "[XEM][info] Please Check Harvest Status";
    return subject;
}

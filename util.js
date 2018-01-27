var AWS = require('aws-sdk');
if (process.env.region != null) {
    AWS.config.update({
        region: process.env.region
    });
}
var sns = new AWS.SNS();

module.exports.publishToTopic = (message, subject, targetArn) => {
    var params = {
        Message: message,
        Subject: subject,
        TargetArn: targetArn
    };
    return sns.publish(params).promise();
};

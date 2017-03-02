var fs = require('fs');

var logger = function (filepath, message) {
    fs.appendFile(filepath, new Date().toISOString() + ' : ' + message + '\n');
    // console.log('appended message ' + message);
};

module.exports.logger = logger;

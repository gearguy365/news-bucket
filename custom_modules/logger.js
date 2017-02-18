var fs = require('fs');

var logger = function (filepath, message) {
    fs.appendFile(filepath, new Date().toISOString() + ' : ' + message + '\n');
};

module.exports.logger = logger;

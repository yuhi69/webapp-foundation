"use strict";

const path = require('path');

exports.enterPage = (request, response) => {
    //const app = require.main.exports.express;
    response.sendFile(path.join(path.resolve(), 'views/2.html'));
};

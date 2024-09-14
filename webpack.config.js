const path = require('path-browserify');

module.exports = {
  resolve: {
    fallback: {
      "fs": false,
      "path": path,
    }
  }
};
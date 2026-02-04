const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: options.entry,
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    output: {
      path: options.output.path,
      filename: options.output.filename,
      library: {
        type: 'commonjs', // <--- THIS IS THE MAGIC LINE
      },
    },
    // Ensure we don't bundle aws-lambda (provided by AWS)
    externals: [
      'aws-lambda',
      '@nestjs/microservices',
      '@nestjs/websockets/socket-module',
    ],
  };
};

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apps: [
    {
      name: 'ppfun',
      script: './server.js',
      node_args: '--nouse-idle-notification --expose-gc',
      watch: ['server.js'],
      watch_delay: 5000,
      env: process.env,
    },
  ],
};

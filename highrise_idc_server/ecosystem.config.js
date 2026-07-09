module.exports = {
  apps : [{
    name: 'receiver',
    script: 'dist/server.js',
    watch: false,
    out_file: '/dev/null',
    error_file: '/dev/null',
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '1G'
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

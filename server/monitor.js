var respawn = require('respawn');

var monitor = respawn(['app.js', 'app.js'], {
    name: 'test',          // set monitor name
    env: {ENV_VAR:'test'}, // set env vars
    cwd: '.',              // set cwd
    maxRestarts:10,        // how many restarts are allowed within 60s
                           // or -1 for infinite restarts
    sleep:1000,            // time to sleep between restarts,
    kill:30000,            // wait 30s before force killing after stopping
    //stdio: [...],          // forward stdio options
    fork: true             // fork instead of spawn
});

monitor.start();

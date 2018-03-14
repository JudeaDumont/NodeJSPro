/* main.js -- CCT client top-level control flow, main loop
 */

// REQUIRES: tools.js, httpClient.js, model.js, display.js


// IIFE module, set up main loop to start when page is fully loaded
CCT.mn = CCT.main = (function () {

    /* Main update loop:
         Runs twice/sec indefinitely.
         If we don't have a CONFIG, get it;
         Else get UPDATE resource.
         When UPDATE goes to IDLE, empty the config.
         When UPDATE leaves IDLE, get a new config.
         When leaving IDLE, start a second loop to get STATUS resource twice/sec.
         When entering IDLE, stop the STATUS loop.
         Comm error: retry a few times and stop the loop if unsuccessful.
     */

    const delayToRestartUpdatesAfterStopping = 4000;

    let pendingRequests = {};

    // CCT configuration, requested at start of task

    let timeStampedMessages = {
        configMsg: CCT.tools.valueTimestamped('Config JSON obj'),
        updateMsg: CCT.tools.valueTimestamped('Update JSON obj'),
        statusMsg: CCT.tools.valueTimestamped('Status JSON obj'),
        logMsg: CCT.tools.valueTimestamped('Log JSON obj'),
    };

    // CCT update resource, updated regularly when CCT is tasked or idle
    timeStampedMessages.updateMsg.tasked = function () {
        return this.value ? this.value.TASKSTATUS !== 'IDLE' : undefined
    };

    // CCT status resource, updated regularly, ONLY when CCT is tasked


    // Interval timer for main loop
    const MAIN_LOOP_MS = 500;
    var mainLooper = CCT.tools.valueTimestamped('Main loop interval ID');
    Object.assign(mainLooper, {   // merges additional properties into updateLooper object
        isRunning: function () {
            return !!this.value
        },
        start: function (ms = MAIN_LOOP_MS) {
            // returns true if it actually started the timer, false if it was already running
            if (this.value)
                return false;
            this.save(setInterval(mainLoopUpdate, ms));
            return true;
        },
        stop: function () {
            // returns true if it actually stopped the timer, false if it wasn't already running
            if (!this.value)
                return false;
            clearInterval(this.value);
            this.clear();
            return true;
        },
    });
//todo: Move all loop statistics to main loop
    let statArray = ['failures', 'successes', 'skips', 'tasked', 'idle'];

    let loopStats = {
        update: {},
        status: {},
        config: {},
        log: {},
    };

    let keys = Object.keys(loopStats);
    for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < statArray.length; j++) {
            loopStats[keys[i]][statArray[j]] = CCT.tools.streakCounter(statArray[j]);
        }
        loopStats[keys[i]]['loops'] = 0;
        loopStats[keys[i]]['clearLoopStats'] = function () {
            this.failures.clear();
            this.successes.clear();
            this.skips.clear();
            this.tasked.clear();
            this.idle.clear();
            this.loops = 0;
        }
    }

    // print all the looping stats and how long the loop has been running
    function uptime() {
        var elapsed = mainLooper.timestamp ? CCT.tools.msToStringHMS(Date.now() - mainLooper.timestamp) : '';
        // console.log(`UPTIME: ${failure}; ${skip}; ${success}; ${tasked}; ${idle}; ${elapsed ? 'elapsed ' + elapsed : 'update loop not running'}`);
    }


    // --- MAIN UPDATE LOOP ---
    const NUM_FAILURES_TO_ABORT = 3, //10,
        NUM_SKIPS_TO_ABORT = 3; //10,

    const typeToURI = {
        config: '/api/configuration',
        update: '/api/update',
        log: '/api/logDelta/',
        status: '/api/status'
    };

    function startMain() {
        // TODO: what if a request is pending?
        if (mainLooper.start()) {

            let keys = Object.keys(loopStats);

            for (let i = 0; i < keys.length; i++) {
                loopStats[keys[i]].clearLoopStats();
            }
            // console.log('startUpdates: main update loop started');
        }
        else {
            // console.log('startUpdates: main update loop was already running');
        }
    }

    function stopMain() {
        // TODO: what if a request is pending?
        if (mainLooper.isRunning()) {
            uptime();
            mainLooper.stop();
            // console.log('stopUpdates: main update loop stopped');
        }
        else {
            // console.log('stopUpdates: main update loop was already stopped');
        }
    }

    function restartMain() {
        // TODO: what if a request is pending?
        mainLooper.stop();
        timeStampedMessages.configMsg.clear();
        timeStampedMessages.updateMsg.clear();
        timeStampedMessages.statusMsg.clear();
        startMain();
    }

    function handleFetch(type) {
        var jsonVTS;    // will refer to a valueTimestamped where we will store the received JSON object
        if (!pendingRequests[type]) {
            let uri = typeToURI[type];
            pendingRequests[type] = type;
            jsonVTS = timeStampedMessages[type + 'Msg'];
            CCT.httpClient.getJSON(type === 'log' ? uri + CCT.model.log.getNextLineNum() : uri)
                .then(function (jsonObj) {
                    // console.log(jsonObj);
                    // Success! Store the JSON obj w/ time stamp
                    jsonVTS.save(jsonObj);
                    jsonVTS.log();
                    CCT.model.update(jsonObj);
                    loopStats[type].successes.inc();
                    loopStats[type].failures.endStreak();
                    loopStats[type].skips.endStreak();
                    if (timeStampedMessages.updateMsg.tasked() && type === 'update') {
                        loopStats[type].tasked.inc();
                        loopStats[type].idle.endStreak();
                    }
                    else if (timeStampedMessages.updateMsg.tasked() !== undefined && type === 'update') {
                        loopStats[type].idle.inc();
                        loopStats[type].tasked.endStreak();
                    }
                    if (loopStats.update.idle.streak === 1 && loopStats.update.tasked.count) { // just went idle: clear config and tell the model
                        timeStampedMessages.configMsg.save({});
                        // console.log(`update loop: WENT IDLE -- ${idle} -- cleared the config`);
                    }
                    if (checkErrProps(jsonObj)) {
                        // console.log('update loop: got JSON error properties');
                        // TODO: error/warn handling?
                    }
                    delete pendingRequests[type];
                })
                .catch(function (err) {
                    // Curses! JSON not available. Retry a few times, then abort.
                    loopStats[type].failures.inc();
                    loopStats[type].successes.endStreak();
                    loopStats[type].skips.endStreak();
                    CCT.tools.consoleWarn(err, 'update');
                    if (loopStats[type].failures.streak < NUM_FAILURES_TO_ABORT) {
                        // report failure, will retry next interval
                        // console.warn(`update loop: get-JSON ${failure} -- will retry`);

                        // TODO: display something in the UI
                    }
                    else if (type === 'update') {
                        // console.error(`update loop: ${pendingURI} resource unavailable, aborting after ${failure.streak} failed requests`);
                        stopMain();
                        // TODO: display something in the UI
                    }
                    delete pendingRequests[type];
                });
        }
        else {
            loopStats[type].skips.inc();
            loopStats[type].successes.endStreak();
            // failure streak not ended, because this skip might lead to a failure
            // console.warn(`update: request still pending -- ${skip}`);
            if (loopStats[type].skips.streak >= NUM_SKIPS_TO_ABORT && type === 'update') {
                // console.error(`update: ${pendingURI} request did not complete, aborting after ${skip.streak} skipped intervals`);
                // console.error('*** Node/redis gateway not responding. Not much we can do about that.');
                stopMain();
                setTimeout(function () {
                    startMain();
                }, delayToRestartUpdatesAfterStopping);
                // TODO: display something in the UI
            }
        }
        loopStats[type].loops++;
    }

    //function handle in display is set to fetchHandler, so display can call the requester with the log on displaying of the log.
    CCT.display.log.setRequestFunction(() => handleFetch('log'));

    // do one update: a CONFIG or UPDATE request, followed by a pending special request if any
    //todo: loop statistics for main only

    function fetchLogCheck() {
        return CCT.display.log.logVisible() && CCT.model.config.hasActiveLog();
    }

    function mainLoopUpdate() {
        if (timeStampedMessages.updateMsg.tasked()) {
            handleFetch('status');
        }
        //function needed to be moved out so that main can set the initial call to fetching the log via the handleFetch function

        // console.log(`update loop: *** CONFIG NEEDED *** ${tasked}${configMsg.value ? '' : ' -- our FIRST CONFIG'}`);
        if (CCT.model.missingConfig()) {
            handleFetch('config');
        }

        if (fetchLogCheck()) {
            handleFetch('log');
        }
        handleFetch('update');
    }

    // Helper: look for gen-purpose error properties in any of our JSON response objects
    function checkErrProps(obj) {
        // for testing, display error to message panel
        if (obj.error) {
            //todo: confirm that this line need be removed, the message panel has specific messages added to it on the error update in the model.
            // CCT.display.showMessage(`ERROR code ${obj.error.code}: ${obj.error.message}`);
            return true;
        }
        return false;
    }

    // Start the main update loop automatically after full page is loaded
    window.addEventListener('load', startMain);

    // exported object
    //todo:remove pending requests and log looper
    return {
        start: startMain,
        stop: stopMain,
        restart: restartMain,    // clear config and start the whole sequence over
        config: timeStampedMessages.configMsg.log,
        update: timeStampedMessages.updateMsg.log,
        status: timeStampedMessages.statusMsg.log,
        uptime: uptime,
    };
})();

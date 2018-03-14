/* simServer.js -- simulate an HTTP server, inside the client
 *   Override httpClient's lowest-level HTTP handler, to simulate any server/HTTP response without running a live server
 *   Simulate successes by matching URI (entry point) to an appropriate JSON/txt literal and returning it back up the chain
 *   Simulate errors by constructing any server response string/object and returning it
 *   Purpose: convenient development of UI and error handling
 */

// REQUIRES: tools.js, httpClient.js

// Load this module after httpClient.js, so it can override parts of that module.
// Create simServer module with alias "ss" for console convenience
CCT.ss = CCT.simServer = (function () {

    console.log('*** NO-SERVER MODE: HTTP SIMULATION ***');

    // Override the HTTP "fetch" function
    function enterTheMatrix() {
        CCT.httpClient.fetch.override(simFetch, "simFetch");
        matrixLog('Welcome to the Matrix.');
    }

    enterTheMatrix();

    // Ambience: green text on a black background
    function matrixLog(msg) {
        // The RegExp creates a trailing margin of two spaces
        console.log(`%c  ${msg.replace(/\n/g, '  \n  ')}  `, 'color: #0F0; background-color: #000;');
    }

    // How to get back to default for real HTTP messages
    function exitTheMatrix() {
        CCT.httpClient.fetch.restore();
        logSimMessage();
    }


    // --- CONTENT & APPLICATION LOGIC ---
    // Build objects to send back as JSON,
    // Keep application/server state,
    // DO NOT do any HTTP stuff. That comes later.

    const CMD_SOURCES = ['Ternary', 'KS-252'];
    const CMD_DESTS = ['CCS', 'CSS/B48', 'Monitor'];

    const IDLE_RUNLENGTH = 10,  // whole session, not individual devices
        SESSION_RUNLENGTH = 20, // enforce at least one device not idle
        CONN_RUNLENGTH = 10,   // individual device connected
        NC_RUNLENGTH = 3,       // individual not connected
        BETWN_SVCMD_RUNLENGTH = 3;    // length between SV cmds

    const coinFlip = (p = 0.5) => Math.random() < p;
    const onARoll = (N = 10) => !CCT.tools.randFalseRun(N);   // avg N true in a row before a false


    const INITIALLASTLOGINDEX = 200;

    // pretend CCT's state and accessors
    var simCCT = {
        now: new Date(),
        clients: 0,
        cmdSource: '',
        svCmds: 0,
        cmdDest: '',
        opsDevice: '',
        primaryStatus: 'IDLE',
        primarySent: 0,
        primaryRecvd: 0,
        secondaryStatus: 'IDLE',
        secondarySent: 0,
        secondaryRecvd: 0,
        azimuth: '',
        elevation: '',
        agc: '',
        vehicle: '',
        runningLogLength: 0,
        endSession: function () {
            // clients & now: leave alone
            this.cmdSource = '';
            this.svCmds = 0;
            this.cmdDest = '';
            this.opsDevice = '';
            this.primaryStatus = 'IDLE';
            this.primarySent = 0;
            this.primaryRecvd = 0;
            this.secondaryStatus = 'IDLE';
            this.secondarySent = 0;
            this.secondaryRecvd = 0;
            this.azimuth = '';
            this.elevation = '';
            this.agc = '';
            this.vehicle = '';
            // leave runningLogLength alone, because log entries stay for examination during IDLE
        },
        isIdle: function () {
            return this.primaryStatus === 'IDLE' && this.secondaryStatus === 'IDLE'
        },
        hasFailure: function () {
            return this.primaryStatus === 'FAILED' || this.secondaryStatus === 'FAILED'
        },
        isRunningOk: function () {
            return !this.isIdle() && !this.hasFailure()
        },
        getSessionStatus: function () {
            return this.isIdle() ? 'IDLE' : this.isRunningOk() ? 'RUNNING'
                : this.opsDevice === 'PRIMARY' ? (this.primaryStatus === 'FAILED' ? 'OPS-ISSUE' : 'ALT-ISSUE')
                    : this.opsDevice === 'SECONDARY' ? (this.secondaryStatus === 'FAILED' ? 'OPS-ISSUE' : 'ALT-ISSUE')
                        : 'OPS-ISSUE'
            /* i.e. we have no ops device */
        },
        getTaskStatus: function () {
            return this.isIdle() ? 'IDLE'
                : this.primaryStatus === 'CONNECTED' || this.secondaryStatus === 'CONNECTED' ? 'RUNNING'
                    : this.primaryStatus === 'FAILED' || this.secondaryStatus === 'FAILED' ? 'FAILED' : '';
        },
        nextState: function () {
            const CONNECT_PROB = 0.67;
            let rlGainClient, prLoseClient; // rl = run length, pr = probability ratio

            this.now = new Date();

            // --- First, find new status of each device; further action will depend on this status. ---

            let pri = {old: this.primaryStatus, new: ''},
                sec = {old: this.secondaryStatus, new: ''},
                ops = {old: this.opsDevice, new: ''};

            const connectOrFail = (p = CONNECT_PROB) => coinFlip(p) ? 'CONNECTED' : 'FAILED';

            if (this.isIdle()) {
                // IDLE_RUNLENGTH governs the *overall* CCT IDLE state
                if (onARoll(IDLE_RUNLENGTH)) {
                    // still IDLE, no change
                    pri.new = pri.old;
                    sec.new = sec.old;
                    ops.new = ops.old;
                }
                else {
                    // time to leave IDLE
                    // half the time only one device will try to connect; other half, both will
                    let opsStatus = connectOrFail(),
                        otherStatus = coinFlip() ? 'IDLE' : connectOrFail();
                    ops.new = coinFlip() ? 'PRIMARY' : 'SECONDARY';
                    pri.new = ops.new === 'PRIMARY' ? opsStatus : otherStatus;
                    sec.new = ops.new === 'SECONDARY' ? opsStatus : otherStatus;
                }
            }
            else {
                // SESSION_RUNLENGTH governs the *overall* CCT non-IDLE state, @ least one device not IDLE
                if (onARoll(SESSION_RUNLENGTH)) {
                    // Continuing within a session: each device can change but both can't be IDLE.
                    // Let each device pick its own desired next state independently,
                    //   then if both try to be IDLE, make them flip for it.
                    const nextState = (s) => {
                        let rl = s === 'CONNECTED' ? CONN_RUNLENGTH : NC_RUNLENGTH;
                        // if the run is ending, change state randomly, else stay the same
                        return onARoll(rl) ? s
                            : (s === 'IDLE' ? connectOrFail() : 'IDLE');
                    };

                    pri.new = nextState(pri.old);
                    sec.new = nextState(sec.old);
                    ops.new = ops.old;  // this never changes during session

                    if (pri.new === 'IDLE' && sec.new === 'IDLE') {
                        // whoever was already IDLE wins, other one's new state denied
                        if (pri.old === 'IDLE') {
                            sec.new = sec.old;
                        }
                        else if (sec.old === 'IDLE') {
                            pri.new = pri.old;
                        }
                        else {
                            // both are trying to go IDLE from non-IDLE, so flip for it
                            if (coinFlip()) {
                                pri.new = pri.old;
                            }
                            else {
                                sec.new = sec.old;
                            }
                        }
                    }
                    // Now the new states preserve the running session
                }
                else {
                    // End of session, returning to overall-IDLE
                    pri.new = 'IDLE';
                    sec.new = 'IDLE';
                    ops.new = '';
                }
            }

            // --- Next state has been determined. Now react to it.

            let oldState = this.getSessionStatus();
            this.primaryStatus = pri.new;
            this.secondaryStatus = sec.new;
            this.opsDevice = ops.new;
            let newState = this.getSessionStatus();

            if (newState === 'IDLE') {
                if (oldState !== 'IDLE') {
                    this.endSession();
                }
                rlGainClient = IDLE_RUNLENGTH / 3;  // avg run length until we gain a client
                prLoseClient = 2;   // 2ce as likely to lose vs. gain a client
            }
            else {  // newState RUNNING | OPS-ISSUE | ALT-ISSUE
                if (oldState === 'IDLE') { // STARTING a session!
                    this.cmdSource = CCT.tools.randElt(CMD_SOURCES);
                    this.cmdDest = CCT.tools.randElt(CMD_DESTS);
                    this.vehicle = CCT.tools.randInt(99999, 10000);  // 5-digit IRON number
                    this.runningLogLength = 0;

                    // svCmds should already be zero
                    // opsDevice and pri/sec status should already be cleared
                    // pri/sec sent/rcvd should already be zero

                    this.azimuth = CCT.tools.randInt(360, 0);
                    this.elevation = CCT.tools.randInt(90, 0);
                    this.agc = CCT.tools.randInt(200, -200);
                }

                if (!onARoll(BETWN_SVCMD_RUNLENGTH)) ++this.svCmds;

                // network action
                let randTraffic = (max, relNone) => Math.max(CCT.tools.randInt(max, -relNone), 0);
                if (this.primaryStatus === 'CONNECTED') {
                    this.primarySent += randTraffic(12, 6);
                    this.primaryRecvd += randTraffic(12, 6);
                }
                if (this.secondaryStatus === 'CONNECTED') {
                    this.secondarySent += randTraffic(12, 6);
                    this.secondaryRecvd += randTraffic(12, 6);
                }

                // antenna action
                this.azimuth += Math.random() - 0.5;    // +/- up to half a degree
                this.azimuth = CCT.tools.minMax(this.azimuth, 0, 360);
                this.elevation += Math.random() - 0.5;
                this.elevation = CCT.tools.minMax(this.elevation, 0, 90);
                this.agc += 10 * (Math.random() - 0.5);    // +/- up to 5
                this.agc = CCT.tools.minMax(this.agc, -180, 200);

                // TODO: SAB would go here; similar to add-client logic, randomly build it up to 28, then eat it back down

                rlGainClient = SESSION_RUNLENGTH / 5;  // avg run length until we gain a client
                prLoseClient = 1;   // equally likely to lose vs. gain a client
            }

            // gain/lose clients
            var r = Math.random();
            var p = CCT.tools.probFalseRun(rlGainClient);
            if (r < p) this.clients++;      // gain or lose client based on run length and prob ratio
            else if (r < p * (1 + prLoseClient)) this.clients--;
            if (this.clients < 0) this.clients = 0;
        },
        getConfig: function () {
            // JSON content for CONFIG request
            let obj = this.isIdle() ? {
                NAME: 0,    // these props match redis Gateway's behavior when config empty
                response: 'Empty config'
            } : {
                SITE: 'COOK-A',
                LATITUDE: '34.7325',   // Vandenberg Air Force Base
                LONGITUDE: '120.568056',  // CCT uses (+) for West, (-) for East
                OPS_LINK: this.opsDevice,
                LOGPATH: 'C:\\Users\\serverDude\\file.txt',
            };
            return maybeAddErrProps(obj, ERROR_PROPS_PROB);
        },
        getUpdate: function () {
            this.nextState();
            // JSON content for STATUS request
            let obj = {
                SYSTIME: sysTime(this.now),
                CMD_SRC: this.cmdSource,
                CMD_SRC_STATUS: this.isIdle() ? '' : onARoll(SESSION_RUNLENGTH / 3) ? 'READY' : 'FAILED',
                CMD_DST: this.cmdDest,
                CMD_ECHO: 'DISABLE',
                CLIENTS: hostNames(this.clients),
                PRI_ADCCP_MSG_SENT: this.primarySent + '',
                PRI_ADCCP_MSG_RCVD: this.primaryRecvd + '',
                SEC_ADCCP_MSG_SENT: this.secondarySent + '',
                SEC_ADCCP_MSG_RCVD: this.secondaryRecvd + '',
                PRICONNECT: this.primaryStatus === 'CONNECTED' ? 'TRUE' : 'FALSE',
                SECCONNECT: this.secondaryStatus === 'CONNECTED' ? 'TRUE' : 'FALSE',
                PRI_CONNECT_FAILURE: this.primaryStatus === 'FAILED' ? 'TRUE' : 'FALSE',
                SEC_CONNECT_FAILURE: this.secondaryStatus === 'FAILED' ? 'TRUE' : 'FALSE',
                TASKSTATUS: this.getTaskStatus(),
            };
            return maybeAddErrProps(obj, ERROR_PROPS_PROB);
        },
        getStatus: function () {
            let obj = this.getSessionStatus() === 'OPS-ISSUE' || this.getSessionStatus() === 'IDLE' ? {
                TIME2: '',
                AZ: '',
                EL: '',
                AGC_VALUE: '',
                XMTR: '',
                SAB: '',
                ANTMODE: '',
                SV_CMDS_RCVD: '',
                VEHICLE: '',
            } : {
                TIME2: siteTime(this.now),
                AZ: this.azimuth + '',
                EL: this.elevation + '',
                AGC_VALUE: this.agc + '',
                XMTR: this.isIdle() ? '' : CCT.tools.randElt(['ANTENNA', 'DUMMYLOAD', 'OTHER']),
                SAB: CCT.tools.randInt(29, 0) + '', // TODO: SAB = Slave Angle Buffer; builds up to 28, gets "eaten" back down
                ANTMODE: this.isIdle() ? '' : CCT.tools.randElt(['AMB', 'ATK', 'MNL', 'SLV']),
                SV_CMDS_RCVD: this.svCmds + '',
                VEHICLE: this.vehicle + '',
            };
            return maybeAddErrProps(obj, ERROR_PROPS_PROB);
        },
        getLogDelta: function (lineNum) {
            // JSON content for LOGDELTA request
            var entries = [];
            var n = CCT.tools.randInt(9, 3),
                i;
            for (i = 0; i < n; i++) {
                entries.push(`Line ${lineNum + i}: ${simMessage()}`);
            }
            this.runningLogLength += n;
            return {
                lastIndex: this.runningLogLength < INITIALLASTLOGINDEX ? INITIALLASTLOGINDEX : this.runningLogLength,
                entries: entries
            }
        },
        getIniFile: function () {
            return JSON.stringify(
                "// AceCCT INI file\n"
                + "// (demo generated by simServer.js)\n"
                + "\n"
                + "[Morpheus]\n"
                + "FAITH=fanatical\n"
                + "COAT=leather\n"
                + "\n"
                + "[AgentSmith]\n"
                + "MOOD=scary\n"
                + "INSTANCES=unlimited\n"
                + "\n"
                + "[Neo]\n"
                + "ALIAS=Mr. Anderson\n"
                + "NEUROKINETICS=off the charts\n")
        }
    };
    const ERROR_PROPS_PROB = 0.1;

    // The optional error object
    var errDict = [
        {code: 0, message: 'Mad cow approaching, unwise trip to UK.'},
        {code: 7, message: 'Wrong way, turn around.'},
        {code: 97, message: 'Nice tie, bonehead!'},
        {code: 13, message: 'No one truly likes bananas (do they?).'},
        {code: 29, message: 'Unfrosted Pop-Tart, try again.'},
        {code: 1, message: 'Stale Pop-Tart in UPDATE, try again.'}, // codes 1 & 2 are staleness flags from Node/redis server
        {code: 2, message: 'Stale Pop-Tart in STATUS, try again.'},
    ];
    var randErr = () => errDict[CCT.tools.randInt(errDict.length - 1)];

    // randomly add error properties to an object @ given probability, default 50%
    function maybeAddErrProps(obj, prob = 0.5) {
        if (Math.random() < +prob) {
            obj.error = randErr();
        }
        return obj;
    }

    function sysTime(dt) {
        const leadingZero = n => n > 9 ? `${n}` : `0${n}`;

        var mo = leadingZero(dt.getMonth() + 1),    // Date.getMonth() is zero-based, 0=Jan
            dd = leadingZero(dt.getDate()),
            yyyy = dt.getFullYear(),
            hh = leadingZero(dt.getHours()),
            mm = leadingZero(dt.getMinutes()),
            ss = leadingZero(dt.getSeconds());

        return `${mo}/${dd}/${yyyy} ${hh}:${mm}:${ss}`;
    }

    function siteTime(dt) {
        var dayNum = CCT.tools.dayOfYear(dt);
        var seconds = dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
        return CCT.tools.zeroPadNumString(dayNum, 3) + '/' + CCT.tools.zeroPadNumString(seconds, 5);
    }

    function hostNames(n) {
        var s = '';
        while (n) {
            s += `${s ? '|' : ''}host${n--}`;
        }
        return s;
    }

    // --- URI Mapping ---
    // Map URI's to application objects/methods.
    // No application logic! That should appear above in app objects/methods.

    // dictionary mapping URI's to responses
    // Map each URI to a string literal or object literal or function(uri, options). Caller will detect type and handle appropriately.
    var uriDict = {
        '/api/configuration': () => simCCT.getConfig(), // invoke via simCCT to get 'this' ptr
        '/api/update': () => simCCT.getUpdate(),
        '/api/status': () => simCCT.getStatus(),
        '/api/log/': () => simCCT.getLogDelta(0),
        '/api/iniFile': () => simCCT.getIniFile(),

        // NOT PART OF THE REAL API, just examples...

        // Examples of returning literals
        '/api/forty-two/': '42',
        '/api/fifty-four': {'what is': 'six times nine'},

        // Example of returning a function, including a function that returns a function
        '/api/error/': function (uri, options) {
            // return a random error of 3 possibilities
            // TODO: a way of receiving these errors as errors up higher; currently all responses are assumed successful
            var n = CCT.tools.randInt(3, 0);
            switch (n) {
                case 0:
                    return {ok: false, status: 404, statusText: 'Not found'};
                    break;
                case 1:
                    return {ok: false, status: 418, statusText: "I'm a teapot"};
                    break;
                case 2:
                    return {ok: false, status: 500, statusText: 'Internal server error'};
                    break;
                default:    // case 3
                    return function (uri, options) {
                        return {monkey: 'left-handed'};
                    };
                    break;
            }
        },
    };

    function uriPatternContent(uri) {
        // entryPts: list of RegExp URI patterns and content to go with them
        //   re: RegExp pattern for URI to match
        //   content: what this URI pattern maps to; if function, it will be called with the RegExp matching array/object
        // The first RegExp to match will be used.
        // NB: "content" functions entered here are for generating content here, not returned to caller.
        //   To return a function back up to the caller, make the "content" function return another function.
        //   Non-functions will simply be returned.
        var entryPts = [

            // Logfile updates, e.g. /api/logDelta/19
            {
                re: /\/api\/logDelta\/(\d+)?\/?/,
                content: function (match) {
                    var lineNum = match[1] ? +match[1] : 0;
                    return simCCT.getLogDelta(lineNum);  // undefined if line # not found
                }
            },

            // sample: add more as needed, content can be function or value (literal/const/var)
            {
                re: /another-regexp/,
                content: {a: 'some data', b: 'whatever', c: "not necessarily a function"}
            },
        ];

        // Now to actually match against the RegExp's and obtain the matching content
        var match, i, ep;
        for (i = 0; i < entryPts.length; i++) {
            ep = entryPts[i];
            match = ep.re.exec(uri);
            if (match) {
                return typeof ep.content === 'function' ? ep.content(match) : ep.content;
            }
        }

        // Didn't match anything = not found as an entry point
        return undefined;
    }


    // --- SIMULATED HTTP LAYER ---
    // This section deals purely with building HTTP responses *from* a given response object.
    // No application logic! That should appear above.

    var fetchCount = 0;
    const RESPONSE_DELAY_MIN_MS = 50,
        RESPONSE_DELAY_MAX_MS = 599,    // good response can skip a status interval
        NO_RESPONSE_DELAY_MIN_MS = 399,
        NO_RESPONSE_DELAY_MAX_MS = 1399,
        NO_RESPONSE_PROB = 0.1; // prob of server not responding at all to this request

    // fetch() API override: return Promise resolving to the HTTP response
    //   response conforms to Response() i/f per fetch() API
    function simFetch(uri, options) {
        ++fetchCount;   // Useful for simulating server conditions, e.g. fail every 3rd request

        // Display important message
        logSimMessage();

        return new Promise(function (resolve, reject) {
            // null means server will not respond, can happen randomly or due to URI handler
            var response = Math.random() < NO_RESPONSE_PROB ? null : responseToURI(uri, options);

            // delay depends on whether server is responding
            var ms = response
                ? CCT.tools.randInt(RESPONSE_DELAY_MAX_MS, RESPONSE_DELAY_MIN_MS)
                : CCT.tools.randInt(NO_RESPONSE_DELAY_MAX_MS, NO_RESPONSE_DELAY_MIN_MS);
            console.log(`simFetch: ${uri} ... ${response ? 'will complete' : 'will *FAIL*'} in ${ms}ms`);

            // After a simulated delay, resolve Promise HTTP response
            setTimeout(function () {
                if (response) {
                    // Any HTTP completion, including errors 400-599
                    resolve(response);
                } else {
                    // Network error, including permissions; machine/OS error... any HTTP response not completed
                    reject(new TypeError("Failed to fetch"));    // Mimics fetch() err seen in Chrome with server down
                }
            }, ms);
        });
    }

    // Look up a URI and return the simulated response
    function responseToURI(uri, options) {
        var content = uriDict[uri];  // retrieves a string, object, or function
        if (content === undefined) {  // try again with variation of trailing slash
            content = uriDict[
                uri.endsWith('/')
                    ? uri.substr(0, uri.length - 1)
                    : uri + '/'
                ];
        }
        if (content === undefined) {  // not found as a static entry point, try as a regexp pattern
            content = uriPatternContent(uri);
        }
        // Now we're out of sources to look up the result, so resolve whatever we got

        // Resolve any functions by calling them until we get a non-function
        while (typeof content === "function") {
            content = content(uri, options);
        }

        // undefined means no such resource = 404 Not Found
        if (content === undefined) {
            return httpResponse(null, 404, "Not Found");
        }
        // null means no response at all = network error
        if (content === null) {
            return null;
        }

        // Testing error conditions
        //return httpResponse( null, 301, "Moved Permanently" );  // simulate receiving an error response
        //return null;  // simulate network error, nothing received

        // Still here? content is data for an actual response
        return httpResponse(content);
    }

    // Convert pretty much any data (d) into an HTTP RESTful response containing that data.
    // Optional status & statusText will be used if provided; otherwise default is 200/OK
    //   primitive types (string, number, etc.) --> text/json return d
    //   object with fields {ok, status, statusText} --> take as pre-formed response object, add text() & json() if nec.
    //   object without those fields --> 200 "OK" with d as the return object
    //   null or undefined --> null, interpret as absence of response, i.e. network error
    //   function --> its return value as any of above; NB it takes no arguments, no uri/options available here
    function httpResponse(d, status, statusText) {
        var response;

        // Convert any function into non-function value
        while (typeof d === 'function') {
            d = d();
        }

        if (d === null || d === undefined) {
            if (status === undefined) {
                return null;    // no response, i.e. network error
            }
            else {
                d = ''; // They passed us a status, so we'll treat this like an empty-string response with their status
            }
        }

        // Is d a response object? Just return it.
        // TODO: should we override status & statusText if they were passed in?
        if (typeof d === 'object'
            && d.ok !== undefined
            && d.status !== undefined
            && d.statusText !== undefined) {
            return d;
        }

        // If we get here, d is a value to wrap in a response object
        response = {ok: true, status: 200, statusText: 'OK'}; // default response type

        // Did they pass us a response type? Override the default.
        if (status !== undefined) {
            response.ok = (status >= 200 && status < 300);
            response.status = status;
            response.statusText = (statusText === undefined || statusText === null)
                ? ''
                : statusText;
        }

        switch (typeof d) {
            case 'boolean':
            case 'number':
                response.text = () => Promise.resolve(String(d));
                response.json = () => Promise.resolve(JSON.parse(String(d)));
                break;
            case 'string':
                response.text = () => Promise.resolve(d);
                response.json = () => Promise.resolve(JSON.parse(d));
                break;
            case 'object':
            default:    // means it's a host object
                response.text = () => Promise.resolve(JSON.stringify(d));
                response.json = () => Promise.resolve(d);
                break;
        }
        return response;
    }

    // Important messages for console
    var importantMessages = [
        "Follow the white rabbit.",
        "I know what you're thinking: shoulda taken the blue pill!",
        "Human beings are a disease, a cancer of this planet.",
        "You're a plague and we are the cure.",
        "This reality, whatever you want to call it, I can't stand it any longer.\n"
        + "It's the smell, if there is such a thing.",
        "I hate this place. This zoo. This prison.",
        "This is your last chance. After this, there is no turning back.",
        "You take the blue pill - the story ends, you wake up in your bed and believe whatever you want to believe.\n"
        + "You take the red pill - you stay in Wonderland and I show you how deep the rabbit-hole goes.",
        "To deny our own impulses is to deny the very thing that makes us human.",
        "What *IS* real?",
        "I know you're out there. I can feel you now. I know that you're afraid.",
        "There's a difference between knowing the path and walking the path.",
        "You have the look of a man who accepts what he sees because he is expecting to wake up.",
        "I don't like the idea that I'm not in control of my life.",
        "You've felt it your entire life, that there's something wrong with the world.\n"
        + "You don't know what it is, but it's there, like a splinter in your mind, driving you mad.",
        "Ignorance is bliss. Pass the steak.",
        "Never send a human to do a machine's job.",
        "Some believe we lack the programming language to describe your perfect world.",
        "There is no spoon.",
        "It is not the spoon that bends, it is only yourself.",
        "I believe that, as a species, human beings define their reality through suffering and misery.",
        "You're cuter than I thought. I can see why she likes you.",
        "I'd ask you to sit down, but you're not going to anyway. And don't worry about the vase.",
        "I'm trying to free your mind. But I can only show you the door. You're the one that has to walk through it.",
        "What are you waiting for? You're faster than this.",
        "Come on. Stop trying to hit me and hit me.",
        "You have to understand, most of these people are not ready to be unplugged.",
        "Were you listening to me? Or were you looking at the woman in the red dress?",
        "If you are not one of us, you are one of them.",
        "Nobody has ever done this before. That's why it's going to work.",
        "Unfortunately, no one can be told what good UI/UX is. You have to see it for yourself.",
        "You hear that, Mr. Anderson?... That is the sound of inevitability.",
        "Goodbye, Mr. Anderson.",
        "I know why you're here. I know what you've been doing... why you hardly sleep,\n"
        + "why you live alone, and why night after night, you sit by your computer.",
        "The answer is out there. It's looking for you, and it will find you if you want it to.",
        "Was it the same cat?",
        ""
        + "DAS*$Jabgt489tb;klj_*9543o2nt98t\n"
        + "DSV FSRF&*(VFS FS:LFSJF(_*F )) {\n"
        + " YH  *ABN  JJA ) LADP_$@$ BVNA J\n"
        + "  (  @$*&   N7 g 53q 0uP(  GH)  \n"
        + "  Y   dg;   || / Tg   M!    NV  \n"
        + "  V    ]/    } }  &   X     *%  \n"
        + "        H    !!       k     $   \n"
        + "        $     %             #   \n"
        + "              @                 \n"
        + "              ^                 "
    ];

    function simMessage(n) {
        if (n === undefined) {
            return CCT.tools.randElt(importantMessages);
        }
        else {
            var len = importantMessages.length;
            n = +n % len;
            if (n < 0) {
                n += len;
            }
            return importantMessages[+n];
        }
    }

    function logSimMessage() {
        // only display sometimes -- intermittent reinforcement makes the copper-tops beg!!
        if (Math.random() < 0.7) {
            matrixLog(simMessage());
        }
    }


    // --- Exported object ---
    return {
        enter: enterTheMatrix,
        exit: exitTheMatrix,
        //setError: function(statusCode, msg) { ...  set up the next error to be returned }
    };

})();


// Handy (& fun!) synonyms for console access
CCT.neo = CCT.theMatrix = CCT.simServer;
var bluePill = CCT.theMatrix.enter,
    redPill = CCT.theMatrix.exit;

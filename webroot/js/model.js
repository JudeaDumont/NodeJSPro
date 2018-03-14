/* model.js -- core data model, central store to hold data and app/biz logic that is independent of display.
 *   This is the first "M" of the "MVVM" pattern (Model-View-ViewModel) that Vue is loosely based on.
 *   No display or presentation logic!
 *   This is the abstract data model, the "truth" that is independent of any view or display.
 */

// REQUIRES: tools.js, for global namespace object "CCT" and some helper functions


// -- CCT.model -- the main model root; modules contained under this root are various topical areas of the data model
CCT.model = {};
CCT.m = CCT.model;    // alias for console convenience


// --- Top-level state queries ---
// USE THESE FIRST!!
// Call these functions instead of writing one-off low-level logic tests.
// Add to these as needed, all big-picture state queries that will be used more than once.
CCT.model.isIdle = function () {
    // isIdle = we are not in an active task/processing state
    const ts = this.updateMsg.updateMsgProperties.taskstatus;
    return ts === 'IDLE' || ts === '';
};
CCT.model.inSession = function () {
    // inSession = we are in a session/task, including any pre/post/meta states
    // semantically could diverge from isIdle, but for now they are just negatives
    return !this.isIdle();
};
CCT.model.missingConfig = function () {
    // missingConfig = we need a config but don't have one
    return this.inSession() && this.config.isEmpty();
};


// --- User settings model module ---
CCT.model.settings = (function () {
    return {
        homeName: 'Braxton Tech',
        homeLat: 38.833373,
        homeLong: -104.813585,
    }
})();


// --- General function to update properties of config, status and update messages ---
CCT.model.updateProperties = function (currentProperties, newProperties, propertiesActions) {
    let newKeys = Object.keys(newProperties);
    let currentKeys = Object.keys(currentProperties);
    for (let keyIndex in newKeys) {
        let key = newKeys[keyIndex],
            keyLC = key.toLowerCase();

        if (typeof newProperties[key] !== 'function') { // skip obj.isConfig() etc.
            if (propertiesActions.hasOwnProperty(key)) {
                if (typeof (propertiesActions[key]) === 'function') {
                    currentProperties[keyLC] = propertiesActions[key](newProperties[key]);
                }
                else {
                    currentProperties[keyLC] = newProperties[key];
                }
            }
            else { //no action was specified for that particular key
                // console.log(`Key uncompensated for: "${key}" \n`);    //todo: disable in prod, dev tool only
                currentProperties[keyLC] = newProperties[key];
            }
        }
    }

    for (let currentKeyIndex in currentKeys) {
        let currentKey = currentKeys[currentKeyIndex];
        if (!newProperties.hasOwnProperty(currentKey.toUpperCase())) {
            if (typeof currentProperties[currentKey] !== 'function') {
                currentProperties[currentKey] = '';
            }
        }
    }
};

CCT.model.truthy = function (val) {
    return val === 'TRUE' || val === 'ENABLED' || val === 'ENABLE' || val === 'Yes'
        || val === true || (typeof val === 'number' && val !== 0);
};

CCT.model.safeParseInt = (x) => x === '' ? '' : typeof x === 'string' ? parseInt(x) : x;
CCT.model.safeParseFloat = (x) => x === '' ? '' : typeof x === 'string' ? parseFloat(x) : x;


// --- Client Errors Abstraction Model Module ---
CCT.model.errorModelTools = (function () {
    //todo: classes attached to the banner message represent the error message severity
    return {
        resetErrorStates: function (errorsToReset) {
            let entries = Object.keys(errorsToReset);
            for (let i = 0; i < entries.length; i++) {
                if (typeof errorsToReset[entries[i]] !== 'function') {
                    errorsToReset[entries[i]] = false;
                }
            }
        },
        nodeErrorStates: {
            'appCouldNotStart': 4,
            'appStartedAndThrewErrors': 4,
            // 'writeToLogFailure',
            // 'badResponse'
        },

        redisErrorStates: {
            // 'getKeysError':'catastrophic',
            // 'createKeysError':'catastrophic',
            // 'setHashMapError':'catastrophic',
            'updatePullFailure': 3,
            'statusPullFailure': 3,
            // 'iniPullFailure':'catastrophic',
            // 'logPullFailure':'catastrophic',
            'redisConnectError': 4,
            'redisSubscriberClientErrorsAbort': 'warn0',        //RedisSubscriber errors signify config pull failures as well
            'redisSubscriberClientErrorsAggregate': 'warn0',
            'redisSubscriberClientErrorsRedis': 'warn0',
            'redisSubscriberClientErrorsReply': 'warn0',
            'redisSubscriberClientErrorsParser': 'warn0',
            'redisSubscriberClientErrorsConnection': 'warn0',
            'redisClientErrorsAbort': 3,
            'redisClientErrorsAggregate': 3,
            'redisClientErrorsRedis': 3,
            'redisClientErrorsReply': 3,
            'redisClientErrorsParser': 3,
            'redisClientErrorsConnection': 3,
        },
        checkStrings: {
            errorStringCheck: 'Error:',
            recoverStringCheck: 'Recover:'
        },

        errorStates: {},
        notified: {},
        errorSeverityStates: {},
        update: function (boolToBeSetForAnError, errorObj, errorConcernsMultiArray) {
            CCT.model.errorModelTools.resetErrorStates(boolToBeSetForAnError);

            //get the errors that occurred
            let errorsThatOccurred = errorObj.data;

            //flatten out the error concerns
            //todo: errorConcernsMultiArray is an array
            let flatErrorConcerns = {};
            for (let i = 0; i < errorConcernsMultiArray.length; i++) {
                let errorConcernsCategory = errorConcernsMultiArray[i];
                let errorConcernCategoryKeys = Object.keys(errorConcernsCategory);
                for (let j = 0; j < errorConcernCategoryKeys.length; j++) {
                    flatErrorConcerns[errorConcernCategoryKeys[j]] = errorConcernsCategory[errorConcernCategoryKeys[j]];
                }
            }

            //get the errors we care about
            let errorsThatHappenedThatWeCareAbout = {};
            let errorsThatOccurredKeys = Object.keys(errorsThatOccurred);
            for (let j = 0; j < errorsThatOccurredKeys.length; j++) {
                if (flatErrorConcerns.hasOwnProperty(errorsThatOccurredKeys[j])) {
                    errorsThatHappenedThatWeCareAbout[errorsThatOccurredKeys[j]] = errorsThatOccurred[errorsThatOccurredKeys[j]];
                }
            }

            //get all the errors we recovered from that we care about
            //if we recovered from them then we need to erase the error state and the fact that we notified them of the error
            errorStateKeys = Object.keys(this.errorStates);
            let errorsThatWeRecoveredFrom = {};
            for (let i = 0; i < errorStateKeys.length; i++) {
                //exclude errors that we don't care about
                if (flatErrorConcerns.hasOwnProperty(errorStateKeys[i])
                    && !errorsThatOccurred.hasOwnProperty(this.errorStates[errorStateKeys[i]])) {
                    errorsThatWeRecoveredFrom[errorStateKeys[i]] = this.errorStates[errorStateKeys[i]].replace(/Error/g, 'Recover');
                    delete this.errorStates[errorStateKeys[i]];
                    delete this.notified[errorStateKeys[i]];
                }
            }

            //persist the state for all errors that occurred
            let errorsThatHappenedThatWeCareAboutKeys = Object.keys(errorsThatHappenedThatWeCareAbout);
            for (let i = 0; i < errorsThatHappenedThatWeCareAboutKeys.length; i++) {
                this.errorStates[errorsThatHappenedThatWeCareAboutKeys[i]] = errorsThatHappenedThatWeCareAbout[errorsThatHappenedThatWeCareAboutKeys[i]];
            }

            //get the highest severity of the error that occurred or that was recovered from
            //keep track of all the errors that have occurred as the more severe error counts as notification of all others
            //Keep track of the error we are about to notify them of so we dont keep notifying them
            //Set the higher abstraction errors if we have or recovered from them
            let highestErrorSeverity = -1;
            let highestRecoverSeverity = -1;
            let errMsg = '';
            let errorOfNotification = '';
            let indexOfMostSevereError = -1;
            let indexOfMostSevereRecovery = -1;
            for (let i = 0; i < errorsThatHappenedThatWeCareAboutKeys.length; i++) {
                if (flatErrorConcerns[errorsThatHappenedThatWeCareAboutKeys[i]] > highestErrorSeverity) {
                    highestErrorSeverity = flatErrorConcerns[errorsThatHappenedThatWeCareAboutKeys[i]];
                    errMsg = errorsThatHappenedThatWeCareAbout[errorsThatHappenedThatWeCareAboutKeys[i]];
                    errorOfNotification = errorsThatHappenedThatWeCareAboutKeys[i];
                    indexOfMostSevereError = i;
                    boolToBeSetForAnError['level' + flatErrorConcerns[errorsThatHappenedThatWeCareAboutKeys[i]]] = true;
                }
            }
            for (let i = 0; i < errorsThatHappenedThatWeCareAboutKeys.length; i++) {
                if (i !== indexOfMostSevereError) {
                    this.notified[errorsThatHappenedThatWeCareAboutKeys[i]] = true;
                }
            }
            let errorsRecoveredFromKeys = Object.keys(errorsThatWeRecoveredFrom);
            for (let i = 0; i < errorsRecoveredFromKeys.length; i++) {
                if (flatErrorConcerns[errorsRecoveredFromKeys[i]] > highestErrorSeverity) {
                    highestRecoverSeverity = highestErrorSeverity = flatErrorConcerns[errorsRecoveredFromKeys[i]];
                    errMsg = errorsThatWeRecoveredFrom[errorsRecoveredFromKeys[i]];
                    errorOfNotification = errorsRecoveredFromKeys[i];
                    indexOfMostSevereRecovery = i;
                    boolToBeSetForAnError['level' + flatErrorConcerns[errorsThatHappenedThatWeCareAboutKeys[i]]] = false;
                }
            }
            for (let i = 0; i < errorsRecoveredFromKeys.length; i++) {
                if (i !== indexOfMostSevereRecovery) {
                    this.notified[errorsRecoveredFromKeys[i]] = true;
                }
            }

            if (errMsg !== '' && !this.notified.hasOwnProperty(errorOfNotification)) {
                CCT.model.banner.message = errMsg;
                console.log(errMsg);
            }

            // //todo: go over errors and decide which ones are show stoppers

            //set the errorSeverity State
            this.errorSeverityStates[highestErrorSeverity] = true;
            this.errorSeverityStates[highestRecoverSeverity] = false;

            if (this.errorSeverityStates[4] || this.errorSeverityStates[3]) {
                CCT.model.banner.cat4 = true;
            }
            else{
                CCT.model.banner.cat4 = false;
            }
        }
    }
})();


CCT.model.banner = (function () {
    return {
        cat4: false,
        active: false,
        message: '',
    }
})();

// --- Update model module ---
CCT.model.updateMsg = (function () {
    return {
        cctError: {
            level1: false,
            level2: false,
            level3: false,
            level4: false,
            level0: false,
            catastrophic: function () {
                return this.level1 || this.level2 || this.level3 || this.level4;
            }
        },
        cctErrorStates: {
            // 'jsonParseException',
            'jsonParseExceptionupdateErr': 2,
            'jsonParseExceptionupdate': 3,
            // 'updateStaleness',
            'updateStale': 2,
        },
        // TODO: delete redundant 'update' from prop name & shorten --> CCT.model.updateMsg.props
        updateMsgProperties: {
            cmd_src: '',
            cmd_dst: '',
            cmd_echo: '',
            cmd_term: '',
            priopen: '',
            priconnect: '',
            secopen: '',
            secconnect: '',
            systime: '',
            clients: '',
            pri_adccp_msg_sent: '',
            pri_adccp_msg_rcvd: '',
            sec_adccp_msg_sent: '',
            sec_adccp_msg_rcvd: '',
            pri_connect_failure: '',
            sec_connect_failure: '',
            taskstatus: '',
            cmd_src_status: '',
            error: '',
        },
        // TODO: delete redundant 'update' from prop name & shorten --> CCT.model.updateMsg.propsActions
        updatePropertiesActions: {
            CMD_SRC: null,
            CMD_DST: null,
            CMD_ECHO: null,
            CMD_TERM: function (val) {
                return CCT.model.truthy(val);
            },
            PRIOPEN: function (val) {
                return CCT.model.truthy(val);
            },
            PRICONNECT: function (val) {
                return CCT.model.truthy(val);
            },
            SECOPEN: function (val) {
                return CCT.model.truthy(val);
            },
            SECCONNECT: function (val) {
                return CCT.model.truthy(val);
            },
            SYSTIME: null,
            CLIENTS: function (val) {
                return val === "" ? 0 : val.split('|').length;
            },
            PRI_ADCCP_MSG_SENT: function (val) {
                return CCT.model.safeParseInt(val)
            },
            PRI_ADCCP_MSG_RCVD: function (val) {
                return CCT.model.safeParseInt(val)
            },
            SEC_ADCCP_MSG_SENT: function (val) {
                return CCT.model.safeParseInt(val)
            },
            SEC_ADCCP_MSG_RCVD: function (val) {
                return CCT.model.safeParseInt(val)
            },
            PRI_CONNECT_FAILURE: function (val) {
                return CCT.model.truthy(val);
            },
            SEC_CONNECT_FAILURE: function (val) {
                return CCT.model.truthy(val);
            },
            TASKSTATUS: null,
            CMD_SRC_STATUS: null,
            error: function (val) {
                CCT.model.errorModelTools.update(
                    CCT.model.updateMsg.cctError,
                    val,
                    [CCT.model.updateMsg.cctErrorStates, CCT.model.errorModelTools.nodeErrorStates, CCT.model.errorModelTools.redisErrorStates]
                );
                return val;
            },
        },
        clear: function () {

            let keys = Object.keys(this.updateMsgProperties);
            for (let key in keys) {
                if (typeof this.updateMsgProperties[keys[key]] !== 'function') {
                    this.updateMsgProperties[keys[key]] = '';
                }
            }
            return this;
        },
        update: function (obj) {
            CCT.model.updateProperties(this.updateMsgProperties, obj, this.updatePropertiesActions);
        }
    }
})();

// --- Config model module ---
CCT.model.config = (function () {
    return {
        // TODO: delete redundant 'config' from prop name & shorten --> CCT.model.config.props
        configProperties: {
            idlemode: '',
            cmdrate: '',
            cmdmsg_size: '',
            ops_link: '',
            slaving: '',
            commanding: '',
            cmd_idle_threshold: '',
            cmd_mode: '',
            cmd_term_enable: '',
            rawadccp: '',
            rws_enable: '',
            opermode: '',
            site: '',
            latitude: '',
            longitude: '',
            logpath: ''
        },
        // TODO: delete redundant 'config' from prop name & shorten --> CCT.model.config.propsActions
        configPropertiesActions: {
            LOGPATH: null,
            IDLEMODE: null,
            CMDRATE: function (val) {
                return CCT.model.safeParseInt(val)
            },
            CMDMSG_SIZE: function (val) {
                return CCT.model.safeParseInt(val)
            },
            OPS_LINK: null,
            SLAVING: function (val) {
                return CCT.model.truthy(val);
            },
            COMMANDING: function (val) {
                return CCT.model.truthy(val);
            },
            CMD_IDLE_THRESHOLD: function (val) {
                return CCT.model.safeParseInt(val)
            },
            CMD_MODE: function (val) {
                return CCT.model.safeParseInt(val)
            },
            CMD_TERM_ENABLE: function (val) {
                return CCT.model.truthy(val);
            },
            RAWADCCP: null,
            RWS_ENABLE: function (val) {
                return CCT.model.truthy(val);
            },
            OPERMODE: null,
            SITE: null,
            LATITUDE: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            LONGITUDE: function (val) {
                return -CCT.model.safeParseFloat(val)     // CCT uses (+) for West, (-) for East; opposite of d3 et al
            }
        },

        clear: function () {
            let keys = Object.keys(this.configProperties);
            for (let key in keys) {
                if (typeof this.configProperties[keys[key]] !== 'function') {
                    this.configProperties[keys[key]] = '';
                }
            }
            return this;    // allows chaining
        },
        isEmpty: function () {
            return !this.configProperties.site; // missing or ''
        },
        hasActiveLog: function () {
            return !!this.configProperties.logpath; // missing or ''
        },
        update: function (obj) {

            CCT.model.updateProperties(this.configProperties, obj, this.configPropertiesActions);
        },
    }
})();


// --- Status model module ---
CCT.model.status = (function () {
    return {
        siteError: {
            level1: false,
            level2: false,
            level3: false,
            level4: false,
            level0: false,
            catastrophic: function () {
                return this.level1 || this.level2 || this.level3 || this.level4
            }
        },
        siteErrorStates: {
            // 'statusStaleness',
            'statusStale': 2,
            'jsonParseExceptionstatusErr': 3,
            'jsonParseExceptionstatus': 3,
            // 'jsonParseExceptionconfig',
        },
        // TODO: delete redundant 'status' from prop name & shorten --> CCT.model.status.props
        statusProperties: {
            year: '',
            time1: '',
            time2: '',
            time3: '',
            time4: '',
            az: '',
            el: '',
            range: '',
            prate: '',
            xmtr: '',
            m34: '',
            sab: '',
            antmode: '',
            cmdbuff: '',
            active: '',
            echo_mode: '',
            agc1: '',
            agc2: '',
            agc3: '',
            agc4: '',
            rws: '',
            idle_mode: '',
            cmd_rate: '',
            cmd_enabled: '',
            cmd_mode: '',
            az_delta: '',
            el_delta: '',
            range_delta: '',
            pcmsim_enabled: '',
            sv_cmds_sent: '',
            sv_cmds_rcvd: '',
            agc_value: '',
            vehicle: '',
            error: '',
        },
        // TODO: delete redundant 'status' from prop name & shorten --> CCT.model.status.propsActions
        statusPropertiesActions: {
            YEAR: null,
            TIME1: null,
            TIME2: null,
            TIME3: null,
            TIME4: null,
            AZ: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            EL: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            RANGE: null,
            RRATE: null,
            XMTR: null,
            M34: null,
            SAB: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            ANTMODE: null,
            CMDBUFF: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            ACTIVE: null,
            ECHO_MODE: function (val) {
                return CCT.model.truthy(val);
            },
            AGC1: null,
            AGC2: null,
            AGC3: null,
            AGC4: null,
            RWS: null,
            IDLE_MODE: null,
            CMD_RATE: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            CMD_ENABLED: function (val) {
                return CCT.model.truthy(val); //SHOULD BE TRUE OR FALSE
            },
            CMD_MODE: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            AZ_DELTA: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            EL_DELTA: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            RANGE_DELTA: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            PCMSIM_ENABLED: function (val) {
                return CCT.model.truthy(val);
            },
            SV_CMDS_SENT: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            SV_CMDS_RCVD: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            AGC_VALUE: function (val) {
                return CCT.model.safeParseFloat(val)
            },
            VEHICLE: null,  // 5-digit numeric string; we want it as a string
            error: function (val) {
                CCT.model.errorModelTools.update(
                    CCT.model.status.siteError,
                    val,
                    [CCT.model.status.siteErrorStates, CCT.model.errorModelTools.nodeErrorStates, CCT.model.errorModelTools.redisErrorStates]
                );
                return val;
            },
        },
        clear: function () {
            let keys = Object.keys(this.statusProperties);
            for (let key in keys) {
                if (typeof this.statusProperties[keys[key]] !== 'function') {
                    this.statusProperties[keys[key]] = '';
                }
            }
            return this;
        },
        update: function (obj) {
            // CCT.model.errorModelTools.resetErrorStates(this.siteError);
            CCT.model.updateProperties(this.statusProperties, obj, this.statusPropertiesActions);
        }
    }
})();


// --- Clock model module ---
CCT.model.clock = (function () {
    const SYSTIME_RE = /(\d+)\/(\d+)\/(\d{2,4})\s*(\d+):(\d+):(\d+)/,
        SITETIME_RE = /(\d+)\/(\d+)/;
    return {
        sysTime: {     // CCT's time, when idle or tasked
            mo: '',
            dd: '',
            yyyy: '',
            hh: '',
            mm: '',
            ss: '',
            ddd: '',
            secOfDay: '',
        },

        // we are not currently displaying site time, but we'll leave it in here for now; still is part of model's world
        siteTime: {    // site time, only when tasked
            ddd: '',
            secOfDay: '',
        },
        clear: function () {
            this.sysTime.mo = '';
            this.sysTime.dd = '';
            this.sysTime.yyyy = '';
            this.sysTime.hh = '';
            this.sysTime.mm = '';
            this.sysTime.ss = '';
            this.sysTime.ddd = '';
            this.sysTime.secOfDay = '';

            this.siteTime.ddd = '';
            this.siteTime.secOfDay = '';
            return this;    // allows chaining
        },
        update: function (obj) {
            var t, str, match;
            const zp = CCT.tools.zeroPadNumString;  // alias for this function
            if (obj.isUpdate()) {
                t = this.sysTime;
                str = CCT.model.updateMsg.updateMsgProperties.systime;
                if (str) {
                    match = SYSTIME_RE.exec(str);
                    if (match) {
                        t.mo = match[1];    // all are stored as strings
                        t.dd = match[2];
                        t.yyyy = match[3];
                        t.hh = match[4];
                        t.mm = match[5];
                        t.ss = match[6];

                        // seconds elapsed since start of today, 0 to 86400
                        t.secOfDay = t.hh !== undefined && t.hh !== '' ? (3600 * t.hh) + (60 * t.mm) + +t.ss : '';

                        // in case yyyy is less than 4 digits, fill in digits to produce closest year to now
                        if (t.yyyy.length && t.yyyy.length < 4) {
                            const thisYear = (new Date()).getFullYear();
                            const prefix = ('' + thisYear).substr(0, 4 - t.yyyy.length);
                            // Try prefix of current year on the yyyy year, see how far away that year is
                            const yrsOff = +(`${prefix}${t.yyyy}`) - thisYear;
                            // Now try the next possible prefix, fwd or back in time
                            const altPrefix = yrsOff > 0 ? +prefix - 1 : +prefix + 1;
                            const altYrsOff = +(`${altPrefix}${t.yyyy}`) - thisYear;
                            // reset yyyy to the closest one
                            t.yyyy = `${(Math.abs(yrsOff) < Math.abs(altYrsOff) ? prefix : altPrefix)}${t.yyyy}`;
                        }

                        // Now that we have the year, calculate day-of-year
                        t.ddd = t.yyyy ? zp(CCT.tools.dayOfYear(t.mo, t.dd, t.yyyy), 3) : '';
                    }
                    else {
                        console.warn('CCT.model.clock: *** bad SYSTIME format');
                    }
                }
                else {
                    // console.warn('CCT.model.clock: *** empty SYSTIME property');
                }
            }
            // no "else" allows for a hybrid status/update msg
            if (obj.isStatus()) {
                t = this.siteTime;
                str = CCT.model.status.statusProperties.time2;
                if (str) {
                    match = SITETIME_RE.exec(str);
                    if (match) {
                        t.ddd = match[1];    // all are stored as strings
                        t.secOfDay = match[2];
                    }
                    else {
                        console.warn('CCT.model.clock: *** bad SITETIME format');
                    }
                }
                else {
                    // console.warn('CCT.model.clock: *** empty SITETIME property');
                }
            }
        },
    }
})();


// --- Log model module ---
CCT.model.log = (function () {
    const MAXLOGLENGTH = 10000;
    const MAX_PUSHES = 32;    // max size array to use .push() instead of copying
    return {
        alreadyNotified: [],
        entries: [],
        baseLineNum: 0, // server's line # corresponding to entries[0]; changes when we clear window
        clear: function () { // empty the log but keep future updates rolling from their current place
            this.baseLineNum += this.entries.length;
            this.entries = [];
            return this;    // allows chaining
        },
        restart: function () {   // empty the log and restart all future updates back to line zero
            this.baseLineNum = 0;
            this.entries = [];
            return this;    // allows chaining
        },
        getNextLineNum: function () {
            return this.baseLineNum + this.entries.length;
        },
        update: function (jsonObj) {
            let entries = jsonObj.entries;
            if (Array.isArray(entries) && entries.length > 0) {
                if (entries.length > MAXLOGLENGTH) {
                    entries = entries.slice(entries.length - MAXLOGLENGTH);
                }
                if (!this.entries.length) {
                    // if empty, no point copying the incoming array, which can be huge
                    this.entries = entries;
                }
                else if (this.entries.length + entries.length > MAXLOGLENGTH) {
                    this.entries = this.entries.slice(entries.length - MAXLOGLENGTH);
                    this.baseLineNum += (MAXLOGLENGTH - this.entries.length);
                }
                else if (entries.length < MAX_PUSHES) {
                    for (let i = 0; i < entries.length; i++) {
                        this.entries.push(entries[i]);
                    }
                }
                else {
                    // TODO: are there performance issues with Array.concat() if both arrays are huge?
                    this.entries = this.entries.concat(entries);
                }

                //todo: devMode, debugmode, dev mode, debug mode, delete in production
                for (let i = 0; i < this.entries.length - 1; i++) {
                    if (+this.entries[parseInt(i)].match(/\d+/) + 1 !== +this.entries[(parseInt(i) + 1)].match(/\d+/) && !this.alreadyNotified.includes(+this.entries[i].match(/\d+/))) {
                        console.log("Bad log order!@ " + (parseInt(i) + 1) + ':' + +this.entries[i].match(/\d+/) + '=>' + +this.entries[i + 1].match(/\d+/));
                        this.alreadyNotified.push(+this.entries[i].match(/\d+/));
                        console.log(jsonObj.lastIndex);
                    }
                }
                return this.entries;  // it was our type of object, and caller gets to see the result
            }
        },
    }
})();


// --- Network Status model module ---
CCT.model.network = (function () {

    // constants for detecting low/bad traffic
    const SEND_TRAFFIC_WARNING_TIME = 2000;    // no traffic for 2 sec = we might be losing connection
    const SEND_TRAFFIC_ERROR_TIME = 3000;      // no traffic for 3 sec = we lost it
    const RCVD_TRAFFIC_WARNING_TIME = 4000;    // same thing, for RECV
    const RCVD_TRAFFIC_ERROR_TIME = 6000;

    // object factory to build our comm device objects
    function commDevice(type) {
        return {
            type: type, // source | primary | secondary
            opsAlt: '',   // | ops | alt | ''
            status: 'inactive', // inactive | running | warning | error
            connection: 'disconnected',  // connected | disconnected | failed
            trafficSent: {
                status: 'inactive', // inactive | new-traffic | waiting | warning | error
                new: 0,
                base: CCT.tools.valueTimestamped(type + ' sent'),
            },
            trafficRcvd: {
                status: 'inactive', // inactive | new-traffic | waiting | warning | error
                new: 0,
                base: CCT.tools.valueTimestamped(type + ' sent'),
            },
            clear: function () {
                // don't clear the type!
                this.opsAlt = '';
                this.status = 'inactive';
                this.connection = 'disconnected';
                this.trafficSent.status = 'inactive';
                this.trafficSent.new = 0;
                this.trafficSent.base.clear();
                this.trafficRcvd.status = 'inactive';
                this.trafficRcvd.new = 0;
                this.trafficRcvd.base.clear();
            },
            setConnection: function (connectFlag, failureFlag) {
                // e.g. pass (priconnect, pri_connect_failure)
                if (failureFlag !== undefined) {
                    this.connection = connectFlag ? 'connected' : failureFlag ? 'failed' : 'disconnected';
                }
                else {
                    // but SOURCE has just one param, string = READY | FAILED | ''
                    this.connection = connectFlag === 'READY' ? 'connected'
                        : connectFlag === 'FAILED' ? 'failed' : 'disconnected';
                }
            },
            setOpsAlt: function (opsType) {   // call this after setConnection(), uses connection state
                // pass ops_link from the config msg: primary | secondary | '' (idle)
                if (!opsType) {
                    this.opsAlt = '';
                }
                else if (this.type === opsType.toLowerCase()) {
                    this.opsAlt = 'ops';
                }
                else if (this.type !== 'source') {   // skip for source device, already has opsAlt of ''
                    this.opsAlt = this.connection === 'disconnected' ? '' : 'alt';    // we're the alt unless inactive
                }
            },
            setTraffic: function (sent, rcvd, timeNow) {  // sent/rcvd = latest running totals, timeNow = omit to ignore timeout
                // helper, reusable for sent & rcvd channels
                function setChannel(channelObj, traffic, timeNow, warningTime, errorTime) {
                    if (traffic === undefined) {    // device doesn't have this channel
                        channelObj.status = 'inactive';
                    }
                    else {
                        if (channelObj.base.value === undefined || traffic < channelObj.base.value) {
                            // traffic can be reset to zero while idle, so in case we missed that, just re-save it
                            channelObj.base.save(traffic);
                        }
                        channelObj.new = traffic - channelObj.base.value;   // can only be positive/zero due to above test
                        if (traffic > channelObj.base.value) { // ONLY if new traffic, save & update timestamp
                            channelObj.base.save(traffic);
                            channelObj.status = 'new-traffic';
                        }
                        else if (timeNow) {
                            let elapsed = timeNow - channelObj.base.timestamp;
                            if (elapsed > errorTime) {
                                channelObj.status = 'error';
                            }
                            else if (elapsed > warningTime) {
                                channelObj.status = 'warning';
                            }
                            else {
                                channelObj.status = 'waiting';
                            }
                        }
                        else {  // omit timeNow to ignore traffic-level error states
                            channelObj.status = 'waiting';
                        }
                    }
                }

                if (this.type !== 'source' && !this.opsAlt) {
                    sent = undefined;   // traffic is irrelevant for a dest device that isn't ops or alt
                    rcvd = undefined;
                }
                if (this.opsAlt !== 'ops') {
                    timeNow = undefined;    // timing is only relevant for ops device
                }
                setChannel(this.trafficSent, sent, timeNow, SEND_TRAFFIC_WARNING_TIME, SEND_TRAFFIC_ERROR_TIME);
                setChannel(this.trafficRcvd, rcvd, timeNow, RCVD_TRAFFIC_WARNING_TIME, RCVD_TRAFFIC_ERROR_TIME);
            },
            updateStatus: function () { // call after updating all other props; sets overall status appropriately
                if (this.trafficSent.status === 'error' || this.trafficRcvd.status === 'error') {
                    this.status = 'error';
                }
                else if (this.trafficSent.status === 'warning' || this.trafficRcvd.status === 'warning') {
                    this.status = 'warning';
                }
                else if (this.trafficSent.status === 'waiting' || this.trafficRcvd.status === 'waiting'
                    || this.trafficSent.status === 'new-traffic' || this.trafficRcvd.status === 'new-traffic') {
                    this.status = 'running';
                }
                else {
                    this.status = 'inactive';
                }
            },
            update: function (deviceParams) {
                this.setConnection(deviceParams.connectFlag, deviceParams.failureFlag);
                this.setOpsAlt(deviceParams.opsType);
                this.setTraffic(deviceParams.sent, deviceParams.rcvd, deviceParams.timeNow);
                this.updateStatus();
            },
        }
    }

    const cctErrors = CCT.model.updateMsg.cctError;
    const siteErrors = CCT.model.status.siteError;
    const statusModel = CCT.model.status.statusProperties;
    const updateModel = CCT.model.updateMsg.updateMsgProperties;
    return {
        // network icons, big picture summary
        socStatus: 'idle',
        cctStatus: 'idle',
        siteStatus: 'idle',
        cctToSiteStatus: 'idle',
        socToCctStatus: 'idle',  //follows soc
        signalFlowing: false,

        // details for each device
        sourceDevice: commDevice('source'),
        primaryDevice: commDevice('primary'),
        secondaryDevice: commDevice('secondary'),
        clear: function () {
            this.socStatus = 'idle';
            this.cctStatus = 'idle';
            this.siteStatus = 'idle';
            this.cctToSiteStatus = 'idle';
            this.socToCctStatus = 'idle';
            this.signalFlowing = false;
            this.clearDevices();
            return this;    // allows chaining
        },
        getOpsDevice: function () {
            const ops = CCT.model.config.configProperties.ops_link;
            return ops.startsWith('PRI') ? this.primaryDevice
                : ops.startsWith('SEC') ? this.secondaryDevice : null;
        },
        getAltDevice: function () {
            const ops = CCT.model.config.configProperties.ops_link;
            const nonOps = ops.startsWith('PRI') ? this.secondaryDevice
                : ops.startsWith('SEC') ? this.primaryDevice : null;
            return !nonOps || !nonOps.opsAlt ? null : nonOps;
        },
        update: function (obj) {
            //todo another function layer for checking error states, should just take one argument of the xname of the category.
            let catastrophicCCTError = cctErrors.catastrophic();
            if (catastrophicCCTError) {
                this.socStatus = 'unknown';
                this.cctStatus = 'error';
                this.siteStatus = 'unknown';
                this.cctToSiteStatus = 'unknown';
                this.signalFlowing = false;
                // leave commDevices alone here
            }
            else {
                const isIdle = CCT.model.isIdle();
                const catastrophicSiteError = siteErrors.catastrophic();
                const hasNoClients = +updateModel.clients === 0;
                const activeXMTR = statusModel.xmtr === 'ANTENNA';
                const passiveXMTR = statusModel.xmtr === 'DUMMYLOAD';

                this.updateDevices(obj);

                if (isIdle) {
                    this.socStatus = hasNoClients ? 'idle' : 'active';
                    this.cctStatus = 'idle';
                    this.siteStatus = 'idle';
                    this.cctToSiteStatus = 'idle';
                    this.signalFlowing = false;
                }
                else {  // not IDLE
                    // socStatus
                    this.socStatus = hasNoClients ? 'error' : 'active';

                    // cctStatus
                    this.cctStatus = 'active';

                    // cctToSiteStatus
                    const opsDev = this.getOpsDevice();
                    const ops = opsDev ? opsDev.status : '';
                    if (ops === 'running') {
                        const altDev = this.getAltDevice();
                        const alt = altDev ? altDev.status : '';
                        if (alt === 'error' || alt === 'warning') {
                            this.cctToSiteStatus = 'degraded';
                        }
                        else {  // running or inactive
                            this.cctToSiteStatus = catastrophicSiteError ? 'degraded' : 'active';
                        }
                    }
                    else if (ops === 'warning') {
                        this.cctToSiteStatus = 'degraded';
                    }
                    else {  // ops inactive or error, both are considered an error state
                        this.cctToSiteStatus = 'error';
                    }
                    // show pulsing signal path unless cct-to-site is idle or error
                    this.signalFlowing = !(this.cctToSiteStatus === 'idle' || this.cctToSiteStatus === 'error');

                    // siteStatus
                    if (catastrophicSiteError) {
                        this.siteStatus = 'error'
                    }
                    else {
                        if (passiveXMTR) {
                            this.siteStatus = this.cctToSiteStatus === 'error' ? 'passive degraded' : 'passive';
                        }
                        else if (activeXMTR) {
                            this.siteStatus = this.cctToSiteStatus === 'error' ? 'active degraded' : 'active';
                        }
                        else if (!this.siteStatus.includes('degraded')) {
                            // We lost XMTR while STATUS not IDLE, not STALE; degrade last known XMTR
                            if (this.siteStatus.includes('active') || this.siteStatus.includes('passive')) {
                                this.siteStatus += ' degraded';
                            }
                        }
                        else {
                            //todo: are there any non idle states that need to be accounted for?
                            this.siteStatus = 'idle';
                        }
                    }
                }
            }

            this.socToCctStatus = this.socStatus; //The socToCctStatus is always the same state as the soc
        },
        updateDevices: function (obj) {
            const configModel = CCT.model.config.configProperties,
                statusModel = CCT.model.status.statusProperties,
                updateModel = CCT.model.updateMsg.updateMsgProperties,
                isIdle = CCT.model.isIdle(),
                now = Date.now();   // get the time once up front, use same for all timeout calculations

            // --- SOURCE device
            let deviceParams = {
                connectFlag: updateModel.cmd_src_status,
                failureFlag: undefined,
                opsType: configModel.ops_link,
                sent: isIdle ? undefined : statusModel.sv_cmds_rcvd,
                rcvd: undefined,
                timeNow: undefined
            };
            if (obj.isUpdate() || obj.isStatus()) {
                this.sourceDevice.update(deviceParams);
                // console.log(`*** SV SENT: ${this.sourceDevice.trafficSent.new} ... ${this.sourceDevice.trafficSent.base.value}`);
            }

            // --- PRIMARY & SECONDARY devices
            if (obj.isUpdate()) {
                deviceParams.connectFlag = updateModel.priconnect;
                deviceParams.failureFlag = updateModel.pri_connect_failure;
                // opsType doesn't change
                deviceParams.sent = isIdle ? undefined : updateModel.pri_adccp_msg_sent;
                deviceParams.rcvd = isIdle ? undefined : updateModel.pri_adccp_msg_rcvd;
                deviceParams.timeNow = isIdle ? undefined : now;
                this.primaryDevice.update(deviceParams);
                // console.log(`*** PRI SENT: ${this.primaryDevice.trafficSent.new} ... ${this.primaryDevice.trafficSent.base.value}`);
                // console.log(`*** PRI RCVD: ${this.primaryDevice.trafficRcvd.new} ... ${this.primaryDevice.trafficRcvd.base.value}`);

                deviceParams.connectFlag = updateModel.secconnect;
                deviceParams.failureFlag = updateModel.sec_connect_failure;
                deviceParams.sent = isIdle ? undefined : updateModel.sec_adccp_msg_sent;
                deviceParams.rcvd = isIdle ? undefined : updateModel.sec_adccp_msg_rcvd;
                this.secondaryDevice.update(deviceParams);
                // console.log(`*** SEC SENT: ${this.secondaryDevice.trafficSent.new} ... ${this.secondaryDevice.trafficSent.base.value}`);
                // console.log(`*** SEC RCVD: ${this.secondaryDevice.trafficRcvd.new} ... ${this.secondaryDevice.trafficRcvd.base.value}`);
            }
        },
        clearDevices: function () {
            this.sourceDevice.clear();
            this.primaryDevice.clear();
            this.secondaryDevice.clear();
            return this;
        },
    }
})();


// --- INI file model module ---
CCT.model.iniFile = (function () {
    return {
        contentString: undefined,
        clear: function () {
            this.contentString = undefined;
            return this;    // allows chaining
        },
        update: function (str) {
            // str must be a string or an object (non-primitive) that converts to a string
            if (typeof str === 'object' && str !== null) {
                str = str.toString();
            }

            if (typeof str === 'string') {
                this.contentString = str;
                return true;    // it was our type of object
            }
            else {
                this.contentString = undefined;
                return false;    // NOT our type of object
            }
        },
    }
})();


// --- Updating the model ---
// obj is a JSON-decoded object of state properties
// DON'T pass log/ini updates to this function. Call model.log.update() or model.iniFile.update().

CCT.model.update = function (obj) {
    // install some accessors to make life easier
    obj.isConfig = function () {
        return this.hasOwnProperty('SITE') || this.response === 'Empty Config'
    };
    obj.isUpdate = function () {
        return this.hasOwnProperty('SYSTIME')
    };
    obj.isStatus = function () {
        return this.hasOwnProperty('TIME2')
    };
    obj.isLog = function () {
        return this.hasOwnProperty('lastIndex')
    };

    let wasIdle = this.isIdle();    // gonna detect whether IDLE state changes during updates below
    if (obj.isConfig()) {
        // Empty config is good here, should cause config to be cleared
        this.config.update(obj);
    }
    // NO ELSES, allows test-mode hybrid objects to drop through
    if (obj.isUpdate()) {
        this.updateMsg.update(obj);
        this.networkGraph.update(obj);
    }
    if (obj.isStatus() && !this.isIdle()) { // ignore non-IDLE status arriving late after an IDLE transition
        this.status.update(obj);
        this.antennaGraph.update(obj);
    }
    if (obj.isLog()) { // ignore non-IDLE status arriving late after an IDLE transition
        this.log.update(obj);
    }
    if (obj.isStatus() || obj.isUpdate()) {
        // in case of hybrid object (update/status), only update the clock once
        this.clock.update(obj);
    }
    if (this.isIdle() && !wasIdle) {
        // we just WENT IDLE: time to clear all the in-session stuff
        this.config.clear();
        this.status.clear();    // some display visible during IDLE is tied to status (*cough*, gauges)
        this.antennaGraph.clear();
        this.networkGraph.clear();
        this.network.clearDevices();
    }
    if (!this.isIdle() && wasIdle) {
        CCT.model.log.restart();
    }
    // always need to do these, all obj types, even when stale
    this.network.update(obj);
};

CCT.model.graphDataSizeMagnitude = 0; //set to zero for prod

// --- Network Graph module ---
CCT.model.networkGraph = (function () {
    let cctErrors = CCT.model.updateMsg.cctError;
    const MAX_PUSHES = 150 + CCT.model.graphDataSizeMagnitude;
    const nullArray = () => CCT.tools.preloadedArray(MAX_PUSHES, null);
    let prevNetIn = -1;
    let prevNetOut = -1;
    let prevNetIn2 = -1;
    let prevNetOut2 = -1;
    let splitSecondaries = false;
    return {
        input: nullArray(),
        output: nullArray(),
        input2: nullArray(),
        output2: nullArray(),
        clear: function () {
            this.input = nullArray();
            this.output = nullArray();
            this.input2 = nullArray();
            this.output2 = nullArray();
            return this;
        },
        restart: function () {
            return this.clear();
        },
        update: function (obj) {
            const catastrophicCCTError = cctErrors.catastrophic();
            const sessionIdle = CCT.model.isIdle();

            if (obj && !catastrophicCCTError && !sessionIdle) {

                let secondaryRecievedMessagesExist = obj.hasOwnProperty('SEC_ADCCP_MSG_RCVD');
                let primaryRecievedMessagesExist = obj.hasOwnProperty('PRI_ADCCP_MSG_RCVD');
                let secondarySentMessagesExist = obj.hasOwnProperty('SEC_ADCCP_MSG_SENT');
                let primarySentMessagesExist = obj.hasOwnProperty('PRI_ADCCP_MSG_SENT');

                let secondaryMessagesReceived = obj.SEC_ADCCP_MSG_RCVD;
                let secondaryMessagesSent = obj.SEC_ADCCP_MSG_SENT;
                let primaryMessagesSent = obj.PRI_ADCCP_MSG_SENT;
                let primaryMessagesRecieved = obj.PRI_ADCCP_MSG_RCVD;

                if (secondaryRecievedMessagesExist && prevNetIn2 === -1) {
                    prevNetIn2 = secondaryMessagesReceived;
                }
                if (secondarySentMessagesExist && prevNetOut2 === -1) {
                    prevNetOut2 = secondaryMessagesSent;
                }

                if (primarySentMessagesExist) {
                    if (prevNetOut === -1) {
                        prevNetOut = primaryMessagesSent;
                    }
                    this.output.push(
                        splitSecondaries || !secondarySentMessagesExist
                            ?
                            (+primaryMessagesSent - prevNetOut)
                            :
                            (+secondaryMessagesSent - prevNetOut2 + +primaryMessagesSent - prevNetOut)
                    );

                    let outputLength = this.output.length;
                    if (outputLength > MAX_PUSHES) {
                        let amountToSliceOffFront = outputLength - MAX_PUSHES < 0 ? 0 : outputLength - MAX_PUSHES;
                        this.output = this.output.slice(amountToSliceOffFront);
                    }
                    prevNetOut = primaryMessagesSent;
                    if (secondarySentMessagesExist) {
                        if (splitSecondaries) {
                            let output2Length = this.output2.length;
                            if (output2Length > MAX_PUSHES) {
                                let amountToSliceOffFront = output2Length - MAX_PUSHES < 0 ? 0 : output2Length - MAX_PUSHES;
                                this.output2 = this.output2.slice(amountToSliceOffFront);
                            }
                        }
                        prevNetOut2 = secondaryMessagesSent;
                    }
                }

                if (primaryRecievedMessagesExist) {
                    if (prevNetIn === -1) {
                        prevNetIn = primaryMessagesRecieved;
                    }
                    this.input.push(
                        splitSecondaries || !secondaryRecievedMessagesExist
                            ?
                            (+primaryMessagesRecieved - prevNetIn)
                            :
                            (+secondaryMessagesReceived - prevNetIn2 + +primaryMessagesRecieved - prevNetIn )
                    );
                    let inputLength = this.input.length;
                    if (inputLength > MAX_PUSHES) {
                        let amountToSliceOffFront = inputLength - MAX_PUSHES < 0 ? 0 : inputLength - MAX_PUSHES;
                        this.input = this.input.slice(amountToSliceOffFront);
                    }
                    prevNetIn = primaryMessagesRecieved;
                    if (secondaryRecievedMessagesExist) {
                        if (splitSecondaries) {
                            let input2Length = this.input2.length;
                            if (input2Length > MAX_PUSHES) {
                                let amountToSliceOffFront = input2Length - MAX_PUSHES < 0 ? 0 : input2Length - MAX_PUSHES;
                                this.input2 = this.input2.slice(amountToSliceOffFront);
                            }
                        }
                        prevNetIn2 = secondaryMessagesReceived;
                    }
                }

                if (splitSecondaries) {
                    if (secondaryRecievedMessagesExist) {
                        this.input2.push(+secondaryMessagesReceived - prevNetIn2);
                        prevNetIn2 = secondaryMessagesReceived;
                    }
                    if (secondarySentMessagesExist) {
                        this.output2.push(+secondaryMessagesSent - prevNetOut2);
                        prevNetOut2 = secondaryMessagesSent;
                    }
                }
            }
        },
        getMaxLength: function () {
            return MAX_PUSHES;
        }
    }
})();

CCT.model.antennaGraph = (function () {
    const cctErrors = CCT.model.updateMsg.cctError;
    const siteErrors = CCT.model.status.siteError;

    const MAX_PUSHES = 1500 + CCT.model.graphDataSizeMagnitude;
    const nullArray = () => CCT.tools.preloadedArray(MAX_PUSHES, null);
    return {
        azimuth: nullArray(),
        azimuthDelta: nullArray(),
        elevation: nullArray(),
        elevationDelta: nullArray(),
        gain: nullArray(),
        clear: function () {
            this.azimuth = nullArray();
            this.azimuthDelta = nullArray();
            this.elevation = nullArray();
            this.elevationDelta = nullArray();
            this.gain = nullArray();
            return this;
        },
        restart: function () {
            return this.clear();
        },
        update: function (obj) {
            const sessionIdle = CCT.model.isIdle();
            const catastrophicCCTError = cctErrors.catastrophic();
            const catastrophicSiteError = siteErrors.catastrophic();
            if (!catastrophicCCTError && !catastrophicSiteError && !sessionIdle) {

                if (obj.hasOwnProperty('AZ')) {
                    this.azimuth.push(+obj.AZ);
                    let azimuthLength = this.azimuth.length;
                    if (azimuthLength > MAX_PUSHES) {
                        let amountToSliceOffFront = azimuthLength - MAX_PUSHES < 0 ? 0 : azimuthLength - MAX_PUSHES;
                        this.azimuth = this.azimuth.slice(amountToSliceOffFront);
                    }
                    if (obj.hasOwnProperty('AZ_DELTA')) {
                        this.azimuthDelta.push(+obj.AZ - +obj.AZ_DELTA);
                        let azimuthDeltaLength = this.azimuthDelta.length;
                        if (azimuthDeltaLength > MAX_PUSHES) {
                            let amountToSliceOffFront = azimuthDeltaLength - MAX_PUSHES < 0 ? 0 : azimuthDeltaLength - MAX_PUSHES;
                            this.azimuthDelta = this.azimuthDelta.slice(amountToSliceOffFront);
                        }
                    }
                }

                if (obj.hasOwnProperty('EL')) {
                    this.elevation.push(+obj.EL);
                    let elevationLength = this.elevation.length;
                    if (elevationLength > MAX_PUSHES) {
                        let amountToSliceOffFront = elevationLength - MAX_PUSHES < 0 ? 0 : elevationLength - MAX_PUSHES;
                        this.elevation = this.elevation.slice(amountToSliceOffFront);
                    }
                    if (obj.hasOwnProperty('EL_DELTA')) {
                        this.elevationDelta.push(+obj.EL - +obj.EL_DELTA);
                        let elevationDeltalength = this.elevationDelta.length;
                        if (elevationDeltalength > MAX_PUSHES) {
                            let amountToSliceOffFront = elevationDeltalength - MAX_PUSHES < 0 ? 0 : elevationDeltalength - MAX_PUSHES;
                            this.elevationDelta = this.elevationDelta.slice(amountToSliceOffFront);
                        }
                    }
                }

                if (obj.hasOwnProperty('AGC_VALUE')) {
                    this.gain.push(+obj.AGC_VALUE);
                    let gainLength = this.gain.length;
                    if (gainLength > MAX_PUSHES) {
                        let amountToSliceOffFront = gainLength - MAX_PUSHES < 0 ? 0 : gainLength - MAX_PUSHES;
                        this.gain = this.gain.slice(amountToSliceOffFront);
                    }
                }
                //add a hundred and sixty because the gain control can be at most -160.
            }
        },
        getMaxLength: function () {
            return MAX_PUSHES;
        }
    }
})();

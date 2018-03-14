/* tools.js -- general-purpose tools for CCT app, not fitting into any topical module, or used across modules
 *   e.g., console loggers, string manipulation helpers, general math helpers
 * Also functions as entry point to build our global namespace object.
 */

// --- One global object to rule them all, i.e. to act as our namespace ---
self.CCT = {};  // same as "var CCT = {}" but also works in Node/Worker contexts

// -- Global object "CCT" will hold various modules: tools, model, display...

// Set up just the "tools" module here, and give it alias "t" for convenience at the console
CCT.t = CCT.tools = (function () {
    // list of functions to call from very last HTML page elt -- when whole DOM exists but page has not yet loaded
    var finalPageEltCallbacks = [];

    // "exported", will be module's return value
    var exportObj = {


        removeAllWhiteSpace: function (msg) {
            return msg.replace(/\s/g, '');
        },
        consoleError: function (err, funcName) {
            console.error(`*** ${err.name} in ${funcName}: ${err.message}`);  // ES6 back-tick template literals, woo-hoo!
        },

        consoleWarn: function (err, funcName) {
            console.warn(`!!! ${err.name} in ${funcName}: ${err.message}`);
        },

        consoleInfo: function (msg, funcName) {
            console.info(`${funcName}: ${msg}`);
        },

        consoleLog: function (msg, funcName) {
            console.log(`${funcName}: ${msg}`);
        },

        capFirstLetter: function (str) {
            return str && str[0].toUpperCase() + str.slice(1);
        },

        zeroPadNumString: function (number, nDigits) {
            // pad number to nDigits by inserting leading zeroes if/as necessary, suppress comma
            return (+number).toLocaleString(undefined, {minimumIntegerDigits: nDigits, useGrouping: false});
        },

        truncateNumString: function (number, nDigits) {
            // truncate number to at most nDigits fractional digits
            return (+number).toLocaleString(undefined, {maximumFractionDigits: nDigits});
        },

        latText: x => `${Math.abs(x)} ${x < 0 ? 'S' : 'N'}`,
        longText: x => `${Math.abs(x)} ${x < 0 ? 'W' : 'E'}`,
        latLongText: function (lat, long, fmt = 'L,L') {
            var latStr = this.latText(lat),
                longStr = this.longText(long),
                userLong = -long,   // CCT & user like (+) for W, (-) for E
                fmts = {
                    'L,L': () => `LAT ${latStr}, LONG ${longStr}`,
                    'L\nL': () => `LAT ${latStr}\nLONG ${longStr}`,
                    ',': () => `${latStr}, ${longStr}`,
                    '\n': () => `${latStr}\n${longStr}`,
                    '+-L,L': () => `LAT ${lat}, LONG ${userLong}`,
                    '+-L\nL': () => `LAT ${lat}\nLONG ${userLong}`,
                    '+-,': () => `${lat}, ${userLong}`,
                    '+-\n': () => `${lat}\n${userLong}`,
                };
            return fmts[fmt]();
        },

        // register functions to be called (FIFO) as the last DOM elt is loading,
        // like lastElt.addEventListener(), but we can actually call it before creation of that last DOM elt
        callFromFinalPageElt: function (f) {
            if (typeof f === "function") finalPageEltCallbacks.push(f);
        },

        // call all the finalPageElt functions -- needs to be called from a <script> tag at the very end of the HTML file
        finalPageEltCalling: function () {
            // FIFO order, empties the list
            while (finalPageEltCallbacks.length) (finalPageEltCallbacks.shift())();
        },

        // Promise-based version of setTimeout
        //   e.g., wait(100).then(myFunc).catch(handler(err))
        //     wait(0) or wait() will run its .then() as soon as the current JS stack exits
        //     Promise.resolve().then() does almost the same, but slightly earlier: its .then() is slipped into the end of the current JS event loop.
        wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

        // Your basic random int between min & max, inclusive; even accepts args in wrong order
        //   e.g., randInt(9) gives you 0 to 9; randInt(12,5) or randInt(5,12) gives you 5 to 12; randInt() gives you 0 to 99
        randInt: (max = 99, min = 0) => (max < min ? max : min) + Math.floor((max < min ? 1 + min - max : 1 + max - min) * Math.random()),

        // Random weighted coin flip giving you on the *average* N falses in a row (but you can get runs of any length)
        randFalseRun: (N) => Math.random() < 1 / (N + 1),
        probFalseRun: (N) => 1 / (N + 1), // in case you want to use this probability for something else

        // Pick a random element from an array
        randElt: (arr) => arr[Math.floor(arr.length * Math.random())],

        // Limit to a min/max range
        minMax: (x, min, max) => x < min ? min : x > max ? max : x,

        // Log output to a text elt, intended for debug/testing
        logElt: (txt, eltId, term = '<br />') => document.getElementById(eltId).innerHTML += `${txt}${term}`,
        logDev: (txt, term = '<br />') => document.getElementById('dev-output').innerHTML += `${txt}${term}`,

        // Create a pre-loaded array using this ONE WEIRD TRICK!!!!
        preloadedArray: (length, value) => Array.apply(null, Array(length)).map(() => value),

        // Hold a timestamped value
        valueTimestamped: function (label) { // label is for logging/printing
            return {
                value: undefined,
                timestamp: undefined,
                label: label,
                save: saveValue,    // save a new value timestamped to now -- chainable
                clear: clearValue,  // clear value and timestamp -- chainable
                log: logValue,      // console.log as a string -- chainable
                toString: valueToString,
            }
        },

        // Counter that measures the current streak
        streakCounter: function (label) { // label is for logging/printing, use plural
            return {
                count: 0,   // total count, can only go up
                streak: 0,  // current streak, of total count
                label: label,
                inc: incStreakCtr,      // count++, streak++ -- chainable
                endStreak: endStreak,   // streak=0, count unchanged -- chainable
                clear: clearStreakCtr,  // count=0, streak=0 -- chainable
                log: logThis,      // console.log as a string -- chainable
                toString: streakCtrToString
            }
        },

        // convert ms to hr/min/sec string, e.g. 3h44m17s
        msToStringHMS: ms => {
            var s = Math.floor(ms / 1000);
            var m = Math.floor(s / 60);
            var h = Math.floor(m / 60);
            s = s % 60;
            m = m % 60;
            var zp = CCT.tools.zeroPadNumString;
            return h ? `${h}h${zp(m, 2)}m${zp(s, 2)}s`
                : m ? `${m}m${zp(s, 2)}s`
                    : `${s}s`;
        },

        // convert a date to a day-of-year serial # (0=Jan 1, 364=Dec 31)
        dayOfYear: (monthOrDate, day, year) => {
            // # days the year has before each month (Jan=0, Feb=31, Mar=31+28...)
            const daysBeforeMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
            // on leap years, all values after Feb increase by one
            const isLeapYear = yyyy => yyyy % 4 ? false
                : yyyy % 100 ? true   // century years are not leap years
                    : !(yyyy % 400);  // BUT every 4th century is a leap year, e.g. yr 2000
            var month;

            // accept a Date() object if they pass only 1 arg
            if (day === undefined) {
                month = monthOrDate.getMonth(); // zero-based, 0=Jan...11=Dec
                day = monthOrDate.getDate();
                year = monthOrDate.getFullYear();
            }
            else {
                month = +monthOrDate - 1;    // convert to zero-based, assuming caller passes 1=Jan like normal people
                day = +day;
                year = +year;
            }

            var dayNum = daysBeforeMonth[month] + day - 1;    // # full days passed YTD; beginning instant of Jan 1 is 0:0:0:0
            dayNum += (isLeapYear(year) && month > 1 ? 1 : 0);    // correct for leap year, NB: month 1 is FEB
            return dayNum;
        },

        selectStackable,

        stackableInit: function () {
             d3.selectAll(".stackable").on("mousedown", function () {
                 selectStackable(this);
           });
        },
    };

    //must be listed outside of export statement so that stackableInit can use it
    function selectStackable(el) {
        d3.selectAll(".stackable").style("z-index", 1);
        d3.select(el).style("z-index", 2);
    }

    // --- valueTimestamped helpers ---

    function saveValue(v) {
        this.timestamp = Date.now();
        this.value = v;
        return this;
    }

    function clearValue() {
        this.value = undefined;
        this.timestamp = undefined;
        return this;
    }

    // helper for the helper: return really compact string of time followed by date
    function compactTimeDate(ts) {
        var zp = CCT.tools.zeroPadNumString,
            dt = new Date(ts),
            h = zp(dt.getHours(), 2),
            m = zp(dt.getMinutes(), 2),
            s = zp(dt.getSeconds(), 2),
            wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()],
            mo = zp(dt.getMonth() + 1, 2),   // getMonth() is zero-based
            d = zp(dt.getDate(), 2),
            y = dt.getFullYear();
        return `${h}:${m}:${s} ${wd} ${mo}/${d}/${y}`;
    }

    function valueToString() {
        return `${this.label}: ${this.value} recvd ${compactTimeDate(this.timestamp)}`;
    }

    function logValue() {
        // console.log(this.label + ':', this.value, 'recvd', compactTimeDate(this.timestamp));
        return this;
    }


    // --- streakCounter helpers ---

    function incStreakCtr() {
        this.count++;
        this.streak++;
        return this;
    }

    function endStreak() {
        this.streak = 0;
        return this;
    }

    function clearStreakCtr() {
        this.count = 0;
        this.streak = 0;
        return this;
    }

    function streakCtrToString() {
        return `${this.label} ${this.count} / streak ${this.streak}`
    }

    // works on anything with a "deep" toString(), not just streakCounter
    function logThis() {
        // console.log(this.toString());
        return this;
    }


    return exportObj;
})();

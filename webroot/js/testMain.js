/* httpClient.js -- communicate with an HTTP server
 */

// REQUIRES: tools.js, for global namespace object "CCT"


// TODO: convert Promise-based fetch API as used in EUX-GPT project
// TODO: settle the boundary between low-level HTTP messaging and app-level get/set of params
// TODO: main loop and this loop should both compensate for when the server goes down and doesnt respond to their request.
//   May result in another module redisClient.js specializing in "redis over HTTP" -- if there is enough to justify separate module


// Create httpClient module with alias "h" for console convenience
CCT.mn = CCT.main = (function () {
    var runLoop = true; //true;
    var exportObj = {};
    exportObj.consoleLogIndex = 0;
    /////////////////////////
    //CONSTANT GET REQUESTS
    /////////////////////////


    //console.log("GETTING BEGINS");

    //////////////////////////////////
    //SINGLE GETS ON CONNECT GO HERE
    //////////////////////////////////


    let logPending = false;


////////////
//GETLOOP
////////////
    function getLoop() {

        if (CCT.model.missingConfig()) {
            var configure = new XMLHttpRequest();
            configure.onreadystatechange = function () {
                if (configure.readyState === 4 && configure.status === 200) {
                    //console.log(JSON.parse(configure.response.toString()));
                    // console.log(configure.response.toString());
                    if (configure.response.toString() !== '')
                        try {
                            var config = JSON.parse(configure.response.toString());
                        }
                        catch (err) {
                            console.log(err, configure.response.toString());

                        }
                    CCT.model.update(config);
                    console.log(config);
                }
                else {
                    //console.log("LOG: " + update.status);
                }
            };
            configure.open("GET", "api/configuration/", true);
            configure.send();
        }

        // // //////////////////////
        // // //POST Create Key4
        // // //////////////////////
        // var http1 = new XMLHttpRequest();
        // http1.onreadystatechange = function () {
        //     if (http1.readyState === 4 && http1.status === 200) {
        //         //console.log(http1.responseText.toString());
        //         if (http1.responseText.toString() === "0") {
        //             //console.log("One or more of those keys were already set");
        //         }
        //     }
        //     else {
        //         //console.log("POST Create Key4: " + http1.status);
        //     }
        // };
        // http1.open("POST", "api/keys/key4", true);
        // http1.send("thisiskey4");
        // //
        // // ///////////////////////////////
        // // //POST Create Multiple Key
        // // //////////////////////////////
        // var http2 = new XMLHttpRequest();
        // http2.onreadystatechange = function () {
        //     if (http2.readyState === 4 && http2.status === 200) {
        //         // console.log(http2.responseText.toString());
        //         if (http2.responseText.toString() === "0") {
        //             //console.log("One or more of those keys were already set");
        //         }
        //     }
        //     else {
        //         //console.log("POST Create Multiple Keys: " + http2.status);
        //     }
        // };
        // http2.open("POST", "api/keys/key5,key6,key7,key8", true);
        // http2.send("thisiskey5,thisiskey6,thisiskey7,thisiskey8");
        // //
        // // //////////////////////
        // // //GET Multiple Keys
        // // //////////////////////
        // var http3 = new XMLHttpRequest();
        // http3.onreadystatechange = function () {
        //     if (http3.readyState === 4 && http3.status === 200) {
        //         // console.log(http3.responseText.toString());
        //     }
        //     else {
        //         //console.log("GET Multiple Keys: " + http3.status);
        //     }
        // };
        // http3.open("GET", "api/keys/key1,key2,key3,key4", true);
        // http3.send();
        //
        // //////////////////////
        // //GET status
        // //////////////////////

        // //
        // // //////////////////////
        // // //PUT multiple key values
        // // //////////////////////
        // var http6 = new XMLHttpRequest();
        // http6.onreadystatechange = function () {
        //     if (http6.readyState === 4 && http6.status === 200) {
        //         //console.log(http6.responseText.toString());
        //     }
        //     else {
        //         //console.log("PUT multiple key values: " + http6.status);
        //     }
        // };
        // http6.open("PUT", "api/keys/key1,key2,key3,key4", true);
        // http6.send("eye,of,the,tiger");
        //


        // //////////////////////
        // //LOG
        // //////////////////////
        if (CCT.display.log.vm && CCT.display.log.logVisible()) {
            var log = new XMLHttpRequest();
            log.onreadystatechange = function () {
                if (log.readyState === 4 && log.status === 200) {
                    // console.log(log.response);
                    let response = JSON.parse(log.response);
                    if (response.entries.length > 0 && response.entries[0] === null) {
                        console.log('logpullfailure');

                        if (CCT.display.log.logVisible()) {
                            CCT.model.log.update(response);
                        }
                    }
                    else {
                        if (CCT.display.log.logVisible()) {
                            CCT.model.log.update(response);
                        }
                    }
                    logPending = false;
                }
                else {
                    logPending = false;
                }
            };

            log.open("GET", "api/log/" + CCT.model.log.getNextLineNum(), true);
            try {
                log.send();
            } catch (e) {
                console.log(e);
                logPending = false;
            }
            logPending = true;
        }
        //
        //
        //
        //
        //
        // //
        var update = new XMLHttpRequest();
        update.onreadystatechange = function () {
            if (update.readyState === 4 && update.status === 200) {
                // console.log(update.responseText.toString());
                var jsonObj = JSON.parse(update.responseText.toString());
                if (jsonObj) {
                    CCT.model.update(jsonObj);
                }
            }
            else {
            }
        };
        update.open("GET", "api/update", true);
        update.send();
        // //
        // //
        // //
        // //
        // //
        // //
        // //
        // //
        var status = new XMLHttpRequest();
        status.onreadystatechange = function () {
            if (status.readyState === 4 && status.status === 200) {
                var jsonStatus = JSON.parse(status.responseText.toString());
                if (jsonStatus) {
                    CCT.model.update(jsonStatus);
                }
            }
            else {
            }
        };
        status.open("GET", "api/status", true);
        status.send();
        //
        //

        //
        //
        //
        //
        //
        //
        //
        // //////////////////////
        // //GET INI
        // //////////////////////
        // var iniFileGet = new XMLHttpRequest();
        // iniFileGet.onreadystatechange = function () {
        //     if (iniFileGet.readyState === 4 && iniFileGet.status === 200) {
        //         if (iniFileGet.response.toString() !== '') {
        //             // console.log(iniFileGet.response.toString());
        //         }
        //         else {
        //         }
        //     }
        // };
        // iniFileGet.open("GET", "api/iniFile/", true);
        // iniFileGet.send();
        // //
        // //
        // //
        // //
        // //
        // //
        // // //// This should only be called on demand when the user is an admin who needs to see all of the detailed error states.
        // var error = new XMLHttpRequest();
        // error.onreadystatechange = function () {
        //     if (error.readyState === 4 && error.status === 200) {
        //         var jsonStatus = JSON.parse(error.responseText.toString());
        //         if (jsonStatus) {
        //             CCT.model.update(jsonStatus);
        //         }
        //     }
        //     else {
        //     }
        // };
        // error.open("GET", "api/error", true);
        // error.send();
        // // //
        // // //
        // // //
        // // //
        // // //
        // // //
        // // // // //////////////////////
        // // // // //PUT INI
        // // // // //////////////////////
        // var putIni = new XMLHttpRequest();
        // putIni.onreadystatechange = function () {
        //     if (putIni.readyState === 4 && putIni.status === 200) {
        //         // console.log(putIni.responseText.toString());
        //     }
        //     else {
        //         //console.log("PUT multiple key values: " + putIni.status);
        //     }
        // };
        // putIni.open("PUT", "api/iniFile/", true);
        // putIni.send(`{"INIFILE":"INI SENTTTTT"}`);
        // // //
        // // //
        // // //
        // // //
        // // //
        // // //
        // // //
        // // // // // //////////////////////
        // // // // // //PUT CONFIG
        // // // // // //////////////////////
        // var config = new XMLHttpRequest();
        // config.onreadystatechange = function () {
        //     if (config.readyState === 4 && config.status === 200) {
        //         // console.log(http12.responseText.toString());
        //     }
        //     else {
        //         //console.log("PUT multiple key values: " + http6.status);
        //     }
        // };
        // config.open("PUT", "api/configuration/", true);
        // config.send("CONFIGURED CCT");

        if (runLoop) setTimeout(getLoop, 1000); //should be 1000
    }


// Start/stop the loop from console with "CCT.h.stop()" or .start()
    exportObj.stop = function () {
        runLoop = false;
    };

    exportObj.start = function () {
        if (!runLoop) {
            runLoop = true;
            getLoop();
        }
    };

    if (runLoop) getLoop();

    return exportObj;
})
();

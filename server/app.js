(function () {
    ////////////////////////////////////////////////////
    //Serverside Global Constants State
    ////////////////////////////////////////////////////

    const ERRORMESSAGEPREFIX = "Error: ";        //If edits are made to this the edits need to be made to the model as well
    //todo:group alike constants together under a constant object so as to further modularization
    const CATASTROPHICCHECKDELAY = 2000; //This is used to allow the server to detect error states within itself
    const NODEJSLISTENPORT = 3000;
    const NODEJSHOSTLISTEN = 'localhost';

    //IMPORTANT NOT TO REMOVE OR MODIFY
    const SERVERLOGDIR = './log';
    const SERVERLOGLOCATION = SERVERLOGDIR + '/serverlog.txt';

    const INTERMITTENTSTALENESSRESETFREQUENCY = 86400000; //24 hours //its VERY IMPORTANT that this number not be less than 3600000
    const INTERMITTENTSTALENESSCHECKFREQUENCY = 10000; //10 seconds
    const REDISPULLUPDATEFREQUENCY = 1000; //1 times a second in prod
    const REDISPULLSTATUSFREQUENCY = 1000; //1 times a second in prod

    const RETRYREDISCONNECTIONFREQUENCY = 5000;

    const UPDATEMESSAGEERRRESETDELAY = 1500;
    const STATUSMESSAGEERRRESETDELAY = 1500;

    const TIMETOWAITTOPUBLISHFORCONFIG = 1000;

    const UPDATEBIGFACTORSTALENESS = 10; //should be at most and at least one digit higher than small factor staleness
    const STATUSBIGFACTORSTALENESS = 10; //should be at most and at least one digit higher than small factor staleness
    const STALENESSLEANIENCY = {
        STATUSSTALENESSLENIENCY: -1, //-3 The more negative the more leniency where 0 is the least lenient and positive numbers make no sense
        UPDATESTALENESSLENIENCY: -1, //-3 The more negative the more leniency where 0 is the least lenient and positive numbers make no sense
        STATUSNUMBEROFTIMESREALLYSTALELENIENCY: 0, //The more negative the more leniency where 0 is the least lenient and positive numbers make no sense
        UPDATENUMBEROFTIMESREALLYSTALELENIENCY: 0,
    };

    const SMALLFACTORSTALENESS = {
        UPDATESMALLFACTORSTALENESS: 1, //5 Used to count staleness, should be between 1 and 9 where 1 is most likely to occur and 9 is least
        STATUSSMALLFACTORSTALENESS: 1 //Used to count staleness, should be between 1 and 9 where 1 is most likely to occur and 9 is least
    };

    const NOTIFICATIONDURATIONOFLOGRESET = 1001;//the timeout should be twice the number of milliseconds between client requests plus 1

    const REDISPORT = '6379';
    const REDISIP = '127.0.0.1';
    // const REDISIP = 'BT1220-LT';  // Judea's machine
    // const REDISIP = 'BT1217-LT';  // Bernie's machine

    // const BUFFERNAMESPREFIX = 'CCT.';    // see DATASOURCE's keys
    const BUFFERNAMESPREFIX = 'REDISFLOOD.';           // separate keys not used by DATASOURCE // Do not remove, this signifies the flexibility of retrieving values for different configurations and possibly from different app contexts.

    const SOURCENAME = BUFFERNAMESPREFIX.replace(/\./g, '');

    const REDISUPDATEKEYBUFFERNAME = BUFFERNAMESPREFIX + 'update';
    const REDISSTATUSKEYBUFFERNAME = BUFFERNAMESPREFIX + 'status';

    const SUBSCRIBE_FROM_DATASOURCE_CHANNEL = BUFFERNAMESPREFIX + 'outChannel';    // DATASOURCE.out... means out from DATASOURCE's perspective
    const SUBSCRIBE_FROM_DATASOURCE_CHANNEL_CONFIG = BUFFERNAMESPREFIX + 'outChannel.config';
    const SUBSCRIBE_FROM_DATASOURCE_CHANNEL_INI = BUFFERNAMESPREFIX + 'outChannel.ini';
    const PUBLISH_TO_DATASOURCE_CHANNEL = BUFFERNAMESPREFIX + 'inChannel';  // DATASOURCE.in ... means in from DATASOURCE's perspective
    const PUBLISH_TO_DATASOURCE_CHANNEL_PUT_INI = BUFFERNAMESPREFIX + 'inChannel.put.ini';
    const PUBLISH_TO_DATASOURCE_CHANNEL_PUT_CONFIG = BUFFERNAMESPREFIX + 'inChannel.put.config';
    const REQ_CONFIG_MSG = 'requestSessionConfig';
    const REQ_INI_MSG = 'requestINIConfig';

    const REDISSTATUSPULLERRORMESSAGE = 'REDIS ERROR ON PULLING STATUS:';
    const REDISUPDATEPULLERRORMESSAGE = 'REDIS ERROR ON PULLING UPDATE:';

    const REPEATEDSTALENESSMESSAGE = 'Times Really Stale in Past Twenty Four Hours: ';

    const STALENESSSERVERERRORMESSAGE = {
        UPDATESTALENESSSERVERERRORMESSAGE: SOURCENAME + ' Failing to Give Update Messages',
        STATUSSTALENESSSERVERERRORMESSAGE: SOURCENAME + ' Failing to Give Status Messages'
    };


    const STATUSREPEATEDSTALENESSMESSAGE = 'Times Really Stale in Past Twenty Four Hours: ';
    const JSONPARSEERRORMESSAGEKEY = 'JSONPARSEERROR';


    // These will most likely change to stray away from what their name suggests to give more information to server admin.
    // see REDISUNKNOWNERRORMESSAGE
    const REDISCONNECTIONERRORMESSAGE = '!! Redis Error On Connect !! ';
    const REDISSUBSCRIBERCLIENTERRORMESSAGE = '!! REDIS SUBSCRIBER CLIENT THROWING ERRORS !!';
    const REDISABORTERRORMESSAGE = 'ABORT';
    const REDISAGGREGATEERRORMESSAGE = 'AGGREGATE';
    const REDISERRORMESSAGE = 'REDIS ERROR: Typically occurs as a result of an improperly formatted argument list';
    const REDISREPLYERRORMESSAGE = 'REPLY: Typically occurs as a result of an unknown type being passed to redis ("null" for instance)';
    const REDISPARSERERRORMESSAGE = 'PARSER';
    const REDISUNKNOWNERRORMESSAGE = 'CONNECTION ERROR';

    const STATUSRESPONSEKEY = '/status';
    const UPDATERESPONSEKEY = '/update';
    const ERRORRESPONSEKEY = '/error';
    const INIFILERESPONSEKEY = '/iniFile';
    const CONFIGURATIONRESPONSEKEY = '/configuration';
    const LOGDELTARESPONSEKEY = '/logDelta';
    const LOGRESPONSEKEY = '/log';
    const KEYSRESPONSEKEYS = '/keys';

    const EMPTYSTATUSRESPONSE = '{"response":"Empty Status"}';
    const EMPTYCONFIGJSONRESPONSE = '{"response":"Empty Config"}';
    const EMPTYINIJSONRESPONSE = 'EMPTY INI';

    const RESETLOGVALUE = 'log.reset';

    const INVALIDURLREQUESTIDENTIFIER = 'INVALIDURL';
    const INVALIDPARAMSREQUESTIDENTIFIER = 'NUMOFPARAMS';
    const INVALIDMETHODREQUESTIDENTIFIER = 'UNKNOWNMETHOD';
    const INVALIDPARAMETERSHTTPERRORMESSAGE = '400 NUMBER OF KEYS DO NOT MATCH NUMBER OF SETTING VALUES';
    const INVALIDURLHTTPERRORMESSAGE = '400 INVALID REQUEST URLS ';
    const INVALIDMETHODHTTPERROR = '405 The Server Received Your Request But the HTTP Method is not used by this server';

    const APPCOULDNOTSTARTMSG = 'App could not start, Check Server Log';
    const APPSTARTEDANDTHREWERRORS = 'App started but threw catastrophic errors, Check Server Log';

    var getResponseDictionary = {}; //Must be var so as to be exported
    var postResponseDictionary = {}; //Must be var so as to be exported
    var putResponseDictionary = {}; //Must be var so as to be exported


    //this list is used strictly to determine the hierarchy where generalized errors contain more detailed ones.
    //the list of inner detailed errors is abstracted out into the error messages
    //The whole point of this is so that developers can add new error states and change
    //The category of more detailed errors without making modifications to the rest of the error propagation mechanism.

    let errorHierarchy = {};

    const NODEERRORSKEY = 'nodeErrors';
    const DATASOURCEERRORSKEY = 'cctErrors'; //TODO: generify, such that cct is replaced with 'datasource'
    const SITEERRORSKEY = 'siteErrors';
    const REDISERRORSKEY = 'redisErrors';
    const MULTIMESSAGEKEY = 'multiMessage';
    const errorCategories = [NODEERRORSKEY, DATASOURCEERRORSKEY, SITEERRORSKEY, REDISERRORSKEY, MULTIMESSAGEKEY];

    for (let i = 0; i < errorCategories.length; i++) {
        errorHierarchy[errorCategories[i]] = {};
    }

    const APPCOULDNOTSTARTKEY = 'appCouldNotStart';
    const APPSTARTEDANDTHREWERRORSKEY = 'appStartedAndThrewErrors';
    const WRITETOLOGFAILUREKEY = 'writeToLogFailure';
    const BADRESPONSEKEY = 'badResponse';
    const JSONPARSEEXCEPTIONUPDATEERRKEY = 'jsonParseExceptionupdateErr';
    const JSONPARSEEXCEPTIONUPDATEKEY = 'jsonParseExceptionupdate';
    const JSONPARSEEXCEPTIONKEY = 'jsonParseException';
    const UPDATESTALENESSKEY = 'updateStaleness';
    const UPDATESTALEKEY = 'updateStale';
    const JSONPARSEEXCEPTIONCONFIGKEY = 'jsonParseExceptionconfig';
    const JSONPARSEEXCEPTIONINIKEY = 'jsonParseExceptionini';
    const JSONPARSEEXCEPTIONREDISSUBSCRIBERKEY = 'jsonParseExceptionredissubscriber';
    const JSONPARSEEXCEPTIONSTATUSERRKEY = 'jsonParseExceptionstatusErr';
    const JSONPARSEEXCEPTIONSTATUSKEY = 'jsonParseExceptionstatus';
    const STATUSSTALENESSKEY = 'statusStaleness';
    const STATUSSTALEKEY = 'statusStale';
    const REDISCLIENTERRORSKEY = 'redisClientErrors';
    const REDISSUBSCRIBERCLIENTERRORSABORTKEY = 'redisSubscriberClientErrorsAbort';
    const REDISSUBSCRIBERCLIENTERRORSAGGREGATEKEY = 'redisSubscriberClientErrorsAggregate';
    const REDISSUBSCRIBERCLIENTERRORSREDISKEY = 'redisSubscriberClientErrorsRedis';
    const REDISSUBSCRIBERCLIENTERRORSREPLYKEY = 'redisSubscriberClientErrorsReply';
    const REDISSUBSCRIBERCLIENTERRORSPARSERKEY = 'redisSubscriberClientErrorsParser';
    const REDISSUBSCRIBERCLIENTERRORSCONNECTIONKEY = 'redisSubscriberClientErrorsConnection';
    const REDISCLIENTERRORSABORTKEY = 'redisClientErrorsAbort';
    const REDISCLIENTERRORSAGGREGATEKEY = 'redisClientErrorsAggregate';
    const REDISCLIENTERRORSREDISKEY = 'redisClientErrorsRedis';
    const REDISCLIENTERRORSREPLYKEY = 'redisClientErrorsReply';
    const REDISCLIENTERRORSPARSERKEY = 'redisClientErrorsParser';
    const REDISCLIENTERRORSCONNECTIONKEY = 'redisClientErrorsConnection';
    const UPDATEPULLFAILUREKEY = 'updatePullFailure';
    const STATUSPULLFAILUREKEY = 'statusPullFailure';
    const INIPULLFAILUREKEY = 'iniPullFailure';
    const LOGPULLFAILUREKEY = 'logPullFailure';
    const REDISCONNECTERRORKEY = 'redisConnectError';
    const GETKEYSERRORKEY = 'getKeysError';
    const CREATEKEYSERRORKEY = 'createKeysError';
    const SETHASHMAPERRORKEY = 'setHashMapError';

    errorHierarchy[NODEERRORSKEY][APPCOULDNOTSTARTKEY] = null;
    errorHierarchy[NODEERRORSKEY][APPSTARTEDANDTHREWERRORSKEY] = null;
    errorHierarchy[NODEERRORSKEY][WRITETOLOGFAILUREKEY] = 'Nodejs Server Side Log Writing Errors';
    errorHierarchy[NODEERRORSKEY][BADRESPONSEKEY] = 'Nodejs Server Bad HTTP Response Errors';
    errorHierarchy[DATASOURCEERRORSKEY][JSONPARSEEXCEPTIONUPDATEERRKEY] = 'Bad ' + SOURCENAME + ' Update ERR Messaging';
    errorHierarchy[DATASOURCEERRORSKEY][JSONPARSEEXCEPTIONUPDATEKEY] = 'Bad ' + SOURCENAME + ' Update Messaging';
    errorHierarchy[DATASOURCEERRORSKEY][JSONPARSEEXCEPTIONKEY] = 'Json Parse Exceptions';
    errorHierarchy[DATASOURCEERRORSKEY][UPDATESTALENESSKEY] = 0;
    errorHierarchy[DATASOURCEERRORSKEY][UPDATESTALEKEY] = '' + SOURCENAME + ' Failing to Give Update Messages';
    errorHierarchy[DATASOURCEERRORSKEY][JSONPARSEEXCEPTIONCONFIGKEY] = 'Bad ' + SOURCENAME + ' Configuration Messaging';
    errorHierarchy[DATASOURCEERRORSKEY][JSONPARSEEXCEPTIONINIKEY] = 'Bad ' + SOURCENAME + ' ini Messaging';
    errorHierarchy[DATASOURCEERRORSKEY][JSONPARSEEXCEPTIONREDISSUBSCRIBERKEY] = 'Bad ' + SOURCENAME + ' Subscriber Messaging';

    errorHierarchy[SITEERRORSKEY][JSONPARSEEXCEPTIONSTATUSERRKEY] = 'Bad ' + SOURCENAME + ' Status ERR Messaging';
    errorHierarchy[SITEERRORSKEY][JSONPARSEEXCEPTIONSTATUSKEY] = 'Bad ' + SOURCENAME + ' Status Messaging';
    errorHierarchy[SITEERRORSKEY][STATUSSTALENESSKEY] = 0;
    errorHierarchy[SITEERRORSKEY][STATUSSTALEKEY] = '' + SOURCENAME + ' Failing to Give Status Messages';

    errorHierarchy[REDISERRORSKEY][REDISCLIENTERRORSKEY] = 'Redis Client Errors';
    errorHierarchy[REDISERRORSKEY][REDISSUBSCRIBERCLIENTERRORSABORTKEY] = 'Redis Subscriber Client Abort Errors';
    errorHierarchy[REDISERRORSKEY][REDISSUBSCRIBERCLIENTERRORSAGGREGATEKEY] = 'Redis Subscriber Client Aggregate Errors';
    errorHierarchy[REDISERRORSKEY][REDISSUBSCRIBERCLIENTERRORSREDISKEY] = 'Redis Subscriber Client "Redis" Errors';
    errorHierarchy[REDISERRORSKEY][REDISSUBSCRIBERCLIENTERRORSREPLYKEY] = 'Redis Subscriber Client Reply Errors';
    errorHierarchy[REDISERRORSKEY][REDISSUBSCRIBERCLIENTERRORSPARSERKEY] = 'Redis Subscriber Client Parser Errors';
    errorHierarchy[REDISERRORSKEY][REDISSUBSCRIBERCLIENTERRORSCONNECTIONKEY] = 'Redis Subscriber Client Connection Errors';
    errorHierarchy[REDISERRORSKEY][REDISCLIENTERRORSABORTKEY] = 'Redis Client Abort Errors';
    errorHierarchy[REDISERRORSKEY][REDISCLIENTERRORSAGGREGATEKEY] = 'Redis Client Aggregate Errors';
    errorHierarchy[REDISERRORSKEY][REDISCLIENTERRORSREDISKEY] = 'Redis Client "Redis" Errors';
    errorHierarchy[REDISERRORSKEY][REDISCLIENTERRORSREPLYKEY] = 'Redis Client Reply Errors';
    errorHierarchy[REDISERRORSKEY][REDISCLIENTERRORSPARSERKEY] = 'Redis Client Parser Errors';
    errorHierarchy[REDISERRORSKEY][REDISCLIENTERRORSCONNECTIONKEY] = 'Redis Client Connection Errors';
    errorHierarchy[REDISERRORSKEY][UPDATEPULLFAILUREKEY] = 'Redis Update Pull Errors';
    errorHierarchy[REDISERRORSKEY][STATUSPULLFAILUREKEY] = 'Redis Status Pull Errors';
    errorHierarchy[REDISERRORSKEY][INIPULLFAILUREKEY] = 'Redis Ini File Pull Errors';
    errorHierarchy[REDISERRORSKEY][LOGPULLFAILUREKEY] = 'Redis Log Pull Errors';
    errorHierarchy[REDISERRORSKEY][REDISCONNECTERRORKEY] = 'Redis Connection Errors';
    errorHierarchy[REDISERRORSKEY][GETKEYSERRORKEY] = 'Redis Key Getting Errors';
    errorHierarchy[REDISERRORSKEY][CREATEKEYSERRORKEY] = 'Redis Key Creating Errors';
    errorHierarchy[REDISERRORSKEY][SETHASHMAPERRORKEY] = 'Redis Hash Map Setting Errors';
    errorHierarchy[MULTIMESSAGEKEY][MULTIMESSAGEKEY] = 'Multiple errors contained in data';

    const JSONPARSEPULLTYPE = {
        JSONPARSETYPEUPDATE: 'update',
        JSONPARSETYPESTATUS: 'status'
    };

    const JSONPARSETYPEERR = {
        JSONPARSETYPESTATUSERR: 'statusErr',
        JSONPARSETYPEUPDATEERR: 'updateErr'
    };
    const JSONPARSETYPECONFIG = 'config';
    const JSONPARSETYPEINI = 'ini';
    const JSONPARSETYPEREDISSUBSCRIBER = 'redissubscriber';

    const BADJSONPARSELOGTEXT = 'BAD ' + SOURCENAME + ' ';
    const BADJSONPARSELOGTEXTDESCRIPTION = ' MESSAGING: ';

    //Error states uses this list to instantiate all of its states
    const errorMessages = {};

    //Flatten out hierarchy into error messages
    (function () {
        let errorCategoryKeys = Object.keys(errorHierarchy);
        for (let keyCategoryIndex in errorCategoryKeys) {
            let errorKeys = Object.keys(errorHierarchy[errorCategoryKeys[keyCategoryIndex]]);
            for (let keyIndex in errorKeys) {
                errorMessages[errorKeys[keyIndex]] =
                    errorHierarchy[errorCategoryKeys[keyCategoryIndex]][errorKeys[keyIndex]];
            }
        }
    })();

    let errorStates = {};
    //Set all the error states out of the flattened out error messages
    (function () {
        let errorCategoryKeys = Object.keys(errorMessages);
        for (let keyCategoryIndex in errorCategoryKeys) {
            errorStates[errorCategoryKeys[keyCategoryIndex]] = 0;
        }
    })();

    //its important is to wait until the absolute last minute to categorize the detailed errors before sending them off to the client
    let occurredErrorList = {};

    let app;
    try {
        app = require('http').createServer(function (request, response) {
            handleRequest(request, response);
        });
        app.listen(NODEJSLISTENPORT, NODEJSHOSTLISTEN);
        app.on('error', function (err) {
            handleError(APPSTARTEDANDTHREWERRORSKEY, err);
        });
    }
    catch (exception) {
        handleError(APPCOULDNOTSTARTKEY, exception);
    }

    function throwError(errorMessage) {
        throw new Error(errorMessage);
    }

    function catastrophicCheck() {
        if (errorStates.appCouldNotStart || errorStates.appStartedAndThrewErrors) {
            if (errorStates.appCouldNotStart) {
                throwError(APPCOULDNOTSTARTMSG);
            }
            if (errorStates.appStartedAndThrewErrors) {
                throwError(APPSTARTEDANDTHREWERRORS);
            }
        }
        return errorStates.appCouldNotStart || errorStates.appStartedAndThrewErrors;
    }

    function logRecovery(errorState) {
        console.log("Recovered From: " + errorMessages[errorState]);
        writeToServerLog("Recovered From: " + errorMessages[errorState]);
    }

    function clearErrorState(errorState) {
        if (errorStates[errorState] === true || errorStates[errorState] > 0) {
            logRecovery(errorState);
            errorStates[errorState] = false;
            if (occurredErrorList.hasOwnProperty(errorState)) {
                delete occurredErrorList[errorState];
            }
        }
    }

    function addErrorObject(jsonObj, type) {
        jsonObj.error = {
            'message': errorMessages[MULTIMESSAGEKEY],
            'code': 'multi',
            'data': processOccurredErrors([type === JSONPARSEPULLTYPE.JSONPARSETYPEUPDATE ? DATASOURCEERRORSKEY : SITEERRORSKEY, REDISERRORSKEY, NODEERRORSKEY])
        };
        if (!Object.keys(jsonObj.error.data).length) {
            delete jsonObj.error;
        }
        return jsonObj;
    }

    //////////////////////////////////////////////
    //BEGIN THE SERVER CODE
    //////////////////////////////////////////////
    if (!errorStates.appCouldNotStart && !errorStates.appStartedAndThrewErrors) {
        //include all global mutable values here
        let configMessage = '';
        let dataSourceLogPath = '';
        let redisPulledErrorMessage = {
            updateMessageERR: '',
            statusMessageERR: ''
        };

        let redisPulledMessages = {
            updateMessage: '',
            statusMessage: ''
        };

        let lastRedisPulledMessages = {
            lastStatusMessage: '',
            lastUpdateMessage: ''
        };

        errorMessages.updateStaleness = STALENESSLEANIENCY.UPDATESTALENESSLENIENCY;
        errorMessages.statusStaleness = STALENESSLEANIENCY.STATUSSTALENESSLENIENCY;
        let numberOfTimesUpdateWasStaleInPastTwentyFourHours = STALENESSLEANIENCY.UPDATENUMBEROFTIMESREALLYSTALELENIENCY;
        let numberOfTimesStatusWasStaleInPastTwentyFourHours = STALENESSLEANIENCY.STATUSNUMBEROFTIMESREALLYSTALELENIENCY;

        let logResetOcurred = false;

        setTimeout(function () {
            catastrophicCheck();
        }, CATASTROPHICCHECKDELAY);

        ////////////////////////////////
        //Check App Disconnect
        ////////////////////////////////
        function resetStaleness() {
            setTimeout(
                function () {
                    if (numberOfTimesUpdateWasStaleInPastTwentyFourHours > 0) {
                        writeToServerLog('[' + new Date() + '] ' + REPEATEDSTALENESSMESSAGE + numberOfTimesUpdateWasStaleInPastTwentyFourHours + '\n');
                    }
                    numberOfTimesUpdateWasStaleInPastTwentyFourHours = 0;

                    if (numberOfTimesStatusWasStaleInPastTwentyFourHours > 0) {
                        writeToServerLog('[' + new Date() + '] ' + STATUSREPEATEDSTALENESSMESSAGE + numberOfTimesStatusWasStaleInPastTwentyFourHours + '\n');
                    }

                    numberOfTimesStatusWasStaleInPastTwentyFourHours = 0;
                    resetStaleness();
                }, INTERMITTENTSTALENESSRESETFREQUENCY);
        }

        resetStaleness();

        ////////////////////////////////
        //Check App Disconnect
        ////////////////////////////////
        function checkUpdateDisconnectLoop() {
            setTimeout(
                function () {
                    if (errorMessages[UPDATESTALENESSKEY] % UPDATEBIGFACTORSTALENESS === SMALLFACTORSTALENESS.UPDATESMALLFACTORSTALENESS) {
                        ++numberOfTimesUpdateWasStaleInPastTwentyFourHours;
                    }
                    checkUpdateDisconnectLoop();
                }, INTERMITTENTSTALENESSCHECKFREQUENCY);
        }

        checkUpdateDisconnectLoop();

        ////////////////////////////////
        //Check Site Disconnect
        ////////////////////////////////
        function checkStatusDisconnectLoop() {
            setTimeout(
                function () {
                    if (errorMessages.statusStaleness % STATUSBIGFACTORSTALENESS === SMALLFACTORSTALENESS.STATUSSMALLFACTORSTALENESS) {
                        ++numberOfTimesStatusWasStaleInPastTwentyFourHours;
                    }
                    checkStatusDisconnectLoop();
                }, INTERMITTENTSTALENESSCHECKFREQUENCY);
        }

        checkStatusDisconnectLoop();

        //////////////////////
        //Internal Text Tools
        //////////////////////
        function removeAllWhiteSpace(msg) {
            return msg.replace(/\s/g, '');
        }

        function getBadJsonParseLogText(textType, exception, rawText) {
            return BADJSONPARSELOGTEXT + textType.toUpperCase() + BADJSONPARSELOGTEXTDESCRIPTION + exception.toString() + rawText;
        }

        function safeJsonParse(rawText, textType) {
            let returnText = '';
            let success = true;
            try {
                returnText = (JSON.parse(rawText));
            }
            catch (exception) {
                success = false;
                handleError(JSONPARSEEXCEPTIONKEY + textType, getBadJsonParseLogText(textType, exception, rawText));
                returnText = (JSON.parse(`{${JSONPARSEERRORMESSAGEKEY}:"${exception.toString()}"`));
            }
            finally {
                if (success) {
                    clearErrorState(JSONPARSEEXCEPTIONKEY + textType);
                }
                return returnText;
            }
        }

        /////////////////////////////////////
        //Redis Default Database Connection
        ////////////////////////////////////
        let redis = null;
        let redisClient = null;
        let multiClient = null;
        let redisSubscriberClient = null;
        let inihandles = {
            iniresolve: null,
            inireject: null,
        };

        let redisSetPromise = new Promise(function redisSetter(resolve, reject) {
            redis = require('redis');
            redisClient = redis.createClient(REDISPORT, REDISIP);
            multiClient = redisClient.multi();

            ///////////////////////////
            //REDIS CONNECTION HANDLER
            ///////////////////////////
            try {
                redisClient.on('connect', function (err) {
                    if (err) {
                        handleError(REDISCONNECTERRORKEY, REDISCONNECTIONERRORMESSAGE + '\n' + err + '\n')
                    }
                    else {
                        clearErrorState(REDISCONNECTERRORKEY);
                    }
                });
            }
            catch (exception) {
                reject(exception);
            }

            ////////////////////////
            //REDIS ERROR HANDLER
            ////////////////////////

            redisClient.on('error', function (err) {
                function buildRedisLogText(redisSpecificError) {
                    return REDISCLIENTERRORSABORTKEY + '\n' + err + '\n' + redisSpecificError + '\n';
                }

                if (err instanceof redis.AbortError) {
                    handleError(REDISCLIENTERRORSABORTKEY, buildRedisLogText(REDISABORTERRORMESSAGE));
                }
                else if (err instanceof redis.AggregateError) {
                    handleError(REDISCLIENTERRORSAGGREGATEKEY, buildRedisLogText(REDISAGGREGATEERRORMESSAGE));
                }
                else if (err instanceof redis.RedisError) {
                    handleError(REDISCLIENTERRORSREDISKEY, buildRedisLogText(REDISERRORMESSAGE));
                }
                else if (err instanceof redis.ReplyError) {
                    handleError(REDISCLIENTERRORSREPLYKEY, buildRedisLogText(REDISREPLYERRORMESSAGE));
                }
                else if (err instanceof redis.ParserError) {
                    handleError(REDISCLIENTERRORSPARSERKEY, buildRedisLogText(REDISPARSERERRORMESSAGE));
                }
                else {
                    handleError(REDISCLIENTERRORSCONNECTIONKEY, buildRedisLogText(REDISUNKNOWNERRORMESSAGE));
                }
            });


            setTimeout(function () {
                redisClient.publish(PUBLISH_TO_DATASOURCE_CHANNEL, REQ_CONFIG_MSG);
            }, TIMETOWAITTOPUBLISHFORCONFIG);


            redisSubscriberClient = redis.createClient(REDISPORT, REDISIP);
            redisSubscriberClient.on('error', function (err) {

                function buildRedisSubscriberLogText(redisSpecificError) {
                    return REDISSUBSCRIBERCLIENTERRORMESSAGE + '\n' + err + '\n' + redisSpecificError + '\n';
                }

                if (err instanceof redis.AbortError) {
                    handleError(REDISSUBSCRIBERCLIENTERRORSABORTKEY, buildRedisSubscriberLogText(REDISABORTERRORMESSAGE));
                }
                else if (err instanceof redis.AggregateError) {
                    handleError(REDISSUBSCRIBERCLIENTERRORSAGGREGATEKEY, buildRedisSubscriberLogText(REDISAGGREGATEERRORMESSAGE));
                }
                else if (err instanceof redis.RedisError) {
                    handleError(REDISSUBSCRIBERCLIENTERRORSREDISKEY, buildRedisSubscriberLogText(REDISERRORMESSAGE));
                }
                else if (err instanceof redis.ReplyError) {
                    handleError(REDISSUBSCRIBERCLIENTERRORSREPLYKEY, buildRedisSubscriberLogText(REDISREPLYERRORMESSAGE));
                }
                else if (err instanceof redis.ParserError) {
                    handleError(REDISSUBSCRIBERCLIENTERRORSPARSERKEY, buildRedisSubscriberLogText(REDISPARSERERRORMESSAGE));
                }
                else {
                    handleError(REDISSUBSCRIBERCLIENTERRORSCONNECTIONKEY, buildRedisSubscriberLogText(REDISUNKNOWNERRORMESSAGE));
                }
            });

            /////////////////////////////////////
            //Subscribe to Redis Configurations
            /////////////////////////////////////
            redisSubscriberClient.subscribe(SUBSCRIBE_FROM_DATASOURCE_CHANNEL);
            redisSubscriberClient.subscribe(SUBSCRIBE_FROM_DATASOURCE_CHANNEL_CONFIG);
            redisSubscriberClient.subscribe(SUBSCRIBE_FROM_DATASOURCE_CHANNEL_INI);
            redisSubscriberClient.on('message', function (channel, message) {
                if (channel === SUBSCRIBE_FROM_DATASOURCE_CHANNEL) {
                    //todo: figure out the proper error handling technique here, continue testing for errors and edge cases
                    let jsonObj = safeJsonParse(message, JSONPARSETYPEREDISSUBSCRIBER);
                    if (jsonObj.SITE) {
                        configMessage = JSON.stringify(jsonObj);
                        clearRedisSubscriberErrors();
                    }
                    else if (jsonObj.INIFILE && typeof inihandles.iniresolve === 'function') {
                        inihandles.iniresolve(jsonObj.INIFILE);
                        inihandles.iniresolve = null;
                        clearRedisSubscriberErrors();
                    }
                    else if (jsonObj === '' && typeof inihandles.iniresolve === 'function') { //ini file had bad json in it. ini must be resolved
                        inihandles.iniresolve(EMPTYINIJSONRESPONSE);
                        inihandles.iniresolve = null;
                    }
                    //Dont always clear redis errors, there are error indicators within the conditionals above.
                }
                else if (channel === SUBSCRIBE_FROM_DATASOURCE_CHANNEL_CONFIG) {
                    let jsonObj = safeJsonParse(message, JSONPARSETYPECONFIG);
                    if (jsonObj !== '') {
                        dataSourceLogPath = jsonObj.LOGPATH;
                        configMessage = JSON.stringify(jsonObj);
                        logResetOcurred = true;
                        clearRedisSubscriberErrors();
                    }
                }
                else if (channel === SUBSCRIBE_FROM_DATASOURCE_CHANNEL_INI && typeof inihandles.iniresolve === 'function') {
                    let jsonObj = safeJsonParse(message, JSONPARSETYPEINI);
                    if (jsonObj !== '') {
                        inihandles.iniresolve(jsonObj.INIFILE);
                        inihandles.iniresolve = null;
                        clearRedisSubscriberErrors();
                    }
                }
            });
            if (errorStates['redisClientConnectionError']) {
                setTimeout(function () {
                    redisSetter(function () {
                    }, function () {
                    });
                }, RETRYREDISCONNECTIONFREQUENCY);
                reject();
            }
            else {
                resolve();
            }
        });
        redisSetPromise.catch(function (err) {
            handleError(REDISCLIENTERRORSKEY, err);
        });

        //todo, thoroughly test this portion. dead redis, jsonexception in subscriptions etc.

        function clearRedisSubscriberErrors() {
            clearErrorState(REDISSUBSCRIBERCLIENTERRORSCONNECTIONKEY);
            clearErrorState(REDISSUBSCRIBERCLIENTERRORSPARSERKEY);
            clearErrorState(REDISSUBSCRIBERCLIENTERRORSREPLYKEY);
            clearErrorState(REDISSUBSCRIBERCLIENTERRORSREDISKEY);
            clearErrorState(REDISSUBSCRIBERCLIENTERRORSAGGREGATEKEY);
            clearErrorState(REDISSUBSCRIBERCLIENTERRORSABORTKEY);
        }

        function processOccurredErrors(errorCategories) {
            let errors = {};
            let occurredKeys = Object.keys(occurredErrorList);
            for (let occurredIndex = 0; occurredIndex < occurredKeys.length; occurredIndex++) {
                for (let categoryIndex = 0; categoryIndex < errorCategories.length; categoryIndex++) {
                    if (errorHierarchy[errorCategories[categoryIndex]].hasOwnProperty(occurredKeys[occurredIndex])) {
                        errors[occurredKeys[occurredIndex]] = occurredErrorList[occurredKeys[occurredIndex]];
                    }
                }
            }
            return errors;
        }

        function processMessagePull(rawRedisMessage, type) {
            if (rawRedisMessage !== '') {
                const upperCaseType = type.toUpperCase();
                const lastMessageKey = 'last' + type[0].toUpperCase() + type.slice(1) + "Message";
                const pulledMessageKey = type + 'Message';
                const stalenessKey = type + 'Staleness';
                const smallFactorStalenessKey = upperCaseType + 'SMALLFACTORSTALENESS';
                lastRedisPulledMessages[lastMessageKey] = redisPulledMessages[pulledMessageKey];
                redisPulledMessages[pulledMessageKey] = rawRedisMessage;
                redisPulledMessages[pulledMessageKey] = removeAllWhiteSpace(redisPulledMessages[pulledMessageKey]);
                lastRedisPulledMessages[lastMessageKey] = removeAllWhiteSpace(lastRedisPulledMessages[lastMessageKey]);

                let stale = errorMessages[stalenessKey] > SMALLFACTORSTALENESS[smallFactorStalenessKey];
                let lastJsonObj;
                if (lastRedisPulledMessages[lastMessageKey] !== '') {
                    lastJsonObj = safeJsonParse(lastRedisPulledMessages[lastMessageKey], JSONPARSEPULLTYPE['JSONPARSETYPE' + upperCaseType]);
                    if (lastJsonObj.error) {
                        delete lastJsonObj.error;
                        lastRedisPulledMessages[lastMessageKey] = JSON.stringify(lastJsonObj);
                    }
                }
                if (removeAllWhiteSpace(lastRedisPulledMessages[lastMessageKey]) === removeAllWhiteSpace(redisPulledMessages[pulledMessageKey]) || lastJsonObj === '') {
                    occurredErrorList[stalenessKey] = ++errorMessages[stalenessKey];
                }
                else {
                    if (lastJsonObj !== '') {
                        if (!stale) {
                            clearErrorState(stalenessKey);
                        }
                        delete occurredErrorList[stalenessKey];
                        errorMessages[stalenessKey] = STALENESSLEANIENCY[upperCaseType + 'STALENESSLENIENCY'];
                    }
                }
                if (!errorStates['jsonParseException' + type] && stale) {
                    handleError(type + 'Stale', STALENESSSERVERERRORMESSAGE[upperCaseType + 'STALENESSSERVERERRORMESSAGE']);
                }
                let jsonObj;
                if (lastJsonObj !== '') {
                    jsonObj = safeJsonParse(redisPulledMessages[pulledMessageKey], JSONPARSETYPEERR['JSONPARSETYPE' + upperCaseType + 'ERR']);
                    if (jsonObj === '') {
                        jsonObj = {};
                        jsonObj[type === JSONPARSEPULLTYPE.JSONPARSETYPEUPDATE ? 'SYSTIME' : 'TIME2'] = '';
                        handleError(type + 'Stale', STALENESSSERVERERRORMESSAGE[upperCaseType + 'STALENESSSERVERERRORMESSAGE'])
                    }
                    else if (!stale) {
                        clearErrorState(type + 'Stale');
                    }
                }
                else {
                    jsonObj = {};
                    jsonObj[type === JSONPARSEPULLTYPE.JSONPARSETYPEUPDATE ? 'SYSTIME' : 'TIME2'] = '';
                    //being as a json exception occurred and there's no message
                    handleError(type + 'Stale', STALENESSSERVERERRORMESSAGE[upperCaseType + 'STALENESSSERVERERRORMESSAGE']);
                }
                Object.keys(jsonObj).forEach(v => {
                    if (v !== v.trim()) {
                        jsonObj[v.trim()] = jsonObj[v];
                        delete jsonObj[v];
                    }
                });

                if (lastJsonObj !== '') {
                    redisPulledMessages[pulledMessageKey] = JSON.stringify(jsonObj);
                }
                else {
                    redisPulledErrorMessage[type + 'MessageERR'] = JSON.stringify(jsonObj);
                }
            }
        }

        function timeStamp() {
            return new Date().toString();
        }

        function logError(highLevelErrorText) {
            writeToServerLog(ERRORMESSAGEPREFIX + highLevelErrorText);
            console.log(ERRORMESSAGEPREFIX + highLevelErrorText);
        }

        function handleError(errorState, highLevelErrorText) {
            if (!errorStates[errorState]) {
                logError(highLevelErrorText + ': ' + timeStamp());
                errorStates[errorState] = true;
                occurredErrorList[errorState] = ERRORMESSAGEPREFIX + errorMessages[errorState];
            }
        }

        function clearRedisErrors() {
            clearErrorState(REDISCLIENTERRORSCONNECTIONKEY);
            clearErrorState(REDISCLIENTERRORSPARSERKEY);
            clearErrorState(REDISCLIENTERRORSREPLYKEY);
            clearErrorState(REDISCLIENTERRORSREDISKEY);
            clearErrorState(REDISCLIENTERRORSAGGREGATEKEY);
            clearErrorState(REDISCLIENTERRORSABORTKEY);
            //test to see if the subscriber mechanism is broken, and if not, clear those errors as well.
            let success = true;
            (new Promise(function (resolve, reject) {
                    try {
                        redisClient.publish(PUBLISH_TO_DATASOURCE_CHANNEL, '');
                    } catch (e) {
                        success = false;
                    } finally {
                        if (success) {
                            resolve();
                        }
                        else {
                            reject();
                        }
                    }
                }
            )).then(function () {
                clearRedisSubscriberErrors();
            }).catch(function () {

            })
        }


        ///////////////////////////////////////
        //Pull Update From Redis Incrementally
        ///////////////////////////////////////
        function redisPullUpdate() {
            setTimeout(
                function () {
                    let redisPullResultPromise = new Promise(function (resolve, reject) {
                        redisClient.lindex(REDISUPDATEKEYBUFFERNAME, 0, function (err, result) {
                            if (err) {
                                reject(err);
                                handleError(UPDATEPULLFAILUREKEY, REDISUPDATEPULLERRORMESSAGE + '\n');
                            }
                            else {
                                clearRedisErrors();
                                resolve(result);
                            }
                        });
                    });
                    redisPullResultPromise.then(function (result) {
                        processMessagePull(result, JSONPARSEPULLTYPE.JSONPARSETYPEUPDATE);
                        clearErrorState(UPDATEPULLFAILUREKEY);
                    }).catch(function (err) {
                        handleError(UPDATEPULLFAILUREKEY, REDISUPDATEPULLERRORMESSAGE + '\n' + err + '\n');
                    });
                    redisPullUpdate();
                }, REDISPULLUPDATEFREQUENCY);
        }

        redisPullUpdate();

        ///////////////////////////////////////
        //Pull Status From Redis Incrementally
        ///////////////////////////////////////
        function redisPullStatus() {
            setTimeout(
                function () {
                    let redisPullResultPromise = new Promise(function (resolve, reject) {
                        redisClient.lindex(REDISSTATUSKEYBUFFERNAME, 0, function (err, result) {
                            if (err) {
                                handleError(STATUSPULLFAILUREKEY, REDISSTATUSPULLERRORMESSAGE + '\n');
                                reject(err);
                            }
                            else {
                                clearRedisErrors();
                                resolve(result);
                            }
                        });
                    });
                    redisPullResultPromise.then(function (result) {
                        processMessagePull(result, 'status');
                        clearErrorState(STATUSPULLFAILUREKEY);
                    }).catch(function (err) {
                        handleError(STATUSPULLFAILUREKEY, REDISSTATUSPULLERRORMESSAGE + '\n' + err);
                    });

                    redisPullStatus();
                }
                , REDISPULLSTATUSFREQUENCY);
        }

        redisPullStatus();

        ////////////////////////////////////////////////////
        //Node.js File Server implementation
        ////////////////////////////////////////////////////
        let fileSystemWriter = null;
        let fileSystemReader = null;
        let fs = new Promise(function () {
            fileSystemWriter = require('fs');
            fileSystemReader = require('fs');
        });
        fs.then(function () {
        }).catch(function (err) {
            console.log('CANNOT WRITE FILES' + err);
        });

        function writeToServerLog(logEntries) {
            if (!fileSystemWriter.existsSync(SERVERLOGDIR)) {
                fileSystemWriter.mkdirSync(SERVERLOGDIR);
            }
            fileSystemWriter.appendFile(SERVERLOGLOCATION, logEntries + '\n', function (err) {
                if (err) {
                    console.log(err);
                }
            });
            return logEntries;
        }

        function buildJsonKeyValuePair(key, value) {
            return '"' + key + '":"' + value + '",\n';
        }

        function buildJsonObjectFromKeyValuePairs(keys, values) {
            let jsonTextResponse = '{\n';
            for (let i = 0; i < keys.length; ++i) {
                jsonTextResponse += buildJsonKeyValuePair(keys[i], values[i]);
            }
            jsonTextResponse += '}';
            return jsonTextResponse;
        }

        function promiseHelperhmget(keys) {
            if (keys) {
                return new Promise(function (resolve, reject) {
                    redisClient.hmget('keys', keys, function (err, result) {
                        if (err) {
                            handleError(GETKEYSERRORKEY, err);
                            reject(err);
                        }
                        else {
                            clearRedisErrors();
                            clearErrorState(GETKEYSERRORKEY);
                            resolve(buildJsonObjectFromKeyValuePairs(keys, result));
                        }
                    });
                })
            }
        }

        function promiseHelperhsetnx(hashMapName, keyName, setValue) {
            return new Promise(function (resolve, reject) {
                redisClient.hsetnx(hashMapName, keyName, setValue, function (err, result) {
                    if (err) {
                        handleError(CREATEKEYSERRORKEY, err);
                        reject(err);
                    }
                    else {
                        clearRedisErrors();
                        clearErrorState(CREATEKEYSERRORKEY);
                        resolve(buildJsonKeyValuePair(keyName, result));
                    }
                });
            });
        }

        function promiseHelperhset(hashMapName, keyName, setValue) {
            return new Promise(function (resolve, reject) {
                redisClient.hset(hashMapName, keyName, setValue, function (err, result) {
                    if (err) {
                        handleError(SETHASHMAPERRORKEY, err);
                        reject(err);
                    }
                    else {
                        clearRedisErrors();
                        clearErrorState(SETHASHMAPERRORKEY);
                        resolve(buildJsonKeyValuePair(keyName, result));
                    }
                });
            })
        }

        /////////////////////////////////////////////////////////////
        //All calls to response.write( contain this function )
        /////////////////////////////////////////////////////////////
        function resultGetter(result) {
            let returnString = '';

            if (result.hasOwnProperty('lastIndex')) {
                return JSON.stringify(result[0]);
            }
            else if (Array.isArray(result)) {
                //Result is a preprocessed array of key value pairs
                let jsonResponseObject = '';
                for (let i = 0; i < result.length; ++i) {
                    jsonResponseObject += result[i];
                }
                returnString = ('{\n' + jsonResponseObject + '}');
            }
            else {
                //Result is already Json or does not need to be Json
                returnString = result;
            }
            //Ensure that the returned result will be in a string format
            if (typeof returnString === 'number') {
                returnString = returnString.toString();
            }
            if (typeof returnString === 'object') {
                if (!returnString.length) {
                    returnString = '{}';
                }
                returnString = returnString.toString();
            }

            //Ensure there is no comma just before the closing curly brace
            returnString = (returnString.replace(',\n}', '\n}')).replace(',}', '}');
            return returnString;
        }

        ////////////////////////////////////////////////////
        //HTTP Method Handlers
        ////////////////////////////////////////////////////

        getResponseDictionary[UPDATERESPONSEKEY] = function () {
            return new Promise(function (resolve, reject) {
                let resolveMessage = '';
                try {
                    if (!redisPulledMessages.updateMessage || redisPulledMessages.updateMessage === '' || redisPulledMessages.updateMessage === null) {
                        resolveMessage = (EMPTYSTATUSRESPONSE);
                    }
                    else {
                        let updateMessageResolve;
                        if (redisPulledErrorMessage.updateMessageERR) {
                            updateMessageResolve = redisPulledErrorMessage.updateMessageERR;
                            setTimeout(function () {
                                if (!errorStates.jsonParseExceptionupdate) {
                                    redisPulledErrorMessage.updateMessageERR = '';
                                }
                            }, UPDATEMESSAGEERRRESETDELAY);
                        }
                        else {
                            updateMessageResolve = redisPulledMessages.updateMessage;
                        }
                        resolveMessage = (updateMessageResolve);
                    }
                    let jsonObj = safeJsonParse(resolveMessage, JSONPARSEPULLTYPE.JSONPARSETYPEUPDATE);
                    if (!jsonObj.hasOwnProperty('SYSTIME')) {
                        jsonObj.SYSTIME = '';
                    }
                    resolve(JSON.stringify(addErrorObject(jsonObj, JSONPARSEPULLTYPE.JSONPARSETYPEUPDATE)));
                } catch (e) {
                    reject(e);
                }
            })
        };

        getResponseDictionary[ERRORRESPONSEKEY] = function () {
            return new Promise(function (resolve, reject) {
                try {
                    let jsonObj = {};
                    jsonObj.error = {
                        'message': 'Multiple Error Codes In "data" Data Member',
                        'code': 'multi',
                        'data': occurredErrorList
                    };
                    resolve(JSON.stringify(jsonObj));
                } catch (e) {
                    reject(e);
                }
            })
        };

        getResponseDictionary[STATUSRESPONSEKEY] = function () {
            return new Promise(function (resolve, reject) {
                try {
                    if (!redisPulledMessages.statusMessage || redisPulledMessages.statusMessage === '' || redisPulledMessages.statusMessage === null) {
                        resolve(EMPTYSTATUSRESPONSE);
                    }
                    else {
                        let statusMessageResolve;
                        if (redisPulledErrorMessage.statusMessageERR !== '') {
                            statusMessageResolve = redisPulledErrorMessage.statusMessageERR;
                            setTimeout(function () {
                                if (!errorStates.jsonParseExceptionstatus) {
                                    redisPulledErrorMessage.statusMessageERR = '';
                                }
                            }, STATUSMESSAGEERRRESETDELAY);
                        }
                        else {
                            statusMessageResolve = redisPulledMessages.statusMessage;
                        }

                        let jsonObj = safeJsonParse(statusMessageResolve, JSONPARSEPULLTYPE.JSONPARSETYPESTATUS);
                        if (!jsonObj.hasOwnProperty('TIME2')) {
                            jsonObj.TIME2 = '';
                        }
                        resolve(JSON.stringify(addErrorObject(jsonObj, JSONPARSEPULLTYPE.JSONPARSETYPESTATUS)));
                    }
                } catch (e) {
                    reject(e);
                }
            })
        };

        getResponseDictionary[CONFIGURATIONRESPONSEKEY] = function () {
            return new Promise(function (resolve, reject) {
                try {
                    if (!configMessage || configMessage === '' || configMessage === null) {
                        resolve(EMPTYCONFIGJSONRESPONSE);
                    }
                    else {
                        let jsonObj = safeJsonParse(configMessage, JSONPARSETYPECONFIG);
                        resolve(jsonObj === '' ? {} : configMessage);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        };

        getResponseDictionary[INIFILERESPONSEKEY] = function () {
            let timeout;
            let p = new Promise(function (resolve, reject) {
                if (inihandles.iniresolve !== null) {
                    inihandles.iniresolve = null;
                }
                if (inihandles.inireject !== null) {
                    inihandles.inireject = null;
                }
                inihandles.iniresolve = resolve;
                inihandles.inireject = reject;
                redisClient.publish(PUBLISH_TO_DATASOURCE_CHANNEL, REQ_INI_MSG);

                //If the subscriber does not set the ini message that was asked for then we need to resolve this ourselves.
                //todo: All response dictionary entries should have a timeout resolution mechanism.
                timeout = setTimeout(function () {
                    resolve(EMPTYINIJSONRESPONSE);
                }, 1000);
            });
            p.then(function () {
                clearTimeout(timeout);
            });
            return p;
        };

        let lazy = require('lazy');
        let logEntriesCache = [];
        let contiguousCacheRanges = [];
        let lastIndex = 0;
        let itemsPulledAtOnce = 1000;

        function addToCacheRanges(start, stop) {
            contiguousCacheRanges.push([start, stop]);
            for (let i = 0; i < contiguousCacheRanges.length; i++) {
                for (let j = 0; j < contiguousCacheRanges.length; j++) {
                    let smallI = contiguousCacheRanges[i][0];
                    let bigI = contiguousCacheRanges[i][1];
                    let smallJ = contiguousCacheRanges[j][0];
                    let bigJ = contiguousCacheRanges[j][1];
                    if (i !== j
                        && ((smallJ <= smallI && bigJ >= bigI)
                            || (smallJ >= smallI && smallJ <= bigI)
                            || (bigJ >= smallI && bigJ <= bigI)
                            || smallJ - 1 === bigI
                            || bigJ + 1 === smallI)) {
                        contiguousCacheRanges[i][0] = Math.min(smallI, smallJ);
                        contiguousCacheRanges[i][1] = Math.max(bigI, bigJ);
                        contiguousCacheRanges.splice(j, 1);
                    }
                }
            }
            return contiguousCacheRanges;
        }

        //todo: figure out if there is any way that the readstream does not have to be opened per request for the log
        getResponseDictionary[LOGDELTARESPONSEKEY] = function (index) {
            return new Promise(function (resolve, reject) {
                    let success = true;
                    try {
                        index = +index;
                        if (logResetOcurred) {
                            lastIndex = 0;
                            setTimeout(function () {
                                logResetOcurred = false;
                            }, NOTIFICATIONDURATIONOFLOGRESET);
                            resolve(JSON.stringify({
                                'lastIndex': lastIndex,
                                'entries': []
                            }));
                        }
                        else if (dataSourceLogPath !== '') {
                            if (index > lastIndex) {
                                lastIndex = index;
                            }
                            let returnedEntries = [];
                            let pullFromCache = false;
                            let amountToPullFromCache = 0;
                            if (contiguousCacheRanges) {
                                for (let i = contiguousCacheRanges.length - 1; i >= 0; --i) {
                                    if (index > contiguousCacheRanges[i][0] && index < contiguousCacheRanges[i][1]) {
                                        amountToPullFromCache = Math.min(contiguousCacheRanges[i][1] - index, itemsPulledAtOnce);
                                        pullFromCache = true;
                                        break;
                                    }
                                }
                            }
                            if (pullFromCache && amountToPullFromCache !== 0) {
                                returnedEntries = logEntriesCache.slice(index, index + amountToPullFromCache);
                                if (amountToPullFromCache >= itemsPulledAtOnce) {
                                    resolve(JSON.stringify({
                                        'lastIndex': lastIndex,
                                        'entries': returnedEntries
                                    }));
                                    return;
                                }
                                else { //partial Pull From Cache
                                }
                            }
                            else { //Pull from File only
                            }
                            let lazyPromise = new Promise(function (resolve, reject) {
                                let amountToPullFromFile = itemsPulledAtOnce - amountToPullFromCache;
                                let lines = (
                                    lazy(fileSystemReader.createReadStream(dataSourceLogPath))
                                        .lines
                                        .skip(index + returnedEntries.length)
                                        .take(amountToPullFromFile)
                                        .map(function (line) {
                                            return line.toString('utf-8');
                                        })
                                );
                                lines.join(function (result) {
                                    resolve(result);
                                });
                            });
                            lazyPromise.then(function (result) {
                                for (let i = 0; i < result.length; i++) {
                                    logEntriesCache[(index + returnedEntries.length + i)] = result[i];
                                }
                                Array.prototype.push.apply(returnedEntries, result);
                                addToCacheRanges(index, index + returnedEntries.length);
                                resolve(JSON.stringify({
                                    'lastIndex': lastIndex,
                                    'entries': returnedEntries
                                }));
                            });
                        }
                        else {
                            //data source path to log was null
                            resolve(JSON.stringify({
                                'lastIndex': lastIndex,
                                'entries': []
                            }));
                        }
                    }
                    catch (e) {
                        success = false;
                        console.log(e);
                        reject(e);
                        handleError(LOGPULLFAILUREKEY, e)
                    }
                    finally {
                        if (success) {
                            clearErrorState(LOGPULLFAILUREKEY);
                        }
                    }
                }
            );
        };

        getResponseDictionary[LOGRESPONSEKEY] = function (index) {
            return getResponseDictionary[LOGDELTARESPONSEKEY](index);
        };

        getResponseDictionary[KEYSRESPONSEKEYS] = function (keys) {
            return promiseHelperhmget(keys);
        };

        postResponseDictionary[KEYSRESPONSEKEYS] = function (keys, setValues) {
            if (keys && setValues && Array.isArray(keys) && Array.isArray(setValues) && keys.length > 0 && setValues.length > 0 && keys.length === setValues.length) {
                return Promise.all(keys.map(function (key, i) {
                    return promiseHelperhsetnx('keys', key, setValues[i])
                }));
            }
        };

        postResponseDictionary[LOGRESPONSEKEY] = function () {
            return new Promise(function (resolve, reject) {
                try {
                    redisClient.publish(PUBLISH_TO_DATASOURCE_CHANNEL, RESETLOGVALUE);
                    resolve('Successfully Sent Log Reset Command');
                } catch (e) {
                    reject(e);
                }
            });
        };


        putResponseDictionary[KEYSRESPONSEKEYS] = function (keys, setValues) {
            if (keys && setValues && Array.isArray(keys) && Array.isArray(setValues) && keys.length > 0 && setValues.length > 0 && keys.length === setValues.length) {
                return Promise.all(keys.map(function (key, i) {
                    return promiseHelperhset('keys', key, setValues[i])
                }))
            }
            else {
                return new Promise(function (resolve, reject) {
                    try {
                        resolve('{"error":"keys have a different length than parameters"}');
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        };

        putResponseDictionary[INIFILERESPONSEKEY] = function (keys, setValues) {
            return new Promise(function (resolve, reject) {
                try {
                    redisClient.publish(PUBLISH_TO_DATASOURCE_CHANNEL_PUT_INI, setValues);
                    resolve('Successfully Published Ini');
                } catch (e) {
                    reject(e);
                }
            });
        };

        putResponseDictionary[CONFIGURATIONRESPONSEKEY] = function (keys, setValues) {
            return new Promise(function (resolve, reject) {
                try {
                    redisClient.publish(PUBLISH_TO_DATASOURCE_CHANNEL_PUT_CONFIG, setValues);
                    resolve('Successfully Published Config');
                } catch (e) {
                    reject(e);
                }
            });
        };


        function parseRequest(request) {
            let indexOfLastSlash = request.lastIndexOf('/');
            let keys = request.substring(indexOfLastSlash + 1).split(',');
            let requestString = indexOfLastSlash === 0 ? request : request.substring(0, indexOfLastSlash);
            return {requestString, keys};
        }


        function handleRequest(request, response) {
            //todo: take a look at refactoring based on setting global function handles to request/response
            let parsedURL = parseRequest(request.url.toString());
            let requestString = parsedURL.requestString;
            let keys = parsedURL.keys;
            let badRequest = '';

            function respond(responseMethod, setterValues) {
                if ((typeof responseMethod === 'function')) {
                    responseMethod(keys, setterValues).then(function (result) {
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.write(resultGetter(result));
                        response.end();
                        clearErrorState(BADRESPONSEKEY);
                    }).catch(function (err) {
                        handleError(BADRESPONSEKEY, err + '\n');
                    });
                }
                else {
                    badRequest = INVALIDURLREQUESTIDENTIFIER;
                }
            }

            function setterRespond(responseMethod) {
                request.on('data', function (data) {
                    let setterValues = data.toString().split(',');
                    if (keys.length > 0 && setterValues.length > 0 && keys.length === setterValues.length) {
                        respond(responseMethod, setterValues);
                    }
                    else {
                        badRequest = INVALIDPARAMSREQUESTIDENTIFIER;
                    }
                });
            }

            function comRespond(responseMethod) {
                request.on('data', function (data) {
                    respond(responseMethod, data.toString());
                });
            }

            if (request.method === 'GET') {
                respond(getResponseDictionary[requestString]);
            }
            else if (request.method === 'POST') {
                if (requestString !== '/keys') {
                    comRespond(postResponseDictionary[requestString]);
                } else {
                    setterRespond(postResponseDictionary[requestString]);
                }
            }
            else if (request.method === 'PUT') {
                if (requestString !== '/keys') {
                    comRespond(putResponseDictionary[requestString]);
                } else {
                    setterRespond(putResponseDictionary[requestString]);
                }
            }
            else if (request.method === 'DELETE') {
                //respond('The Delete Method Is Not Supported');
            }
            else {
                /////////////////
                //Respond Anyway
                /////////////////
                badRequest = INVALIDMETHODREQUESTIDENTIFIER;
            }
            if (badRequest !== '') {
                response.writeHead(400, {'Content-Type': 'application/json'});
                if (badRequest === INVALIDPARAMSREQUESTIDENTIFIER) {
                    response.write(INVALIDPARAMETERSHTTPERRORMESSAGE);
                }
                else if (badRequest === INVALIDURLREQUESTIDENTIFIER) {
                    response.write(INVALIDURLHTTPERRORMESSAGE);
                }
                else if (badRequest === INVALIDMETHODREQUESTIDENTIFIER) {
                    response.write(INVALIDMETHODHTTPERROR);
                }
                response.end();
                badRequest = '';
            }
        }
    }
    else {//Could not start server
        return;
    }
    module.exports = {getResponseDictionary, postResponseDictionary, putResponseDictionary};
})();
/* httpClient.js -- communicate with an HTTP server
 *   make various HTTP requests, and handle responses
 *   all functions return a Promise for asynchronous .then() chaining
 *   Low-level "fetch" function can be overridden for custom handling, e.g. HTTP simulation without a server
 */

// REQUIRES: tools.js, for global namespace object "CCT"


// Create httpClient module with alias "h" for console convenience
CCT.h = CCT.httpClient = (function () {

    var exportObj = {

        // Request JSON data and parse the result into an object
        //   next .then() handler will receive JSON-parsed object or thrown Error
        getJSON: function(uri) {
            return fetchResponse(uri)
                .then(function(response) {
                    return response.json()  // returns another Promise, resolving to JSON object
                })
                .then(function(obj) {
                    if (obj) {
                        // console.log(`getJSON: ${uri} -->`, obj);
                        // Successfully got JSON object; pass to caller's .then()
                        return obj;
                    }
                    else {
                        throw new TypeError('httpClient.fetchResponse received null/undefined JSON object');
                    }
                })
                .catch(
                    function(err) {
                        // Got either HTTP Error or json() stream failure
                        CCT.tools.consoleError(err, 'httpClient.getJSON');
                        throw new TypeError('httpClient.getJSON received no data');
                    }
                );
        },

        putJSON: function(uri, obj) {
            // Upload a JSON object to server:
            //   set up "options" object for a PUT request
            //   return fetchResponse( uri, options ).then()...
        },

        // ... implement more HTTP methods as needed


        // Override the low-level "fetch" function, for custom handling
        //   (like, say... an HTTP simulator)
        fetch: {
            // spec: function newFetch(uri, options) { ... }, returns a Promise resolving to HTTP response
            // cf. doFetch() below
            override: function (newFetch, id) {   // omit id, will use empty string
                overrideFetch = newFetch;
                overrideId = id || '';
                console.info("Overriding browser's built-in %cfetch", 'font-style: italic', 'for custom HTTP handling');
            },
            restore: function () {
                overrideFetch = null;
                overrideId = '';
                console.info("Restoring browser's built-in %cfetch", 'font-style: italic', 'HTTP handler');
            },
            isOverriden: function () {
                return !!overrideFetch;
            },
            getOverrideId: function () {
                return overrideId;
            },
        }

    }; // --- END OF EXPORT ---


    var overrideFetch = null;   // function to use instead of browser's built-in "fetch" API
    var overrideId = '';        // human-readable id

    // Minimal wrapper around fetch() to make any HTTP request.
    // Wrapping it allows us to override it.
    // "options" object supports any type of request, by setting various properties.
    // Pass only uri for a basic GET.
    function doFetch(uri, options) {
        var f = overrideFetch || fetch;
        return (arguments.length > 1
            ? f(uri, options)
            : f(uri));
    }

    // fetchResponse() sends any HTTP request to server, gets the response and handles all errors.
    //   Returns successful response object to next .then(), or throws error to next .then()/.catch()
    //     cf. fetch() API, Response object, e.g. https://developer.mozilla.org/en-US/docs/Web/API/Response
    function fetchResponse(uri, options) {
        return (arguments.length > 1 ? doFetch(uri, options) : doFetch(uri))
            .then(
                function(response) {
                    if (response.ok) {
                        // This means HTTP code in the 200's, successful response
                        // Give the full response back to the caller so they can get data as text/json/blob/whatever
                        return response;
                    }

                    // If we are still here, the HTTP request completed, but it was an error

                    var err = {name: '', message: response.status + ' ' + response.statusText};
                    if (response.status >= 500) {
                        err.name = 'HTTP Server Error';
                    }
                    else if (response.status >= 400) {
                        err.name = 'HTTP Client Error';
                    }
                    else if (response.status >= 300) {
                        // Not an error, but we haven't handled redirection yet
                        err.name = 'HTTP Redirection';
                        console.log('HTTP Redirection not implemented in httpClient at this time');
                    }
                    else {
                        // must be an "Informational response" in the 100's; not sure what we would do with these
                        err.name = 'HTTP Informational response';
                        console.log('HTTP Informational responses not implemented in httpClient at this time');
                    }
                    CCT.tools.consoleError(err, 'httpClient.fetchResponse');
                    throw new TypeError('httpClient.fetchResponse received error for URI ' + uri );
                }, function(err) {
                    // Worse than an error, we did not even get a response
                    CCT.tools.consoleError(err, 'httpClient.fetchResponse');
                    throw new TypeError('httpClient.fetchResponse received no response for URI ' + uri);
                }
            );
    }

    return exportObj;
})();

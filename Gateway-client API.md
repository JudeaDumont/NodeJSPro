# CCT: HTTP/redis gateway client API

This document specifies a RESTful API for use between Braxton's browser-based CCT client and an HTTP/redis gateway functioning as an intermediary to the CCT Windows service.

## Background: a RESTful-formatted API

A conventional RESTful API uses HTTP methods as "verbs," hierarchical URIs as "nouns," and JSON objects as data containers.

### HTTP verbs as "CRUD" commands

- `POST` - (**C**)reate a resource within a given collection
- `GET` - (**R**)etrieve a resource
- `PUT` - (**U**)pdate a resource
- `DELETE` - (**D**)elete a resource

Most CCT client requests will be `GET` requests, retrieving information in order to display it to the user.

### HTTP verbs acting on hierarchical URI resources

Client makes HTTP requests against URIs that identify a "resource" from server root, e.g.,

	GET /api/keys/myKeyName

Gateway replies with JSON-formatted text, e.g.,

    Content-type: application/json
	{"myKeyName": "myKeyValue"}

HTTP "verbs" are preferred over URL parameters, e.g.,

    POST /api/keys/myNewKey
    {"myNewKey": "myNewValue"}

rather than the older style,

    GET /api/keys/createNew?key=myNewKey&value=myNewValue

The above `POST` example would create a new key with the given value, as the `POST` verb corresponds to a (**C**)reate command.

To update an already existing key, the (**U**)pdate method (`PUT`) would be called for:

    PUT /api/keys/myExistingKey
    {"myExistingKey": "myNewValue"}

### Acting on multiple resources

A popular way of specifying multiple resources is to list them separated by commas:

    GET /api/keys/keyName1,keyName2,keyName3

The response would be:

    Content-type: application/json
    {"keyName1":"value1", "keyName2":"value2", "keyName3":"value3"}

There are more complex schemes supported by standard libraries, but a simple comma-separated list should suffice for our purposes.

## URI Scheme Encompassing Web Content and API

The HTTP/redis gateway serves web content files, such as HTML pages and PNG images, in addition to handling RESTful API calls. Our URI scheme provides for both as follows:

- `/api` directory (from root) contains all API calls. Examples:


    http://hostname/api/configuration
    http://hostname/api/keys/status,configuration


- Everything else is interpreted as web server content. Examples:


    http://hostname/index.html
    http://hostname/BraxtonLogo.png
    http://hostname/settings/config.js


## API Resources by URI

### General

#### Verbs

Each resource supports all HTTP verbs/methods with their most direct, standard meanings unless otherwise noted.

Some resources may be read-only, in which case `GET` is the only verb supported.

#### Error Object

Every JSON response can contain an optional nested error object conforming to JSON-RPC 2.0, which must contain a numeric code and a message string:

    {... "error": {"code":113, "message":"Server error: redis string improperly formatted"},... }

For additional details, there is an optional error property called "data," which can be a primitive type or another nested object.

    {... "error": {"code": 123, "message": "Parse error", "data":{"piles":"of", "any-kind":"of-error-data"}},... }

Specific error codes and messages are expected to evolve during development. Note that in addition to these properties, the client will also receive the standard HTTP error code and status message, such as "404 Not Found" or "503 Service Unavailable."

### URIs and methods

    GET /api/configuration

    PUT /api/configuration
    {"SITE":"COOK-A", "LATITUDE":34.823, ...}

- access complete list of configuration/session parameters
- CCT writes configuration when active site/task session begins, clears it when session ends
- parameter values do not change during session
- `GET` response: serialized JSON object representing full configuration
- `PUT` pushes new config params to CCT
- no support for `POST` or `DELETE`


    GET /api/update

- request the "once per second" state of the CCT
- CCT writes this message once per second in all modes of operation
- read-only, supports only `GET`
- response: serialized JSON object representing CCT state,
- e.g. `{"SYSTIME":"249:13:55:47", "CMD_SRC":"KS252",...}`


    GET /api/status

- request state of site/task currently running
- CCT writes this message once per second, *only* when communicating with a site for an active task.
- read-only, supports only `GET`
- response: serialized JSON object representing state of site/task,
- e.g. `{"TIME2":"257/00245", "AZ":"61.113",...}`


    GET /api/logDelta/lineNumber

- request all log messages starting at line # `lineNumber` (zero-based)
- if `lineNumber` omitted, defaults to zero (first line of log file)
- read-only, supports only `GET`
- response: serialized JSON object containing array of log messages and state variables,
- e.g., `{"lastIndex":"1731", "entries":["13:55:47.883 V10556 connection failure...", "13:55:48.002...",...]}`


    GET /api/log

    POST /api/log
    <empty content>

- access entire log file
- `GET` requests entire log file, alias for `/api/logDelta/0`
- `POST` tells CCT to create new log file; old one will be closed and saved
- no support for `PUT` or `DELETE`


    GET /api/iniFile

    PUT /api/iniFile
    "IPPort=16001\nMaxUsers=12..."

- access .INI file (CCT app settings)
- `GET` response: JSON string containing entire file
- *FUTURE*: `PUT` submits edited .INI file back to CCT


    GET /api/error

- request object listing all error codes with a state for each
- provided as diagnostic tool, to drill down into specific error conditions
- read-only, supports only `GET`
- response: serialized JSON object representing CCT error state,
- e.g. `{"error": {"code": "multi", "message": "multiple...", data: {"errKey1": "errMsg1",...}}}`


    GET /api/keys/keyName
    
    PUT|POST /api/keys/keyName
    {"keyName": "keyValue"}
    
    DELETE /api/keys/keyName

- direct access to redis key values, allows client to do things not provided for by rest of API
- some keys may be read-only, supporting only `GET`
- `GET` response: JSON object containing key/value pair `{"keyName": "keyValue"}`


    GET /api/keys/keyName1,keyName2,keyName3
    
    PUT|POST /api/keys/keyName1,keyName2,keyName3
    {"keyName1":"keyValue1", "keyName2":"keyValue2", "keyName3":"keyValue3"}
    
    DELETE /api/keys/keyName1,keyName2,keyName3

- allows multiple keys to be processed in one batch
- `GET` response: `{"keyName1":"keyValue1", "keyName2":"keyValue2", "keyName3":"keyValue3"}`


    GET /api/keys/
    
    PUT|POST /api/keys/
    {"keyName1":"keyValue1", "keyName2":"keyValue2", "keyName3":"keyValue3",...}

- process full list of all keys
- equivalent to listing all existing keys after the trailing slash
- `GET` response: JSON serialization of all redis keys as fields of one anonymous object
- `PUT|POST` handling: set/create all keys listed in `Content` section, ignore keys not listed
- `DELETE` not supported

## REST references

http://microformats.org/wiki/rest/urls

http://www.restapitutorial.com/lessons/restfulresourcenaming.html

http://www.restapitutorial.com

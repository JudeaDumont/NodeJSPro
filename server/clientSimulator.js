var requires = require('./app');
(function clientSimulator() {
    //Hardcore tests
    //Empty everything
    console.log("CONSOLE SIMULATOR UP");
    requires.putResponseDictionary['/keys']();
    requires.postResponseDictionary['/keys']();
    requires.getResponseDictionary['/keys']();
    requires.getResponseDictionary['/log']();
    requires.getResponseDictionary['/logDelta']();
    requires.getResponseDictionary['/status']();
    requires.getResponseDictionary['/configuration']();
    requires.getResponseDictionary['/iniFile']();
    requires.getResponseDictionary['/status']();

    //weird parameters
    requires.putResponseDictionary['/keys'](0);
    requires.postResponseDictionary['/keys'](0);
    requires.getResponseDictionary['/keys'](0);
    requires.getResponseDictionary['/log'](0);
    requires.getResponseDictionary['/logDelta'](0);
    requires.getResponseDictionary['/status'](0);
    requires.getResponseDictionary['/configuration'](0);
    requires.getResponseDictionary['/iniFile'](0);
    requires.getResponseDictionary['/status'](0);

    requires.putResponseDictionary['/keys'](0, 0);
    requires.postResponseDictionary['/keys'](0, 0);
    requires.getResponseDictionary['/keys'](0, 0);
    requires.getResponseDictionary['/log'](0, 0);
    requires.getResponseDictionary['/logDelta'](0, 0);
    requires.getResponseDictionary['/status'](0, 0);
    requires.getResponseDictionary['/configuration'](0, 0);
    requires.getResponseDictionary['/iniFile'](0, 0);
    requires.getResponseDictionary['/status'](0, 0);

    requires.putResponseDictionary['/keys']('0');
    requires.postResponseDictionary['/keys']('0');
    requires.getResponseDictionary['/keys']('0');
    requires.getResponseDictionary['/log']('0');
    requires.getResponseDictionary['/logDelta']('0');
    requires.getResponseDictionary['/status']('0');
    requires.getResponseDictionary['/configuration']('0');
    requires.getResponseDictionary['/iniFile']('0');
    requires.getResponseDictionary['/status']('0');

    requires.putResponseDictionary['/keys']('0', '0');
    requires.postResponseDictionary['/keys']('0', '0');
    requires.getResponseDictionary['/keys']('0', '0');
    requires.getResponseDictionary['/log']('0', '0');
    requires.getResponseDictionary['/logDelta']('0', '0');
    requires.getResponseDictionary['/status']('0', '0');
    requires.getResponseDictionary['/configuration']('0', '0');
    requires.getResponseDictionary['/iniFile']('0', '0');
    requires.getResponseDictionary['/status']('0', '0');

    function readMuch() {
        requires.getResponseDictionary['/keys'](['key1', 'key2', 'key3', 'key4', 'key5', 'key6', 'key7', 'key8']).then(function (result) {
            console.log(result.toString());
        });
        requires.getResponseDictionary['/keys'](['key10000']).then(function (result) {
            console.log(result.toString());
        });
        requires.getResponseDictionary['/log']().then(function (result) {
            console.log(result.toString());
        });
        requires.getResponseDictionary['/logDelta'](0).then(function (result) {
            console.log(result.toString());
        });
        requires.getResponseDictionary['/status']().then(function (result) {
            console.log(result.toString());
        });
        requires.getResponseDictionary['/configuration']().then(function (result) {
            console.log(result.toString());
        });
        requires.getResponseDictionary['/iniFile']().then(function (result) {
            console.log(result.toString());
        });
        setTimeout(function () {
            readMuch();
        }, 1);
    }

    readMuch();
    var i = 0;

    function writeMuch() {
        requires.putResponseDictionary['/keys'](['key1', 'key2', 'key3', 'key4', 'key5', 'key6', 'key7', 'key8'], [++i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7]);
        // requires.postResponseDictionary['/keys']('key' + i,i);
        setTimeout(function () {
            writeMuch();
        }, 1);
    }

    writeMuch();

})();
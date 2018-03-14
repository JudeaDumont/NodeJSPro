var redis = require('redis');
redisClient = redis.createClient();//127.0.0.1 and 6379 default
(function(){
    //Close to an Actual status message
    redisClient.hget("keys", "key8", function(err, reply){console.log(reply.toString());});

})();
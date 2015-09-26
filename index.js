// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;
    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for dying workers
    cluster.on('exit', function(worker) {
        // Replace the dead worker, we're not sentimental
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });

    // Code to run if we're in a worker process
} else {

    // Include Express
    var express = require('express');
    var path = require('path');
    var compression = require('compression')
        // Create a new Express application
    var app = express();
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(compression({
        filter: shouldCompress
    }))

    function shouldCompress(req, res) {
        if (req.headers['x-no-compression']) {
            // don't compress responses with this request header
            return false
        }
        // fallback to standard filter function
        return compression.filter(req, res)
    }
    app.get('/team45', function(request, response) {
        response.send("OLA Share");
    });
    app.get('/share', function(request, response) {
        response.jsonp({
            "success": true,
            "crn": ""
        })
    });
    app.get('/book', function(request, response) {
        //pickup_lat
        //pick_lng
        //drop_lat
        //drop_lng
        //X-APP-TOKEN
        //AUTHORIZATION
        var auth = req.headers['X-APP-TOKEN'];
        var auth = req.headers['Authorization'];
        //fire parse query and get rides going to same destinaton & starting point is within 3 kms.
        //on response fire ola request to get rides.
        //accumulate and fire response.
        response.jsonp({
            "rideOptions": [
                {
                    "rideId": "NT3f4eioqK",
                    "pickup": "Embassy Golf Links Business Park",
                    "desitination": "Knowlarity Communications",
                    "timeToYourPlace": "10 minute"
                },
                {
                    "id": "sedan",
                    "eta": 2,
                }
            ]           
        });
    });
    app.set('port', process.env.PORT || 80);
    app.listen(app.get('port'), function() {
        console.log("Node app is running at localhost:" + app.get('port'))
    });
}
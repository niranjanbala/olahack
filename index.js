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
    app.get('/book', function(request, response) {
        response.jsonp({
            "olaShare": [{
                "rideId": "NT3f4eioqK",
                "pickup": "Embassy Golf Links Business Park",
                "desitination": "Knowlarity Communications",
                "timeToYourPlace": "10 minute"
            }],
            "olaRide": {
                "categories": [{
                        "id": "sedan",
                        "display_name": "Sedan",
                        "currency": "INR",
                        "distance_unit": "kilometre",
                        "time_unit": "minute",
                        "eta": 2,
                        "distance": 0.0,
                        "image": "http://d1foexe15giopy.cloudfront.net/sedan.png",
                        "fare_breakup": [{
                                "type": "flat_rate",
                                "minimum_distance": "4",
                                "minimum_time": "10",
                                "base_fare": "100.0",
                                "cost_per_distance": "13",
                                "waiting_cost_per_minute": "0",
                                "ride_cost_per_minute": "1",
                                "surcharge": []
                            }

                        ]

                    }

                ],
                "ride_estimate": {}
            }
        });
    });
    app.set('port', process.env.PORT || 80);
    app.listen(app.get('port'), function() {
        console.log("Node app is running at localhost:" + app.get('port'))
    });
}
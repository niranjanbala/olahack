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
    app.get('/confirm', function(request, response) {
        var Parse = require('parse/node');
        var query = new Parse.Query(Parse.Installation);
        Parse.initialize("1PVc9kiXAOabkReQrVOBodTHI3OniukOSpBCRhdD", "OtgCfBLT5OhzlgUZxzNShHx46rcp1rpmdSNLDyje");
        //save in ride
        var query = new Parse.Query("Ride");
        query.equalTo("rideId", request.query.rideId);
        query.first({
            success: function(ride) {
                var ids = ride.get("sharedWithOlaUserIds");
                ids.push(request.query.sharingOlaUserId)
                if (ids.length == ride.get("availableSeats")) {
                    ride.set("shareOk", false);
                }
                ride.set("sharedWithOlaUserIds", ids);
                ride.save(null, {
                    success: function(userFilter) {
                        var confirmQuery = new Parse.Query(Parse.Installation);
                        Parse.Push.send({
                            where: confirmQuery,
                            data: {
                                alert: "Gokul has agreed to share the ride with you"
                            }
                        }, {
                            success: function() {
                                response.jsonp({
                                    success: true
                                });
                            },
                            error: function(error) {
                                response.jsonp({
                                    success: false,
                                    "message": error.message
                                });
                            }
                        });
                    },
                    error: function(userFilter, error) {
                        response.jsonp({
                            success: false,
                            "message": error.message
                        });
                    }
                });
            },
            error: function(error) {
                response.jsonp({
                    success: false,
                    "message": error.message
                });
            }
        });
    });
    app.get('/cancel', function(request, response) {
        var Parse = require('parse/node');
        var query = new Parse.Query(Parse.Installation);
        Parse.initialize("1PVc9kiXAOabkReQrVOBodTHI3OniukOSpBCRhdD", "OtgCfBLT5OhzlgUZxzNShHx46rcp1rpmdSNLDyje");
        Parse.Push.send({
            where: query,
            data: {
                alert: "Gokul has declined to share the ride with you"
            }
        }, {
            success: function() {
                response.jsonp({
                    success: true
                });
            },
            error: function(error) {
                response.jsonp({
                    success: false,
                    "message": error.message
                });
            }
        });
    });
    app.get('/share', function(request, response) {
        var Parse = require('parse/node');
        var query = new Parse.Query(Parse.Installation);
        Parse.initialize("1PVc9kiXAOabkReQrVOBodTHI3OniukOSpBCRhdD", "OtgCfBLT5OhzlgUZxzNShHx46rcp1rpmdSNLDyje");
        Parse.Push.send({
            where: query,
            data: {
                alert: "Rajesh has requested to share a ride with you",
                action: JSON.stringify({
                    "rideId": request.query.rideId,
                    "sharingOlaUserId": request.query.sharingOlaUserId,
                    "bookingOlaUserId": request.query.bookingOlaUserId
                })
            }
        }, {
            success: function() {
                response.jsonp({
                    success: true
                });
            },
            error: function(error) {
                response.jsonp({
                    success: false
                });
            }
        });
    });
    app.get('/book', function(request, response) {
        var pickup_lat = request.query.pickup_lat;
        var pickup_lng = request.query.pickup_lng;
        var drop_lat = request.query.drop_lat;
        var drop_lng = request.query.drop_lng;
        //X-APP-TOKEN
        //AUTHORIZATION
        //var auth = request.headers['X-APP-TOKEN'];
        //var auth = request.headers['Authorization'];
        //fire parse query and get rides going to same destinaton & starting point is within 3 kms.
        var Parse = require('parse/node');
        Parse.initialize("1PVc9kiXAOabkReQrVOBodTHI3OniukOSpBCRhdD", "OtgCfBLT5OhzlgUZxzNShHx46rcp1rpmdSNLDyje");
        var query = new Parse.Query("Ride");
        // Interested in locations near user.
        var point = new Parse.GeoPoint({
            latitude: Number(pickup_lat),
            longitude: Number(pickup_lng)
        });
        query.withinKilometers("pickupPoint", point, 3);
        query.equalTo("shareOk", true);
        query.equalTo("destinationLat", Number(drop_lat));
        query.equalTo("destinationLng", Number(drop_lng));
        query.limit(10);
        query.find({
            success: function(rideObjects) {
                var rideOptions = [];
                for (var i = 0; i < rideObjects.length; i++) {
                    var rideObject = rideObjects[i];
                    var rideInfo = rideObject.get("olaRideTrackInfo");
                    if (rideObject.get("sharedWithOlaUserIds").length < rideObject.get("availableSeats"))
                        rideOptions.push({
                            "rideId": rideObject.id,
                            "olaUserId": rideObject.get("olaUserId"),
                            "pickup": rideObject.get("pickupPoint"),
                            "desitinationLat": rideObject.get("destinationLat"),
                            "desitinationLng": rideObject.get("destinationLng"),
                            "timeToYourPlace": "10 minute",
                            "driver_name": rideInfo.driver_name,
                            "car_model": rideInfo.car_model,
                            "cab_number": rideInfo.cab_number
                        });
                }
                rideOptions.push({
                    "id": "sedan",
                    "eta": 2,
                });
                response.jsonp({
                    "rideOptions": rideOptions,
                });
            }
        });
    });
    app.set('port', process.env.PORT || 80);
    app.listen(app.get('port'), function() {
        console.log("Node app is running at localhost:" + app.get('port'))
    });
}
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
    cluster.on('exit', function (worker) {
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
    app.use(compression({filter : shouldCompress}))

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
    app.set('port', process.env.PORT || 80);
    app.listen(app.get('port'), function() {
      console.log("Node app is running at localhost:" + app.get('port'))
    });
}
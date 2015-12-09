var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var PredictiveServiceClient = require('dato-predictive-service-client');
    
    var end_point = "https://ping-test-ps-one-seven-five-1093788135.us-west-2.elb.amazonaws.com"
    var api_key = "3616490c-3d5a-4391-a261-5618339ccfb2"
    
    //var end_point = "http://localhost:9005"
    //var api_key = "api_key"

    var client = new PredictiveServiceClient(end_point,api_key);
    client.setShouldVerifyCertificate(false);
    console.log(client);
    var data = {'a':1,'b':2}
    var uuid = ""
    client.query('add', data, function(err, resp) {
        if (err != null) {
          throw new Error(err);          
        } else {
          console.log(resp.statusCode); // status code of the response
          console.log(resp.data); // response data

          var feedback_data = {'result':'correct'};
          client.feedback(resp.data.uuid, feedback_data, function(err, resp) {
            console.log(resp);
          });
        }
    });
    

    res.end("Thanks for contacting me!");
}).listen(3000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:3000/');

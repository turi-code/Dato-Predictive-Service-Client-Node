var fs = require('fs');
var ini = require('ini');
var http = require('http');
var https = require('https');
var util = require('util');

var PredictiveServiceClient = function(end_point, api_key, should_verify_certificate, config_file) {
  this.api_key = api_key;
  this.protocol = "";
  if (typeof should_verify_certificate != "boolean") {
    this.should_verify_certificate = false;
  } else {
    this.should_verify_certificate = should_verify_certificate;
  }
  if (config_file != null && typeof(config_file) == "string") {
    var config = ini.parse(fs.readFileSync(config_file, 'utf-8'));
    end_point = config['Service Info']['endpoint'];
    this.api_key = config['Service Info']['api key'];
    this.should_verify_certificate = config['Service Info']['verify certificate'];
  }
  var protocol_uri = this._getProtocolURI(end_point);
  this.end_point = protocol_uri["uri"];
  this.protocol = protocol_uri["protocol"];
  this.timeout = 10000; // default to 10 seconds timeout
  this.port = 80; // default port 80
  if (this.should_verify_certificate == true) {
    this.port = 443; // HTTPS
  }
}

PredictiveServiceClient.prototype.setShouldVerifyCertificate = function(verify) {
  this.should_verify_certificate = verify;
}
PredictiveServiceClient.prototype.setApikey = function(api_key) {
  this.api_key = api_key;
}
PredictiveServiceClient.prototype.setTimeout = function(timeout) {
  this.timeout = timeout;
}

PredictiveServiceClient.prototype.setEndpoint = function(end_point) {
  var protocol_uri = PredictiveServiceClient._getProtocol(end_point);
  if (protocol_uri["protocol"] == "HTTPS") {
    this.setShouldVerifyCertificate(true);
    this.port = 443;
  } else {
    this.setShouldVerifyCertificate(false);
    this.port = 80;
  }
  this.end_point = protocol_uri["uri"];
  this.protocol = protocol_uri["protocol"];
}

PredictiveServiceClient.prototype._getProtocolURI = function(end_point) {
  var mapping = {};
  if (end_point.toLowerCase().indexOf("http://") === 0) {
    mapping["protocol"] = "HTTP";
    mapping["uri"] = end_point.substring(7);
  } else if (end_point.toLowerCase().indexOf("https://") === 0) {
    mapping["protocol"] = "HTTPS";
    mapping["uri"] = end_point.substring(8);
  } else {
    throw new Error("Error: end_point " + end_point + " does not contain a protocol (HTTP/HTTPS).");
  }
  return mapping;
} 

PredictiveServiceClient.prototype.query = function(po_name, data, callback) {
  var postData = JSON.stringify({"api_key": this.api_key, "data": data});
  var options = {
    hostname: this.end_point,
    port: this.port,
    path: '/query/' + po_name,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };
  this._postRequest(postData, options, callback);
}

PredictiveServiceClient.prototype.feedback = function(request_id, data, callback) {
  var postData = JSON.stringify({"id": request_id, "api_key": this.api_key, "data": data});
  var options = {
    hostname: this.end_point,
    port: this.port,
    path: '/feedback',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };
  this._postRequest(postData, options, callback);
}

PredictiveServiceClient.prototype._postRequest = function(postData, options, callback) {
  var req = null;
  var status_code = null;
  var data = [];
  var process_resp = function(res) {
    status_code = res.statusCode;
    res.on('data', function(d) {
      data.push(d); // aggregate data
    }); 
    res.on('end', function() {
      var result = data.join(''); 
      var parsedResult = "";
      var error = null;
      try {
        parsedResult = JSON.parse(result); 
      } catch (err) {
        parsedResult = result; 
        error = err;
      }  
      var resp = {'statusCode': status_code, 'data': parsedResult};
      callback(error, resp);
    });
  };

  if (this.protocol == "HTTPS") {
    options.rejectUnauthorized = this.should_verify_certificate;
    req = https.request(options, process_resp); 
  } else {
    req = http.request(options, process_resp);
  } 
  req.on('error', function(e) {
    callback(e, null); 
  });
  // set timeout
  req.setTimeout(this.timeout);
  // write data to request body
  req.write(postData);
  req.end();
}

PredictiveServiceClient.prototype._getRequest = function(options, callback) {
  var req = null;
  var status_code = null;
  var data = [];
  var process_resp = function(res) {
    status_code = res.statusCode;
    res.on('data', function(d) {
      data.push(d); // aggregate data
    }); 
    res.on('end', function() {
      var result = data.join(''); 
      var parsedResult = "";
      var error = null;
      try {
        parsedResult = JSON.parse(result); 
      } catch (err) {
        parsedResult = result; 
        error = err;
      }  
      var resp = {'statusCode': status_code, 'data': parsedResult};
      callback(error, resp);
    });
  }.bind(this);

  if (this.protocol == "HTTPS") {
    options.rejectUnauthorized = this.should_verify_certificate;
    req = https.request(options, process_resp); 
  } else {
    req = http.request(options, process_resp);
  } 
  req.on('error', function(e) {
    callback(e, null); 
  });
  // set timeout
  req.setTimeout(this.timeout);
  req.end();
}

PredictiveServiceClient.prototype._initConnection = function() {
  var options = {
    hostname: this.end_point,
    port: 80,
    path: '/',
    method: 'GET',
  };

  this._getRequest(options, function(error, resp) {
    if (resp == null) {
      throw new Error(e);
    } else {
      if (resp.statusCode != 200) {
        throw new Error("Error connecting to Dato Predictive Service %s." % this.end_point);
      }
    }
  });
}

var Client = function(arg0, arg1, arg2) {
  if (!(this instanceof Client)) {
    // constructor without new
    var args = Array.prototype.slice.call(arguments);
    var client = Object.create(Client.prototype);
    return Client.apply(client, args);
  }

  var argsLen = arguments.length;
  if (argsLen === 2 && typeof arg0 === 'string' && typeof arg1 === 'string') {
    // has a valid end point and api key, defaulting verify SSL cert to false
    return new PredictiveServiceClient(arg0, arg1, null, null);
  } else if (argsLen === 3 && typeof arg0 === 'string' &&
      typeof arg1 === 'string' && typeof arg2 === 'boolean') {
    // has all three arguments valid
    return new PredictiveServiceClient(arg0, arg1, arg2, null);
  } else if (argsLen === 1 && typeof arg0 === 'string') {
    // loading from client config
    return new PredictiveServiceClient(null, null, null, arg0);
  } else {
    throw new Error("Error constructing Predictive Service Client. Please check your arguments.");
  }
}

module.exports = Client


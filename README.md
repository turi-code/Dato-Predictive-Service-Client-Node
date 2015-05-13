Dato-Predictive-Service-Client-Node
-----------------------------------

The purpose of the Dato Predictive Service Node.js Client is to allow Node.js applications to easily query Dato Predictive Services.

Installation
------------

To install Dato Predictive Service Python Client, simply install with:

```no-highlight
npm install PredictiveServiceClient
```

Requirements
------------

- Dato Predictive Service, launched by GraphLab-Create >= 1.4 installation

Usage
-----

#### Construct Client

To use the Dato Predictive Service Node.js Client, first you need to obtain the
following information from a running Dato Predictive Service:
* Predictive Service CNAME or DNS name (endpoint)
* API key from the Predictive Service

Once you have obtained the above information, simply construct the PredictiveServiceClient:
```js
var PredictiveServiceClient = require('PredictiveServiceClient');

var client = new PredictiveServiceClient("<endpoint>", "<api_key>", <should_verify_certificate>);
``` 

To enable SSL certificate verification for this Predictive Service, set 
``<should_verify_certificate>`` to **true**. However, if you Predictive Service
is launched with a self-signed certificate or without certificate, please set
``<should_verify_certificate>`` to **false**.

The PredictiveServiceClient can also be constructed from using a Predictive Service
[client configuration file](https://dato.com/products/create/docs/generated/graphlab.deploy.PredictiveService.save_client_config.html).
```js
var client = new PredictiveServiceClient(null, null, null, "path to config file");
```

#### Query

To query a model that is deployed on the Predictive Service. You will need:

* model name
* method to query (recommend, predict, query, etc.)
* data used to query against the model
* your callback function

For example, the code below demonstrates how to query a recommender model, named
``rec``, for recommendations for user ```Jacob Smith```:

```js
// construct data
var data = new Object();
data['users'] = ['Jacob Smith'];

// construct query
var request_data = {"method": "recommend", "data": data};

// query
client.query('rec', request_data, function(err, resp) {
  console.log(resp.statusCode); // status code of the response
  console.log(resp.data); // response data
});
```

** Notes **

- Different models could support different query methods (recommend, predict, query, etc.)
  and different syntax and format for **data**. For now, you will need to know the
  supported methods and query data format before querying the model.


#### Set timeout

To change the request timeout when querying the Predictive Service, use the following:

```js
client.setTimeout(500); // 500ms
```

The default timeout is 10 seconds.


#### Results

If query is successful, the response data contains the following:

* model response
* uuid for this query
* version of the model


```js
client.query('rec', request_data, function(err, resp) {
  console.log(resp.statusCode); // status code of the response
  console.log(resp.data); // response data

  // parse respose data
  var model_response = resp.data.response;
  var uuid = resp.data.uuid;
  var version = resp.data.version;
});
```

``model_response`` contains the actual model output from your query.

#### Send feedback

Once you get the query result, you can submit feedback data corresponding to this query
back to the Predictive Service. This feedback data can be used for evaluating your
current model and training future models.

To submit feedbacks data corresponding to a particular query, you will need the UUID
of the query. The UUID can be easily obtained from the response data.

```js
client.query('rec', request_data, function(err, resp) {
  // parse respose data
  var model_response = resp.data.response;
  var uuid = resp.data.uuid; //uuid
});
```

For the feedback data, you can use any attributes or value pairs that you like.

Example: 
```js
feedback_data = new Object();
feedback_data["searched_terms"] = "acoommodations";
feedback_data["num_of_clicks"] = 3;
```
Now we can send this feedback data to the Predictive
Service to associate this feedback with this particular query.

```js
client.feedback(uuid, feedback_data, function(err, resp) {
  console.log(resp);
});
```

More Info
---------

For more information about the Dato Predictive Service, please read
the [API docs](https://dato.com/products/create/docs/generated/graphlab.deploy.PredictiveService.html)
and [userguide](https://dato.com/learn/userguide/deployment/pred-getting-started.html).

License
-------

The Dato Predictive Service Node.js Client is provided under the 3-clause BSD [license](LICENSE).

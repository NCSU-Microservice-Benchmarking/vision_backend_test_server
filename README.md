# vision_backend_test_server

## Run with Docker
1. Build the docker image
```
docker build -t vision_backend_test_server .
```
2. Run the docker image
```
docker run -d -p 8001:8001 vision_backend_test_server -n vision_backend_test_server
```

## Run locally
1. Install dependencies
```
npm install
```
2. Run the server
```
node app.js
```

## Test
1. Send a request to the server with the following format
```
http://" + test_server_ip + ":" + test_server_port + "/tests?task=" + task + "&port=" + self_port + "&api=" + api
```
Here you need to specify the following three parameters:
- task: the task you want to test, with the following options
    - detection
    - segmentation
    - inpainting
- port: the port of the server you want to test
- api: the api you want to test (e.g. detections)
2. Upon receiving the request, the test server will send one or two PNG images encapsulated with multipart/form-data to the ip address where the request comes from with the specified port and api.
3. If the server receives a response, it will check the correctness of the response and return code 200 if the response is correct, otherwise it will return code 400.

## A flask example
```
@app.route('/test')
def test():
    test_server_ip = request.args.get('test_server_ip')
    test_server_port = request.args.get('test_server_port')
    task = request.args.get('task')
    self_port = request.args.get('self_port')
    api = request.args.get('api')
    print("test server ip: " + test_server_ip)
    print("test server port: " + test_server_port)
    print("task: " + task)
    print("self port: " + self_port)
    print("api: " + api)
    # send a post request to the test server
    # with args "task" to note the task it is performing, "port" of the it is running on, and "api" to specify the api to test
    url = "http://" + test_server_ip + ":" + test_server_port + "/tests?task=" + task + "&port=" + self_port + "&api=" + api
    print("request url: " + url)
    # send the request
    response = requests.post(url)
    # check the response
    if response.status_code == 200:
        return "Test successful"
    else:
        return "Test failed"
```



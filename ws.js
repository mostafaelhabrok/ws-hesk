var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
const port = process.env.PORT || 8080
server.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port '+port);
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  return true;
}

var connections = {hesk:[],task:[],comp:[]};
var users = {hesk:[],task:[],comp:[]};

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) { 

        if (message.type === 'utf8') {
            var data = JSON.parse(message.utf8Data);
            if(data) var user = data.user;
            if(user)
            {
                if(users[data.domain].includes(user))
                {
                    var i = users[data.domain].findIndex(element => element == user);
                    users[data.domain].splice(i,1);
                    connections[data.domain].splice(i,1);
                }
                users[data.domain].push(user);
                connections[data.domain].push(connection);
            }
            if(data.to)
            {
                for (let i = 0; i < users[data.domain].length; i++) {
                    for (let k = 0; k < data.to.length; k++) {
                        if(users[data.domain][i] == data.to[k])
                        {
                            var obj = {title:data.title,description:data.description,from:data.from};
                            connections[data.domain][i].sendUTF(JSON.stringify(obj));
                        }
                    }
                }
            }
            console.log("Users IN " + data.domain , users[data.domain].length);
            console.log("Connections IN " + data.domain , connections[data.domain].length);
            console.log('Received Message: ' + message.utf8Data);
        }

    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

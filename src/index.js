let dgram = require('dgram');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

let PORT = 8889;
let HOST = '192.168.10.1';


let client = dgram.createSocket('udp4');
client.addListener("message", (buf) => {
    console.log(`Received: ${buf}`);
});

let line = "null";

function command() {
    readline.question('Enter a command: ', (cmd) => {
        line = cmd;
        let message = new Buffer.from(cmd);
        
        if(cmd == "exit")
            return;

        client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
           if (err) throw err;
           console.log('UDP message sent to ' + HOST +':'+ PORT);
           command();
        });
    })
}

command();

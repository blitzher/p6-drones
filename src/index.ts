/* Import nodejs packages */
import * as fs from "fs";
import * as path from "path";

/* Import npm packages */
import express from "express";
import sdk from "tellojs";
import expressWs from "express-ws"
import { v4 as uuidv4 } from 'uuid';
import {WebSocket} from "ws";



/* Global constant */
const PORT = 42069;

/* Initialise HTTP and websocket server */
const {app} = expressWs(express());
type UWebSocket = {client: WebSocket, uuid:string};
const clients : UWebSocket[] = [];

/* Setup web server */
app.use(express.json());
app.use(express.static("./src/www"));



/* Setup helper functions for back-front-communication */
const com = {
    video : (ws : WebSocket, buffer : Buffer) => {

        const dataArray = Array.from(buffer);

        ws.send(JSON.stringify({
            type: "stream",
            data: dataArray
        }))
    }
}

/* Setup drone connection */
const drone = {
    connected: false,
    videoData: (data) => {
        for (let {client} of clients) {
            com.video(client, data);
        }
    }
}
async function droneControl() {
    await sdk.control.connect();
    drone.connected = true;

    console.log(`Drone connection established`);
    

    const videoEmitter = await sdk.receiver.video.bind();
    let isFirst = true;
    videoEmitter.on('message', (res) => {

        if (isFirst)
            {console.log();}
            
        drone.videoData(res);
    });
};

app.ws("/", (ws) => {
    const myUuid = uuidv4();
    clients.push({client: ws, uuid:myUuid})
    console.log("New client!");

    ws.onmessage = (msg) => {
        console.log(`Received: ${msg.data}`);
    };

    ws.onclose = () => {
        console.log("Client closed!");
        
        for(let i = 0; i < clients.length; i++) {
            const {uuid} = clients[i];
            if (uuid == myUuid) {
                clients.splice(i, 1);
            }   
        }
    };
})

/* Launch server */
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
    console.log(`Connecting to drone...`);
    droneControl();
    
})
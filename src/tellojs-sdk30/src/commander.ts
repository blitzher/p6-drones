import EventEmitter from "events";
import * as constants from "./constants.json";
import { IP } from "./index";
import logger from "../../log";
import { Socket, SocketState } from "./socket";
import { Subcommander } from "./subcommander";
import { Drone } from "./drone";

export type CommandOptions = {
    timeout?: number;
    shouldReject?: boolean;
    shouldRetry?: boolean;
    overwriteQueue?: boolean;
};
export type Command = { argument: string; destination: IP; reject: (reason: string) => void; options: CommandOptions };

export class Commander {
    private socket = new Socket();

    private subcommanders: { [key: string]: Subcommander } = {};

    constructor() {
        this.socket.on("message", (buf, rinfo) => {
            const message = buf.toString().trim();

            logger.info(`Commander received '${message}':'${rinfo.address}'`);
            this.subcommanders[rinfo.address].receive(message);
        });
        /* Bind socket to send/receive port */
        this.socket.bind({ port: constants.client.port });
    }

    /**
     *
     * @param command Command to send
     * @param ip The destination IP address
     * @returns
     */
    async send(command: string, ip: IP, options?: CommandOptions): Promise<string> {
        /* Find existing subcommander or create a new one */
        if (!this.subcommanders[ip]) this.subcommanders[ip] = new Subcommander(this);
        const subcommander = this.subcommanders[ip];
        return subcommander.enqueue(command, ip, options || {});
    }

    public relayConnected(drone: Drone) {
        this.subcommanders[drone.ip].connected = drone.connected;
    }

    dispatch(command: Command) {
        if (this.socket.socketState == SocketState.CLOSED) {
            logger.error("Dispatching to closed socket.");
        }

        /* logger.info(`Dispatching [${command.argument}, ${command.destination}]`); */
        if (this.socket.socketState == SocketState.OPEN) {
            logger.info(`Dispatching '${command.argument}' to '${command.destination}'`);
            this.socket.send(command.argument, constants.client.port, command.destination);
        }
    }
}

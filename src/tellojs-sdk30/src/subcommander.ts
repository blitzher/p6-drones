import EventEmitter from "events";
import { Command, CommandOptions, Commander } from "./commander";
import { IP } from ".";
import * as constants from "./constants.json";
import logger from "../../log";

export class Subcommander {
    private commandQueue: Command[] = [];
    private rejectTimeout: NodeJS.Timeout | undefined;
    private callbackFunction?: (response: string) => any;
    private emitter: EventEmitter = new EventEmitter();
    private busy: boolean = false;

    public connected: boolean;
    private commanderRef: Commander;

    private expectedResponse?: string;

    constructor(commanderRef: Commander) {
        this.commanderRef = commanderRef;
        this.connected = false;

        this.emitter.addListener("ready", () => {
            if (this.commandQueue.length > 0) this.dispatch();
            else this.busy = false;
        });

        this.emitter.addListener("message", (msg: Command) => {
            if (!this.busy) this.dispatch();
        });
    }

    public close() {
        this.commandQueue = [];
        clearTimeout(this.rejectTimeout);
    }

    public receive(message: string) {
        if (this.callbackFunction) {
            this.callbackFunction(message);
            this.callbackFunction = undefined;
        }
        /* Clear the timeout  */
        if (this.expectedResponse != undefined) {
            if (message == this.expectedResponse) {
                clearTimeout(this.rejectTimeout);
                this.emitter.emit("ready");
            }
        } else {
            clearTimeout(this.rejectTimeout);
            this.emitter.emit("ready");
        }
    }

    public async enqueue(command: string, ip: IP, options: CommandOptions) {
        return new Promise<string>(async (resolve, reject) => {
            const cmd = { argument: command, destination: ip, reject, options };

            if (options.forceReady) this.busy = false;

            if (options.clearQueue) {
                this.commandQueue = [cmd];
            } else if (options.overwriteQueue) {
                this.commandQueue.splice(0, 0, cmd);
            } else {
                this.commandQueue.push(cmd);
            }

            this.callbackFunction = resolve;
            this.emitter.emit("message", cmd);
        });
    }

    public dispatch() {
        const command = this.commandQueue.shift();

        if (!command) {
            this.busy = false;
            return;
        }

        this.busy = true;
        this.expectedResponse = command.options.expectedResponse;
        this.commanderRef.dispatch(command);

        if (command.options.timeout) {
            this.rejectTimeout = setTimeout(() => {
                if (command.options.shouldReject)
                    command.reject("No response from drone");
                logger.error(
                    `No response from drone @'${command.destination}' on '${command.argument}'. Returning to ready state`
                );
                if (command.options.shouldRetry) this.commandQueue.unshift(command);
                this.emitter.emit("ready");
            }, command.options.timeout);
        }
    }
}

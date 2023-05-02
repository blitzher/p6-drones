import * as fs from "fs";
import path from "path";

const GetDateFormat = () => {
    const d = new Date();

    const MM = d.getMonth().toString().padStart(2, "0");
    const DD = d.getDate().toString().padStart(2, "0");
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${MM}-${DD}-${hh}${mm}`;
};

type LoggerOptions = {
    filename?: string;
    folder?: string;
    extention?: string;
};

class Logger {
    private logBuffer: string[] = [];
    private incrementals: { [key: string]: number } = {};
    private concurrents: { [key: string]: string } = {};
    private stats: string[] = [];
    private startTime = new Date().getTime();

    private writeInterval: NodeJS.Timer;

    private _folder = "logs";
    private _extention = ".log";
    private _filename = `drone-flight-${GetDateFormat()}`;

    private get path() {
        return path.join(this._folder, `${this._filename}.${this._extention}`);
    }

    constructor(options?: LoggerOptions) {
        if (!options) options = {};
        if (options.folder) this._folder = options.folder;
        if (options.extention) this._extention = options.extention;
        if (options.filename) this._filename = options.filename;

        try {
            const folder = fs.statSync(this._folder);
            if (!folder.isDirectory()) throw new Error();
        } catch (e) {
            this.stat(`${this._folder} does not exists, making directory.`);
            fs.mkdirSync(this._folder, { recursive: true });
        }
        this.writeInterval = setInterval(() => {
            this.serialize();
        }, 1000);
    }

    /**
     * Clear the write interval.
     */
    public close() {
        clearInterval(this.writeInterval);
    }

    get file() {
        return this.path;
    }

    /**
     * Placed in 1st section of log, and counts each time its key is called
     * @param argument The name of the incremental value
     * @param count Optional value, default is 1
     */
    increment(argument: string, count?: number) {
        if (this.incrementals[argument]) {
            this.incrementals[argument] += count || 1;
        } else this.incrementals[argument] = count || 1;
    }

    /**
     * Prepending `[c]` to the argument.
     * Placed in 2nd section of log, and overwrites previous value at key.
     * Use for values that are constantly updated, and viewed concurrently.
     * @param key The key of the concurrent log
     * @param value The current value
     */
    concurrent(key: string, value: string) {
        this.concurrents[key] = this.format("c", `${key}: ${value}`);
    }

    /**
     * Prepending `[-]` to argument.
     * Placed in 3rd section of log.
     * Use for informative message regarding state of the system.
     * @param argument
     */
    info(argument: string) {
        this.logBuffer.push(this.format("-", argument));
    }

    /**
     * Prepending `[?]` to argument.
     * Placed in 3rd section of log.
     * Use for logs, progress and more.
     * @param argument
     */
    log(argument: string) {
        this.logBuffer.push(this.format("?", argument));
    }

    /**
     * Prepending `[!]` to argument.
     * * Placed in 3rd section of log.
     * Use for errors or invalid arguments in the program
     * or otherwise terminating instances.
     * @param argument
     */
    error(argument: string) {
        this.logBuffer.push(this.format("!", argument));
    }

    /**
     * Prepending `[.] to argument`.
     * Placed in 2nd section.
     * Use sparingly for one-time calls such as listening or connection events.
     * @param argument
     */
    stat(argument: string) {
        this.stats.push(this.format(".", argument));
    }

    private serialize() {
        let data = `${Object.entries(this.incrementals)
            .map(([key, value]) => {
                return `[#] ${key} : ${value}`;
            })
            .join("\n")}
------------------------------
${this.stats.join("\n")}
${Object.entries(this.concurrents)
    .map(([k, v]) => `${v}`)
    .join("\n")}
------------------------------
${this.logBuffer.join("\n")}`;

        /* Write file to disk */
        fs.writeFile(this.path, data, () => {});
    }

    private dt() {
        let delta = new Date().getTime() - this.startTime;
        const ms = delta % 1000;
        delta = Math.floor((delta - ms) / 1000);
        const s = delta % 60;
        delta = Math.floor((delta - s) / 60);
        const m = delta;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    private format(prepend: string, argument: string) {
        return `[${prepend}] (${this.dt()}) ${argument}`;
    }
}

const logger = new Logger();
export default logger;

import * as fs from "fs";
import * as os from "os";

const GetDateFormat = () => {
    const d = new Date();

    const MM = d.getMonth().toString().padStart(2, "0");
    const DD = d.getDate().toString().padStart(2, "0");
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${MM}-${DD}-${hh}${mm}`;
};

class Logger {
    private logBuffer: string[] = [];
    private incrementals: { [key: string]: number } = {};
    private concurrents: { [key: string]: string } = {};
    private stats: string[] = [];
    private startTime = new Date().getTime();

    private _folder = "logs";
    private _file = `${this._folder}/drone-flight-${GetDateFormat()}.log`;

    constructor(filename?: string) {
        if (filename) this._file = filename;

        try {
            const folder = fs.statSync(this._folder);
            if (!folder.isDirectory()) throw new Error();
        } catch (e) {
            this.stat(`${this._folder} does not exists, making directory.`);
            fs.mkdirSync(this._folder);
        }
        setInterval(() => {
            this.serialize();
        }, 1000);
    }

    get file() {
        return this._file;
    }

    increment(argument: string, count?: number) {
        if (this.incrementals[argument]) {
            this.incrementals[argument] += count || 1;
        } else this.incrementals[argument] = count || 1;
    }

    concurrent(key: string, value: string) {
        this.concurrents[key] = this.format("c", `${key}: ${value}`);
    }

    /**
     * Prepending [-] to argument.
     * Use for informative message regarding state.
     * @param argument
     */
    info(argument: string) {
        this.logBuffer.push(this.format("-", argument));
    }

    /**
     * Prepending [?] to argument.
     * Use for logs, progress and such.
     * @param argument
     */
    log(argument: string) {
        this.logBuffer.push(this.format("?", argument));
    }

    /**
     * Prepending [!] to argument.
     * Use for errors or invalid arguments in the program
     * @param argument
     */
    error(argument: string) {
        this.logBuffer.push(this.format("!", argument));
    }

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
        fs.writeFile(this._file, data, () => {});
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

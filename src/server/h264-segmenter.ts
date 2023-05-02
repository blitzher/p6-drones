import logger from "../log";
import * as constants from "./constants.json";

type h264segment = Uint8Array;
type partialh264segment = Uint8Array;

/**
 * Helper class for segmenting h264 segments correctly,
 * as the tello drone doesn't bother, and JMuxer struggles.
 */
export class H264Segmenter {
    private breaker_segment: number[] = [0, 0, 0, 1];
    private buffer: number[] = [];
    private bitrateEstimate: number = 0;
    private estimatingBitrate = false;
    private awaitingFirst = true;

    constructor() {}

    feed(segment: partialh264segment): void | h264segment {
        if (this.awaitingFirst) {
            this.awaitingFirst = false;
            this.estimatingBitrate = true;
            setTimeout(() => {
                this.estimatingBitrate = false;

                const bitsPerMS =
                    this.bitrateEstimate / constants.server.BITRATE_TIMESAMPLE_MS;
                const bitsPerS = bitsPerMS * 1000;
                const MbitsPerS = bitsPerS / 10e6;

                logger.stat(`Estimated bitrate: ${MbitsPerS}Mb/s`);
            }, constants.server.BITRATE_TIMESAMPLE_MS);
        }

        if (this.estimatingBitrate) this.bitrateEstimate += segment.length * 8;

        const prePushLength = this.buffer.length;
        for (let i = 0; i < segment.length; i++) this.buffer.push(segment[i]);

        if (
            segment[0] == this.breaker_segment[0] &&
            segment[1] == this.breaker_segment[1] &&
            segment[2] == this.breaker_segment[2] &&
            segment[3] == this.breaker_segment[3]
        ) {
            return Uint8Array.from(this.buffer.splice(0, prePushLength));
        }
    }
}

import logger from "../log";
import * as constants from "./constants.json";

type h264segment = Uint8Array;

/**
 * Helper class for segmenting h264 segments correctly,
 * as the tello drone doesn't bother, and JMuxer struggles.
 */
export class H264Segmenter {
    private breaker_segment: number[] = [0, 0, 0, 1];
    private buffer: number[] = [];
    private bitrateEstimate: number;
    private estimatingBitrate;

    constructor() {
        this.estimatingBitrate = true;
        this.bitrateEstimate = 0;
        setTimeout(() => {
            this.estimatingBitrate = false;
            logger.stat(
                `Estimated Mbitrate: ${
                    this.bitrateEstimate / constants.server.BITRATE_TIMESAMPLE_MS
                }Mb/s`
            );
        }, constants.server.BITRATE_TIMESAMPLE_MS);
    }

    feed(segment: h264segment): void | h264segment {
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

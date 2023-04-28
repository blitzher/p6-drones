import logger from "../log";

type h264segment = Uint8Array;

/**
 * Helper class for segmenting h264 segments correctly,
 * as the tello drone doesn't bother, and JMuxer struggles.
 */
export class H264Segmenter {
    private breaker_segment: number[] = [0, 0, 0, 1];
    private buffer: number[] = [];

    feed(segment: h264segment): void | h264segment {
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

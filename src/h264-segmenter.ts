type h264segment = Uint8Array;

/**
 * Helper class for segmenting h264 segments correctly,
 * as the tello drone doesn't bother.
 */
export class H264Segmenter {
    breaker_segment: number[] = [0, 0, 0, 1];
    buffer: number[] = [];
    bitrateEstimate: number;

    constructor(segment: h264segment) {
        this.bitrateEstimate = 0;
        setTimeout(() => {
            console.log(`Estimated Mbitrate: ${this.bitrateEstimate / 10e7}`);
        }, 10000);
    }

    feed(segment: h264segment): void | h264segment {
        this.bitrateEstimate += segment.length * 8;

        const prePushLength = this.buffer.length;
        for (let i = 0; i < segment.length; i++) this.buffer.push(segment[i]);

        for (let i = 0; i < segment.length - 2; i++) {
            if (
                segment[i] == this.breaker_segment[0] &&
                segment[i + 1] == this.breaker_segment[1] &&
                segment[i + 2] == this.breaker_segment[2] &&
                segment[i + 3] == this.breaker_segment[3]
            ) {
                return Uint8Array.from(this.buffer.splice(0, prePushLength));
            }
        }
    }
}

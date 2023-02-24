"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.H264Segmenter = void 0;
/**
 * Helper class for segmenting h264 segments correctly,
 * as the tello drone doesn't bother.
 */
var H264Segmenter = /** @class */ (function () {
    function H264Segmenter(segment) {
        this.breaker_segment = [0, 0, 0, 1];
        this.buffer = [];
    }
    H264Segmenter.prototype.feed = function (segment) {
        var prePushLength = this.buffer.length;
        for (var i = 0; i < segment.length; i++)
            this.buffer.push(segment[i]);
        for (var i = 0; i < segment.length - 2; i++) {
            if (segment[i] == this.breaker_segment[0] &&
                segment[i + 1] == this.breaker_segment[1] &&
                segment[i + 2] == this.breaker_segment[2] &&
                segment[i + 3] == this.breaker_segment[3]) {
                return Uint8Array.from(this.buffer.splice(0, prePushLength));
            }
        }
    };
    return H264Segmenter;
}());
exports.H264Segmenter = H264Segmenter;
//# sourceMappingURL=h264-segmenter.js.map
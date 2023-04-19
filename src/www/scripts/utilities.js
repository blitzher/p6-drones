const $ = (q) => document.querySelector(q);

class Vector3 {
    x;
    y;
    z;

    constructor({ x, y, z }) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add({ x, y, z }) {
        return new Vector3({ x: this.x + x, y: this.y + y, z: +this.z + z });
    }

    scale(amount) {
        return new Vector3({
            x: this.x * amount,
            y: this.y * amount,
            z: this.z * amount,
        });
    }

    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    normalise() {
        const l = this.length();
        return new Vector3({ x: this.x / l, y: this.y / l, z: this.z / l });
    }

    serialize() {
        return JSON.stringify({
            x: this.x,
            y: this.y,
            z: this.z,
        });
    }
}

const linInterp = (v, a, b, c, d) => ((v - a) / (b - a)) * (d - c) + c;
const linInterp2d = ({ x, y }, a, b, c, d) => {
    return {
        x: linInterp(x, a, b, c, d),
        y: linInterp(y, a, b, c, d),
    };
    4;
};

const linInterpCanvas = ({ x, y }, orig, dest) => {
    return {
        x: linInterp(x, 0, orig.width, 0, dest.width),
        y: linInterp(y, 0, orig.height, 0, dest.height),
    };
};

/**
 *
 * @param {*} param0
 * @param {number} phi Angle in degrees
 * @returns {Vector3}
 */
const rotateVectorAroundXAxis = ({ x, y, z }, phi) => {
    phi = (phi / 180) * Math.PI;
    const rotationMatrix = [
        [1, 0, 0],
        [0, Math.cos(phi), -Math.sin(phi)],
        [0, Math.sin(phi), Math.cos(phi)],
    ];

    return new Vector3({
        x,
        y: rotationMatrix[1][1] * y + rotationMatrix[1][2] * z,
        z: rotationMatrix[2][1] * y + rotationMatrix[2][2] * z,
    });
};

/**
 *
 * @param {*} param0
 * @param {number} phi Angle in degrees
 * @returns {Vector3}
 */
const rotateVectorAroundYAxis = ({ x, y, z }, phi) => {
    phi = (phi / 180) * Math.PI;
    const rotationMatrix = [
        [Math.cos(phi), 0, Math.sin(phi)],
        [0, 1, 0],
        [-Math.sin(phi), 0, Math.cos(phi)],
    ];

    return new Vector3({
        x: rotationMatrix[0][0] * x + rotationMatrix[0][2] * z,
        y,
        z: rotationMatrix[2][0] * x + rotationMatrix[2][2] * z,
    });
};

const cookie = JSON.parse(document.cookie || "{}");
const writeCookie = () => {
    document.cookie = JSON.stringify(cookie);
};

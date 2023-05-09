export class Vector3 {
    x: number;
    y: number;
    z: number;

    constructor({ x, y, z }: { x: number; y: number; z: number }) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add({ x, y, z }: { x: number; y: number; z: number }): Vector3 {
        return new Vector3({ x: this.x + x, y: this.y + y, z: +this.z + z });
    }

    scale(amount: number) {
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

    subtract({ x, y, z }: { x: number; y: number; z: number }): Vector3 {
        return new Vector3({ x: this.x - x, y: this.y - y, z: +this.z - z });
    }

    lengthToBox({ x, y, z }: { x: number; y: number; z: number }): number {
        return this.subtract({ x, y, z }).length();
    }

    crossProduct({ x, y, z }: { x: number; y: number; z: number }): Vector3 {
        return new Vector3({
            x: this.y * z - this.z * y,
            y: this.z * x - this.x * z,
            z: this.x * y - this.y * x,
        });
    }

    dotP({ x, y, z }: { x: number; y: number; z: number }): number {
        return this.x * x + this.y * y + this.z * z;
    }
}

/**
 *
 * @param vector
 * @param phi Angle in degrees
 * @returns
 */
export const rotateVectorAroundZAxis = (vector: Vector3, phi: number) => {
    phi = (phi / 180) * Math.PI;
    const rotationMatrix = [
        [Math.cos(phi), -Math.sin(phi), 0],
        [Math.sin(phi), Math.cos(phi), 0],
        [0, 0, 1],
    ];

    return new Vector3({
        x: rotationMatrix[0][0] * vector.x + rotationMatrix[0][1] * vector.y,
        y: rotationMatrix[1][0] * vector.x + rotationMatrix[1][1] * vector.y,
        z: vector.z,
    });
};

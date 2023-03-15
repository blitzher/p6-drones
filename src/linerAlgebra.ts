export class Vector3 {
    x: number;
    y: number;
    z: number;

    constructor({ x, y, z }: { x: number; y: number; z: number }) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add({ x, y, z }) {
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
}

const $ = (q) => document.querySelector(q);

const linInterp = (v, a, b, c, d) => ((v - a) / (b - a)) * (d - c) + c;

const rotateVectorAroundYAxis = ({ x, y, z }, phi) => {
    const rotationMatrix = [
        [Math.cos(phi), 0, Math.sin(phi)],
        [0, 1, 0],
        [-Math.sin(phi), 0, Math.cos(phi)],
    ];

    return {
        x: rotationMatrix[0][0] * x + rotationMatrix[0][2] * z,
        y,
        z: rotationMatrix[2][0] * x + rotationMatrix[2][2] * z,
    };
};

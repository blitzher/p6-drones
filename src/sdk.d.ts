import { Socket } from "dgram";
import EventEmitter from "events";

type Position3D = { x: number; y: number; z: number };

/**
 * Custom typedefinitions of typeless library
 */
type SDK = {
    control: {
        connect: () => Promise<void>;
        takeOff: () => Promise<void>;
        land: () => Promise<void>;
        emergency: () => Promise<void>;
        stop: () => Promise<void>;
        go: (end: Position3D, speed: number) => Promise<void>;
        curve(start: Position3D, end: Position3D, speed: number);
        move: {
            up: (cm: number) => Promise<void>;
            down: (cm: number) => Promise<void>;
            left: (cm: number) => Promise<void>;
            right: (cm: number) => Promise<void>;
            back: (cm: number) => Promise<void>;
            front: (cm: number) => Promise<void>;
        };
        rotate: {
            clockwise: (angle: number) => Promise<void>;
            counterClockwise: (angle: number) => Promise<void>;
        };
        flip: {
            left: () => Promise<void>;
            right: () => Promise<void>;
            front: () => Promise<void>;
            back: () => Promise<void>;
        };
        command: (cmd: string) => Promise<void>;
    };
    read: {
        speed: () => Promise<string>;
        battery: () => Promise<string>;
        time: () => Promise<string>;
        wifi: () => Promise<string>;
        height: () => Promise<string>;
        temperature: () => Promise<string>;
        attitude: () => Promise<string>;
        barometer: () => Promise<string>;
        tof: () => Promise<string>;
        acceleration: () => Promise<string>;
        sdk: () => Promise<string>;
    };
    set: {
        speed: (speed: number) => Promise<void>;
        rc: (x: number, y: number, z: number, yaw: number) => Promise<void>;
        wifi: (ssid: string, password: string) => Promise<void>;
    };
    receiver: {
        state: {
            bind: () => EventEmitter;
            close: () => void;
        };
        video: {
            bind: () => Promise<EventEmitter>;
            close: () => Promise<void>;
        };
    };
};

import * as dgram from "dgram";
import { Commander } from "./commander";
import { Drone } from "./drone";
import { VirtualDrone } from "./virtual-drone";
import { StateInfo as _StateInfo } from "./streams/streams";

export type IP = string;
export type Port = number;
export type StateInfo = _StateInfo;

export const commander = new Commander();
export const close = () => {
    commander.close();
    for (let drone of Drone._allDrones) drone.close();
};

export default {
    Drone,
    VirtualDrone,
    commander,
    close,
};

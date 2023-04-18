import * as dgram from "dgram";
import { Commander } from "./commander";
import { Drone } from "./drone";
import { StateInfo as _StateInfo } from "./commands/streams";

export type IP = string;
export type Port = number;
export type StateInfo = _StateInfo;

export const commander = new Commander();

export default {
    Drone,
    commander,
};

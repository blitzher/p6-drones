import sdk from "../tellojs-sdk30";
import { environment, drone } from "./environment";

function Avoid() {
    environment.objects.forEach((obstacle) => {
        if (drone.collidesWith(obstacle) || environment.outsideBoundary(drone)) {
            console.log(`Collision detected with: ${obstacle}`);
        }
    });
}

export default {};

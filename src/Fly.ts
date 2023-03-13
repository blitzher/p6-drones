import { sdk } from "tellojs-sdk30";
import environment from "./environment";

function Avoid() {
    environment.testEnvironment.environment.forEach((obstacle) => {
        if (
            environment.drone.collidesWith(obstacle) ||
            environment.testEnvironment.OutsideBoundary
        ) {
            console.log(`Collision detected with: ${obstacle}`);
        }
    });
}

export default {};

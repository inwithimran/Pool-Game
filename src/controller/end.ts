import { Controller } from "./controller"
import { AimEvent } from "../events/aimevent"
import { AbortEvent } from "../events/abortevent"

export class End extends Controller {

    advance(t: number): void {
        console.log(t)
    }

    handleAim(event: AimEvent): Controller {
        console.log("handling "+event)
        return this
    }

    handleAbort(event: AbortEvent): Controller {
        console.log("ignoring "+event)
        return this
    }
}

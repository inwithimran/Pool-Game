import { HitEvent } from "../events/hitevent"
import { ControllerBase } from "./controllerbase"
import { AimEvent } from "../events/aimevent"
import { Controller, Input } from "./controller"
import { BreakEvent } from "../events/breakevent"
import { Aim } from "./aim"

export class Replay extends ControllerBase {
  delay: number
  shots: AimEvent[]
  timer
  init
  constructor(container, init, shots, delay = 1500) {
    super(container)
    this.init = init
    this.shots = [...shots]
    this.delay = delay
    this.container.table.showTraces(true)
  }

  override onFirst() {
    this.container.table.updateFromShortSerialised(this.init)
    this.playNextShot(this.delay * 1.5)
  }

  playNextShot(delay) {
    const shot = this.shots.shift()
    const aim = AimEvent.fromJson(shot)
    this.container.table.cueball = this.container.table.balls[aim.i]
    this.container.table.cueball.pos.copy(aim.pos)
    this.container.table.cue.aim = aim
    this.container.table.cue.updateAimInput()
    this.container.table.cue.t = 1
    this.container.view.camera.forceMode(this.container.view.camera.topView)
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.container.eventQueue.push(new HitEvent(this.container.table.cue.aim))
    }, delay)
  }

  override handleHit(_: HitEvent) {
    this.hit()
    return this
  }

  override handleStationary(_) {
    if (this.shots.length > 0) {
      setTimeout(() => {
        this.playNextShot(this.delay)
      }, this.delay)
    }

    return this
  }

  override handleInput(input: Input): Controller {
    if (input.key == "KeyOUp") {
      this.container.view.camera.toggleMode()
    }
    if (input.key == "KeyDUp") {
      this.container.sliders.toggleVisibility()
    }
    if (input.key == "KeyRUp") {
      return this.retry()
    }
    if (input.key == "KeyXUp") {
      this.halt()
    }

    return this
  }

  halt() {
    this.container.table.updateFromShortSerialised(this.init)
  }

  override handleBreak(event: BreakEvent): Controller {
    if (event.init && this.shots.length == 0) {
      this.container.table.updateFromShortSerialised(event.init)
      this.shots = [...event.shots]
      this.playNextShot(this.delay)
      this.container.table.showSpin(true)
    }
    return this
  }

  retry() {
    this.container.table.updateFromShortSerialised(this.init)
    this.container.view.camera.forceMode(this.container.view.camera.aimView)
    return new Aim(this.container)
  }
}

import { AmbientLight, DirectionalLight, PCFSoftShadowMap, Scene, Vector3, WebGLRenderer } from "three";
import { Keyboard } from "./keyboard";
import { Ball } from "./model/ball";
import { Table } from "./model/table";
import { Rack } from "./utils/rack";
import { Camera } from "./view/camera";
import { TableGeometry } from "./view/tablegeometry";

export class GameClient {
  scene = new Scene()
  renderer = new WebGLRenderer()

  table: Table
  camera: Camera
  public keyboard = new Keyboard()
  last = performance.now()

  constructor(element) {
    this.initialiseScene(element)
    this.addLights()
    this.addTable()
    this.addCamera(element)
  }

  begin() {
    this.animate(performance.now())
  }

  animate(timestamp): void {
    this.advance((timestamp - this.last) / 1000)
    this.last = timestamp
    this.render()
    requestAnimationFrame(t => {
      this.animate(t)
    })
  }

  private advance(elapsed) {
    try {
      let step = 0.01
      let steps = Math.max(15, Math.floor(elapsed / step))
      let i = 0
      while (i++ < steps) {
        this.table.advance(step)
        //console.log(elapsed, steps,i)
      }
      this.camera.update(steps * step)
      this.keyboard.applyKeys(elapsed, this.table, this.camera)
    } catch (error) {
      console.log(error)
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera.camera)
  }

  private initialiseScene(element) {
    this.renderer.setSize(element.offsetWidth, element.offsetHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
    element.appendChild(this.renderer.domElement)
  }

  private addCamera(element) {
    this.camera = new Camera(
      this.table,
      element.offsetWidth / element.offsetHeight
    )
  }

  private addLights() {
    let s = 1.3
    let light = new DirectionalLight(0xffffff, 1.0)
    light.position.set(0.1, -0.01, 10)
    light.shadow.camera.near = 4
    light.shadow.camera.far = 12
    light.shadow.camera.right = TableGeometry.X * s
    light.shadow.camera.left = -TableGeometry.X * s
    light.shadow.camera.top = TableGeometry.Y * s
    light.shadow.camera.bottom = -TableGeometry.Y * s
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    light.castShadow = true
    this.scene.add(light)
    this.scene.add(new AmbientLight(0x505050, 1.0))
  }

  private addTable() {
    let balls = Rack.testSpin()
    balls.unshift(new Ball(new Vector3(-11, 0.0, 0)))
    this.table = new Table(balls)
    this.table.balls.forEach(b => b.mesh.addToScene(this.scene))
    this.scene.add(this.table.cue.mesh)
    this.table.cue.moveToCueBall()
    TableGeometry.addToScene(this.scene)
  }
}

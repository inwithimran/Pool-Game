import { Vector3 } from "three";
import { Ball } from "../model/ball";
import { up, zero } from "../utils/utils";
import { I } from "../model/physics/constants";

export class CollisionThrow {

  public static R: number = 0.029; // ball radius in meters

  // Friction parameters
  private static a: number = 0.01; // Minimum friction coefficient
  private static b: number = 0.108;  // Range of friction variation
  private static c: number = 1.088;  // Decay rate


  private static dynamicFriction(vRel: number): number {
    return CollisionThrow.a + CollisionThrow.b * Math.exp(-CollisionThrow.c * vRel);
  }


  protected relativeVelocity(v: number, ωx: number, ωz: number, ϕ: number): number {
    return Math.sqrt(
      Math.pow(v * Math.sin(ϕ) - ωz * CollisionThrow.R, 2) +
      Math.pow(Math.cos(ϕ) * ωx * CollisionThrow.R, 2)
    );
  }


  public throwAngle(v: number, ωx: number, ωz: number, ϕ: number): number {
    const vRel = this.relativeVelocity(v, ωx, ωz, ϕ);
    const μ = CollisionThrow.dynamicFriction(vRel);
    const numerator = Math.min((μ * v * Math.cos(ϕ)) / vRel, 1 / 7) * (v * Math.sin(ϕ) - CollisionThrow.R * ωz);
    const denominator = v * Math.cos(ϕ);
/*
    console.log("vRel = ", vRel)
    console.log("μ = ", μ)
    console.log("numerator = ", numerator)
    console.log("denominator = ", denominator)
    console.log("throw = ", Math.atan2(numerator, denominator))
    */
    return Math.atan2(numerator, denominator);
  }

  public plot(v: number, ωx: number, ωz: number, ϕ: number) {
    // assume balls in contact along y axis 
    // cue ball a is travelling +y only
    // object ball positioned so that collision angle is phi

    const a = new Ball(zero)
    a.vel.copy(new Vector3(0, v, 0))
    a.rvel.copy(new Vector3(ωx, 0, ωz))

    const straight = new Vector3(0, 2 * CollisionThrow.R)
    const bpos = straight.applyAxisAngle(up, ϕ)
    const b = new Ball(bpos);


    //        console.log(a.pos,b.pos)

//    console.log("---new     ---")
//    return CollisionThrow.updateVelocities(a, b)
//    console.log("---original---")
    return this.throwAngle(v, ωx, ωz, ϕ)
  }
  private static updateVelocities(a: Ball, b: Ball) {
    // Unit vector along the line of centers    
    const ab = b.pos.clone().sub(a.pos).normalize();
    // Perpendicular tangent vector
    const abTangent = new Vector3(-ab.y, ab.x, 0);

    const R: number = 0.029
    const m = 0.3
    const e = 1
    // Relative velocity at contact point
    const vRel = a.vel.clone().sub(b.vel).add(
      ab.clone().multiplyScalar(-R).cross(a.rvel).sub(
        ab.clone().multiplyScalar(R).cross(b.rvel)
      )
    );
    /*
    console.log("a.vel = ", a.vel)
    console.log("a.rvel = ", a.rvel)
    console.log("b.vel = ", b.vel)
    console.log("b.rvel = ", b.rvel)
    console.log("ab = ", ab)
    console.log("vRel = ", vRel)
*/
    // Decompose relative velocity into normal and tangential components
    const vRelNormal = ab.dot(vRel);
    const vRelTangential = abTangent.dot(vRel);

    const μ = this.dynamicFriction(vRelNormal);
    // Compute impulses
    const normalImpulse = vRelNormal;
    const tangentialImpulse =
      Math.min((μ * vRelNormal) / vRel.length(), 1 / 7) * -vRelTangential

/*
    console.log("vRelNormal =", vRelNormal);
    console.log("vRelTangential =", vRelTangential);
    console.log("μ =", μ);
    console.log("tangentialImpulse (numerator)=", tangentialImpulse);
    console.log("normalImpulse (denominator)=", normalImpulse);
*/
    // Update linear velocities
    const normalImpulseVector = ab.clone().multiplyScalar(normalImpulse);
    a.vel.add(normalImpulseVector.clone().multiplyScalar(1 / m));
    b.vel.sub(normalImpulseVector.clone().multiplyScalar(1 / m));

    const tangentialImpulseVector = abTangent.clone().multiplyScalar(tangentialImpulse);
    a.vel.add(tangentialImpulseVector.clone().multiplyScalar(1 / m));
    b.vel.sub(tangentialImpulseVector.clone().multiplyScalar(1 / m));

    // Update angular velocities
    a.rvel.add(
      ab.clone().cross(tangentialImpulseVector.clone().multiplyScalar(-R / I))
    );
    b.rvel.add(
      ab.clone().cross(tangentialImpulseVector.clone().multiplyScalar(R / I))
    );

    // Return the throw angle
    let throwAngle = (Math.atan2(tangentialImpulse, normalImpulse) + 2 * Math.PI) % (2 * Math.PI);
  //  console.log("throwAngle =", throwAngle);

    return throwAngle;
  }

}

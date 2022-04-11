import { OrthographicCamera, PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import Webgl from "./Webgl";

import { Store } from "/webgl/js/Tools/Store";

let influence = 0;

export function lerpPrecise(start, end, t, limit = 0.001) {
  const v = start * (1 - t) + end * t;
  return Math.abs(end - v) < limit ? end : v;
}

export default class Camera {
  constructor(opt = {}) {
    this.webgl = new Webgl();
    this.scene = this.webgl.scene;

    this.type = opt.type || "Perspective";
    this.type == "Orthographic"
      ? this.setOrthographicCamera()
      : this.setPerspectiveCamera();

    this.isShake = false;
    this.isHardShake = false;
    /// #if DEBUG
    this.setDebugCamera();
    /// #endif
  }

  setPerspectiveCamera() {
    this.camera = new PerspectiveCamera(
      75,
      Store.resolution.width / Store.resolution.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 2.7);
    this.camera.rotation.reorder("YXZ");

    this.scene.add(this.camera);
  }

  setOrthographicCamera() {
    const frustrumSize = 1;
    this.camera = new OrthographicCamera(
      frustrumSize / -2,
      frustrumSize / 2,
      frustrumSize / 2,
      frustrumSize / -2,
      -1000,
      1000
    );
    this.camera.position.set(0, 0, 1);

    // If you want to keep the aspect of your image
    const aspect = 1 / 1; // Aspect of the displayed image
    const imgAspect = imageAspect(
      aspect,
      Store.resolution.width,
      Store.resolution.height
    );
    Store.aspect.a1 = imgAspect.a1;
    Store.aspect.a2 = imgAspect.a2;

    this.scene.add(this.camera);
  }

  hardShake() {
    influence = lerpPrecise(influence, 1, 0.5);

    this.camera.position.x = (0.5 - Math.random() * 0.5) * 0.25 * influence;
    this.camera.position.y = (0.5 - Math.random() * 0.5) * 0.25 * influence;
  }

  shake() {
    influence = lerpPrecise(influence, 1, 0.01);

    this.camera.position.x = (0.5 - Math.random() * 0.5) * 0.05 * influence;
    this.camera.position.y = (0.5 - Math.random() * 0.5) * 0.05 * influence;
    this.camera.fov = lerpPrecise(this.camera.fov, 45, 0.01);
    this.camera.updateProjectionMatrix();
  }

  stopShake() {
    influence = 0;
    this.camera.position.x = lerpPrecise(this.camera.position.x, 0, 0.01);
    this.camera.position.y = lerpPrecise(this.camera.position.y, 0, 0.01);
    this.camera.fov = lerpPrecise(this.camera.fov, 75, 0.01);
    this.camera.updateProjectionMatrix();
  }

  setDebugCamera() {
    this.debug = {};
    this.debug.camera = this.camera.clone();
    this.debug.camera.rotation.reorder("YXZ");

    this.debug.orbitControls = new OrbitControls(
      this.debug.camera,
      this.webgl.canvas
    );
    this.debug.orbitControls.enabled = this.debug.active;
    this.debug.orbitControls.screenSpacePanning = true;
    this.debug.orbitControls.enableKeys = false;
    this.debug.orbitControls.zoomSpeed = 0.5;
    this.debug.orbitControls.enableDamping = true;
    this.debug.orbitControls.update();
  }

  resize() {
    if (this.type == "Perspective") {
      this.camera.aspect = Store.resolution.width / Store.resolution.height;
      this.camera.updateProjectionMatrix();
    }

    /// #if DEBUG
    this.debug.camera.aspect = Store.resolution.width / Store.resolution.height;
    this.debug.camera.updateProjectionMatrix();
    /// #endif
  }

  update() {
    /// #if DEBUG
    this.debug.orbitControls.update();

    // this.camera.position.copy(this.debug.camera.position);
    // this.camera.quaternion.copy(this.debug.camera.quaternion);
    this.camera.updateMatrixWorld();
    /// #endif
  }

  destroy() {
    /// #if DEBUG
    this.debug.orbitControls = null;
    /// #endif
  }
}

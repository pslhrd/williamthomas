import { Scene } from "three";
import GUI from "lil-gui";

import Raf from "../Tools/Raf";
import Sizes from "../Tools/Sizes";
import Stats from "../Tools/Stats";
import Keyboard from "../Tools/Keyboard";
import Orientation from "../Tools/Orientation";

import Renderer from "./Renderer";
import Camera from "./Camera";
import World from "./World/World";
// import Device from "../Tools/Device";
import Mouse from "../Tools/Mouse";

export default class Webgl {
  static instance;

  constructor(opt = {}) {
    if (Webgl.instance) {
      return Webgl.instance;
    }
    Webgl.instance = this;

    this.initialized = false;

    this.canvas = opt.canvas;
    if (!this.canvas) {
      console.warn("Missing 'canvas' property");
      return;
    }

    this.videos = opt.videos;

    this.init();
  }

  init() {
    /// #if DEBUG
    this.debug = new GUI();
    this.debug.close();
    // this.stats = new Stats();
    /// #endif

    this.raf = new Raf();
    this.scene = new Scene();
    this.camera = new Camera();

    // this.device = new Device();
    this.sizes = new Sizes();
    this.mouse = new Mouse();
    this.orientation = new Orientation();
    // /// #if DEBUG
    // this.keyboard = new Keyboard();
    // /// #endif

    this.renderer = new Renderer();
    this.world = new World({ videos: this.videos });

    this.sizes.on("resize", () => {
      this.resize();
      // this.device.checkDevice()
    });

    this.raf.on("raf", () => {
      this.update();
    });

    setTimeout(() => {
      this.sizes.resize();
    }, 500);

    this.initialized = true;
  }

  update() {
    if (!this.initialized) return;

    /// #if DEBUG
    // if (this.stats) {
    //   this.stats.update();
    // }
    /// #endif

    if (this.camera) {
      this.camera.update();
    }
    if (this.world) {
      this.world.update(this.raf.elapsed, this.raf.delta);
    }
    if (this.renderer) {
      this.renderer.update(this.raf.elapsed);
    }

    if (this.camera.isShake) {
      this.renderer.shake();
      this.camera.shake();
    } else {
      this.renderer.stopShake();
      this.camera.stopShake();
    }

    if (this.camera.isHardShake) {
      this.camera.hardShake();
    }
  }

  resize() {
    if (this.camera) {
      this.camera.resize();
    }
    if (this.world) {
      this.world.resize();
    }
    if (this.renderer) {
      this.renderer.resize();
    }
    if (this.orientation) {
      this.orientation.resize();
    }
  }

  destroy() {
    this.mouse.destroy();
    this.raf.destroy();
    this.renderer.destroy();
    this.camera.destroy();
    this.world.glass.destroy();

    cleanScene(this.scene);

    /// #if DEBUG
    // this.stats.destroy();
    this.debug.domElement.remove();
    /// #endif

    for (const key in this) {
      delete this[key];
    }

    delete Webgl.instance;
  }
}

const cleanScene = (scene) => {
  scene.traverse((object) => {
    if (!object.isMesh) return;

    if (object.material.isMaterial) {
      cleanMaterial(object.material);
    } else {
      for (const material of object.material) {
        cleanMaterial(material);
      }
    }
  });
};

const cleanMaterial = (material) => {
  material.dispose();

  for (const key of Object.keys(material)) {
    const value = material[key];
    if (value && typeof value === "object" && "minFilter" in value) {
      value.dispose();
    }
  }
};

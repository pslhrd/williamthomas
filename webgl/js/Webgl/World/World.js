import Webgl from "/webgl/js/Webgl/Webgl";
import Glass from "./Glass";
import Particles from "./Particles";

export default class World {
  constructor(opt = {}) {
    this.webgl = new Webgl();
    this.scene = this.webgl.scene;

    this.videos = opt.videos;

    this.initialized = false;

    this.setComponent();
  }

  setComponent() {
    // this.glass = new Glass()
    this.glass = new Glass({
      videos: this.videos,
    });
    this.particles = new Particles();

    this.initialized = true;
  }

  resize() {
    if (!this.initialized) {
      return;
    }

    if (this.glass) {
      this.glass.resize();
    }
    if (this.particles) {
      this.particles.resize();
    }
    if (this.glass) {
      this.glass.resize();
    }
  }

  update(et, dt) {
    if (!this.initialized) {
      return;
    }

    if (this.glass) {
      this.glass.update(et);
    }
    if (this.particles) {
      this.particles.update(et);
    }
    if (this.glass) {
      this.glass.update(et, dt);
    }
  }

  destroy() {}
}

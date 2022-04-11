import {
  sRGBEncoding,
  WebGLRenderer,
  WebGLRenderTarget,
  LinearFilter,
  RGBFormat,
  WebGLMultisampleRenderTarget,
  Vector3,
  Color,
  RGBAFormat,
  WebGL1Renderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { CustomPostProcessing } from "./PostProcessing/CustomPostProcessing";
import { getGPUTier } from "detect-gpu";

import Webgl from "./Webgl";

import { Store } from "/webgl/js/Tools/Store";

export function lerpPrecise(start, end, t, limit = 0.001) {
  const v = start * (1 - t) + end * t;
  return Math.abs(end - v) < limit ? end : v;
}

export default class Renderer {
  constructor(opt = {}) {
    this.webgl = new Webgl();
    this.scene = this.webgl.scene;
    this.camera = this.webgl.camera.camera;

    this.usePostprocess = false;
    this.postProcess = {};

    /// #if DEBUG
    // this.stats = this.webgl.stats;
    this.debugFolder = this.webgl.debug.addFolder("renderer");

    this.debugFolder.add(this, "usePostprocess", {
      false: false,
      true: true,
    });
    /// #endif

    this.setRenderer();
    this.setPostProcess();
    this.getGPU();
  }

  async getGPU() {
    const gpuTier = await getGPUTier();
    this.isM1 = gpuTier.gpu == "apple m1" ? true : false;
    this.postProcess.customPass.uniforms.haloStrength.value = this.isM1 ? 0 : 5;
  }

  setRenderer() {
    this.clearColor = "#080808";

    this.renderer = new WebGLRenderer({
      canvas: this.webgl.canvas,
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });

    this.usePostprocess = Store.webgl2 = this.renderer.capabilities.isWebGL2;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(Store.resolution.dpr, 2));
    this.renderer.setClearColor(this.clearColor, 1);

    /// #if DEBUG
    this.context = this.renderer.getContext();

    if (this.stats) {
      this.stats.setRenderPanel(this.context);
    }

    this.debugFolder.addColor(this, "clearColor").onChange(() => {
      this.renderer.setClearColor(this.clearColor);
    });
    /// #endif
  }

  setPostProcess() {
    this.renderTarget = new WebGLRenderTarget(
      Store.resolution.width,
      Store.resolution.height,
      {
        generateMipmaps: false,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        encoding: sRGBEncoding,
      }
    );

    this.postProcess.renderPass = new RenderPass(this.scene, this.camera);

    this.postProcess.composer = new EffectComposer(
      this.renderer,
      this.renderTarget
    );
    this.postProcess.composer.setSize(
      Store.resolution.width,
      Store.resolution.height
    );
    this.postProcess.composer.setPixelRatio(Math.min(Store.resolution.dpr, 2));

    this.postProcess.customPass = new ShaderPass(CustomPostProcessing);
    this.postProcess.customPass.uniforms.resolution.value = new Vector3(
      Store.resolution.width,
      Store.resolution.height,
      Store.resolution.dpr
    );
    this.postProcess.customPass.uniforms.resolution.value.multiplyScalar(
      Store.resolution.dpr
    );

    // RGB
    this.postProcess.customPass.uniforms.rgbShift.value = 0.0015;
    this.postProcess.customPass.uniforms.angle.value = 0.68;

    // DISTO
    this.postProcess.customPass.uniforms.count.value =
      Store.browser == "Safari" ? 1 : 6;

    this.postProcess.customPass.uniforms.intensity.value =
      Store.browser == "Safari" ? 0.5 : 0.65;

    // HALO
    this.postProcess.customPass.uniforms.thColor.value = new Color("#6b6b6b");
    this.postProcess.customPass.uniforms.bhColor.value = new Color("#ffffff");

    this.postProcess.composer.addPass(this.postProcess.renderPass);
    this.postProcess.composer.addPass(this.postProcess.customPass);

    /// #if DEBUG
    this.debugFolderPostProcess = this.debugFolder.addFolder("Post Process");
    this.debugFolderPostProcessRGB =
      this.debugFolderPostProcess.addFolder("RGB");
    this.debugFolderPostProcessZoom =
      this.debugFolderPostProcess.addFolder("Zoom");
    this.debugFolderPostProcessHalo =
      this.debugFolderPostProcess.addFolder("Halo");

    this.debugFolderPostProcess.close();

    this.debugFolderPostProcess
      .add(this.postProcess.customPass.uniforms.uAppear, "value")
      .name("appear")
      .min(0)
      .max(1)
      .step(0.001);

    this.debugFolderPostProcessRGB
      .add(this.postProcess.customPass.uniforms.rgbShift, "value")
      .name("rgb shift")
      .min(0)
      .max(0.005)
      .step(0.0001);
    this.debugFolderPostProcessRGB
      .add(this.postProcess.customPass.uniforms.angle, "value")
      .name("angle")
      .min(-Math.PI)
      .max(Math.PI)
      .step(0.01);

    this.debugFolderPostProcessZoom
      .add(this.postProcess.customPass.uniforms.count, "value")
      .name("count")
      .min(1)
      .max(50)
      .step(1);
    this.debugFolderPostProcessZoom
      .add(this.postProcess.customPass.uniforms.intensity, "value")
      .name("intensity")
      .min(0.1)
      .max(2)
      .step(0.001);

    this.debugFolderPostProcessHalo
      .addColor(this.postProcess.customPass.uniforms.thColor, "value")
      .name("color");
    this.debugFolderPostProcessHalo
      .addColor(this.postProcess.customPass.uniforms.bhColor, "value")
      .name("color");
    this.debugFolderPostProcessHalo
      .add(this.postProcess.customPass.uniforms.haloStrength, "value")
      .name("strength")
      .min(0)
      .max(5)
      .step(0.01);
    /// #endif
  }

  shake() {
    this.postProcess.customPass.uniforms.rgbShift.value = lerpPrecise(
      this.postProcess.customPass.uniforms.rgbShift.value,
      0.0045,
      0.01
    );
    this.postProcess.customPass.uniforms.intensity.value = lerpPrecise(
      this.postProcess.customPass.uniforms.intensity.value,
      2.5,
      0.01
    );
    this.postProcess.customPass.uniforms.count.value =
      Store.browser == "Safari" ? 6 : 11;
  }

  stopShake() {
    this.postProcess.customPass.uniforms.rgbShift.value = lerpPrecise(
      this.postProcess.customPass.uniforms.rgbShift.value,
      0.0015,
      0.1
    );
    this.postProcess.customPass.uniforms.intensity.value = lerpPrecise(
      this.postProcess.customPass.uniforms.intensity.value,
      0.65,
      0.1
    );
    this.postProcess.customPass.uniforms.count.value =
      Store.browser == "Safari" ? 1 : 6;
  }

  resize() {
    this.renderer.setSize(Store.resolution.width, Store.resolution.height);
    this.renderer.setPixelRatio(Math.min(Store.resolution.dpr, 2));

    this.postProcess.composer.setSize(
      Store.resolution.width,
      Store.resolution.height
    );
    this.postProcess.composer.setPixelRatio(Math.min(Store.resolution.dpr, 2));

    this.postProcess.customPass.uniforms.resolution.value.set(
      Store.resolution.width,
      Store.resolution.height,
      Store.resolution.dpr
    );
  }

  update(et) {
    /// #if DEBUG
    // if (this.stats) {
    //   this.stats.beforeRender();
    // }
    /// #endif

    this.usePostprocess
      ? this.postProcess.composer.render()
      : this.renderer.render(this.scene, this.camera);

    /// #if DEBUG
    // if (this.stats) {
    //   this.stats.afterRender();
    // }
    /// #endif
  }

  destroy() {
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderTarget.dispose();
    this.postProcess.composer.renderTarget1.dispose();
    this.postProcess.composer.renderTarget2.dispose();

    this.renderer.forceContextLoss();
  }
}

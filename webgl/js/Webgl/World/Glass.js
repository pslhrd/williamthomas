import {
  AnimationMixer,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LinearFilter,
  LoopOnce,
  Mesh,
  MeshNormalMaterial,
  RGBAFormat,
  RGBFormat,
  ShaderMaterial,
  sRGBEncoding,
  TextureLoader,
  Vector2,
  Vector3,
  VideoTexture,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import anime from "animejs";

import Webgl from "/webgl/js/Webgl/Webgl";

import { Store } from "/webgl/js/Tools/Store";

import vertex from "/webgl/glsl/glass/vertex.glsl";
import fragment from "/webgl/glsl/glass/fragment.glsl";

import glassNormal from "/static/img/textures/glass_normal.jpg";
import jspNormal from "/static/img/textures/jsp_normal.png";

import model_webgl2 from "/static/model/shapekeys_webgl2.gltf";
import model_webgl1 from "/static/model/shapekeys_webgl1.gltf";

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

const twoPI = Math.PI * 2;
const tVec3 = new Vector3();
const tVec2Tilt = new Vector2();
const textureLoader = new TextureLoader();

// Phong light shader
const borderPhong = {
  color: new Color().set("#c6a980"),
  specularColor: new Color().set("#febaa9"),
  shininess: 7,
  lightIntensity: 0.452,
  lightPos: new Vector3().set(2, -2.85, 0.55),
};

const facePhong = {
  color: new Color().set("#f0dfc7"),
  specularColor: new Color().set("#696969"),
  shininess: 25.8,
  lightIntensity: 0.184,
  lightPos: new Vector3().set(2, 1.2, 0.81),
};

let videoIndex = 0;
let holdClick = false;
let enableClick = false;
let holdClicked = false;
const MAX_HOLD_CLICK_TIME = 25;
let prevaultHoldClick = MAX_HOLD_CLICK_TIME;

const lerpParams = {
  hold: 0.05,
  default: 0.006,
};

const morphParams = {
  broken: 0,
  idle: 0,
};

const videos = [null, null, null, null, null];
const videoTextures = [null, null, null, null, null];

const scaleList = [0.95, 0.7, 0.45, 0.4];
let targetScale = scaleList[0];

const wait = (delay) =>
  new Promise((revolve) => {
    setTimeout(() => {
      revolve();
    }, delay);
  });

let device = null;
const checkDevice = () => {
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    device = "mobile";
  } else {
    device = "desktop";
  }
};

/// #if DEBUG
let control = true;
/// #endif

export default class Glass {
  constructor(opt = {}) {
    this.webgl = new Webgl();
    this.scene = this.webgl.scene;
    this.camera = this.webgl.camera;
    this.renderer = this.webgl.renderer;
    this.mouse = this.webgl.mouse;
    this.orientation = this.webgl.orientation.tilt;

    /// #if DEBUG
    this.keyboard = this.webgl.keyboard;
    /// #endif

    this.mouse.on("mousedown", () => {
      holdClick = true;
    });
    this.mouse.on("mouseup", () => {
      holdClick = false;
    });

    this.group = new Group();

    this.videosLink = opt.videos;
    this.videos = [null, null, null, null, null];
    this.object = {};

    this.videoOnPause = false;
    this.initialized = false;
    this.useMorphTarget = false;

    this.init();
  }

  async init() {
    this.useMorphTarget = Store.webgl2;

    checkDevice();

    if (
      videos.every((e) => e === null) &&
      videoTextures.every((e) => e === null)
    )
      await this.setVideosTexture();

    this.setMaterial();
    this.loadGLTF();
  }

  /// #if DEBUG
  debug() {
    this.debugFolder = this.webgl.debug.addFolder("Glass");
    this.debugFolderFragment = this.debugFolder.addFolder("Fragment");
    this.debugFolderVideo = this.debugFolder.addFolder("Video");
    this.debugFolderPhong = this.debugFolder.addFolder("Phong");
    this.debugFolderPhongBorder = this.debugFolderPhong.addFolder("Border");
    this.debugFolderPhongFace = this.debugFolderPhong.addFolder("Face");

    // this.debugFolderFragment.close();
    this.debugFolderPhong.close();
    this.debugFolderVideo.close();

    this.debugFolder.add(this, "showUp");

    this.debugFolderVideo.add(this, "play");

    this.debugFolderVideo.add(this, "pause");

    this.debugFolderVideo.add(this, "debugChangeVideo").name("change video");

    this.debugFolderFragment
      .add(this, "glassStrength")
      .min(0)
      .max(0.4)
      .step(0.001)
      .onChange(() => {
        this.object.material.uniforms.glassStrength.value = this.glassStrength;
      });

    this.debugFolderFragment
      .add(this, "depthStrength")
      .min(0)
      .max(1.5)
      .step(0.01)
      .onChange(() => {
        this.object.material.uniforms.depthStrength.value = this.depthStrength;
      });

    this.debugFolderFragment
      .add(this, "slStrength")
      .min(0)
      .max(5)
      .step(0.01)
      .onChange(() => {
        this.object.material.uniforms.slStrength.value = this.slStrength;
      });

    this.debugFolderFragment
      .add(this.object.material.uniforms.uTransiProgress, "value")
      .name("transition")
      .min(0)
      .max(1)
      .step(0.1);

    /* Phong */
    this.debugFolderPhongBorder
      .add(borderPhong.lightPos, "x")
      .min(-5)
      .max(5)
      .step(0.01);
    this.debugFolderPhongBorder
      .add(borderPhong.lightPos, "y")
      .min(-5)
      .max(5)
      .step(0.01);
    this.debugFolderPhongBorder
      .add(borderPhong.lightPos, "z")
      .min(-5)
      .max(5)
      .step(0.01);

    this.debugFolderPhongBorder.addColor(borderPhong, "color");
    this.debugFolderPhongBorder.addColor(borderPhong, "specularColor");

    this.debugFolderPhongBorder
      .add(borderPhong, "shininess")
      .min(0)
      .max(100)
      .step(0.1)
      .onChange(() => {
        this.object.material.uniforms.uBorderShininess.value =
          borderPhong.shininess;
      });

    this.debugFolderPhongBorder
      .add(borderPhong, "lightIntensity")
      .min(0)
      .max(5)
      .step(0.001)
      .onChange(() => {
        this.object.material.uniforms.uBorderLightIntensity.value =
          borderPhong.lightIntensity;
      });

    this.debugFolderPhongFace
      .add(facePhong.lightPos, "x")
      .min(-5)
      .max(5)
      .step(0.01);
    this.debugFolderPhongFace
      .add(facePhong.lightPos, "y")
      .min(-5)
      .max(5)
      .step(0.01);
    this.debugFolderPhongFace
      .add(facePhong.lightPos, "z")
      .min(-5)
      .max(5)
      .step(0.01);

    this.debugFolderPhongFace.addColor(facePhong, "color");
    this.debugFolderPhongFace.addColor(facePhong, "specularColor");

    this.debugFolderPhongFace
      .add(facePhong, "shininess")
      .min(0)
      .max(100)
      .step(0.1)
      .onChange(() => {
        this.object.material.uniforms.uFaceShininess.value =
          facePhong.shininess;
      });

    this.debugFolderPhongFace
      .add(facePhong, "lightIntensity")
      .min(0)
      .max(5)
      .step(0.001)
      .onChange(() => {
        this.object.material.uniforms.uFaceLightIntensity.value =
          facePhong.lightIntensity;
      });

    this.debugFolderFragment
      .add(morphParams, "broken")
      .min(0)
      .max(1)
      .step(0.001)
      .onChange(() => {
        this.object.mesh.morphTargetInfluences[0] = morphParams.broken;
      });

    this.debugFolderFragment
      .add(morphParams, "idle")
      .min(0)
      .max(1)
      .step(0.001)
      .onChange(() => {
        this.object.mesh.morphTargetInfluences[1] = morphParams.idle;
      });

    console.log(this.object.mesh);
  }

  debugChangeVideo() {
    let currentVideoIndex = videoIndex;
    videoIndex = (videoIndex + 1) % videos.length;
    this.changeVideo(videoIndex, currentVideoIndex);
  }

  pause() {
    this.videoOnPause = true;
    videos[videoIndex].pause();

    if (!this.useMorphTarget) return;
    this.idleTL.pause();
    morphParams.idle = 0;

    anime({
      targets: morphParams,
      broken: 0,
      easing: "easeOutCubic",
      update: () => {
        this.object.mesh.morphTargetInfluences[0] = morphParams.broken;
      },
    });
  }
  /// #endif

  loadGLTF() {
    const loader = new GLTFLoader();

    const model = Store.webgl2 ? model_webgl2 : model_webgl1;

    loader.load(model, async (gltf) => {
      this.object.group = new Group();

      this.object.group.rotation.y = -Math.PI / 2;

      this.object.mesh = gltf.scene.children[0];

      this.object.mesh.traverse((mesh) => {
        if (mesh instanceof Mesh) {
          mesh.material = this.object.material;
        }
      });

      videos[videoIndex].play();

      this.object.group.scale.set(0.5, 0.5, 0.5);
      this.object.group.position.set(-0, 0.2, 0.2);
      if (this.useMorphTarget) {
        if (!this.idleTL) this.idle();
        this.idleTL.reset();
        this.idleTL.seek(0);

        this.object.mesh.morphTargetInfluences[0] =
          this.object.mesh.morphTargetInfluences[1] =
          morphParams.broken =
          morphParams.idle =
            0;
      }
      this.object.material.uniforms.uAlpha.value = 0;

      this.object.group.add(this.object.mesh);
      this.addObject(this.object.group);

      this.initialized = true;

      this.resize();
      this.updateScale();

      await wait(1000);

      this.showUp();

      /// #if DEBUG
      this.debug();
      /// #endif
    });
  }

  showUp() {
    this.object.group.scale.set(0.5, 0.5, 0.5);
    if (this.useMorphTarget) {
      if (this.idleTL) this.idleTL.reset();
      if (this.idleTL) this.idleTL.seek(0);

      this.object.mesh.morphTargetInfluences[0] =
        this.object.mesh.morphTargetInfluences[1] =
        morphParams.broken =
        morphParams.idle =
          0;
    }
    this.object.material.uniforms.uAlpha.value = 0;

    enableClick = false;

    videos[videoIndex].play();

    anime({
      targets: this.object.material.uniforms.uAlpha,
      value: 1,
      duration: 2000,
      easing: "easeInOutExpo",
    });

    anime({
      targets: this.renderer.postProcess.customPass.uniforms.uAppear,
      value: 1,
      duration: 1000,
      easing: "easeOutQuad",
      complete: async () => {
        // this.changeVideo(0);
        this.camera.isHardShake = true;

        this.play();

        await wait(150);

        this.camera.isHardShake = false;
      },
    });

    anime({
      targets: this.object.group.scale,
      x: targetScale,
      y: targetScale,
      z: targetScale,
      duration: 800,
      easing: "easeOutExpo",
    });
  }

  idle() {
    if (!this.useMorphTarget) return;

    this.idleTL = anime({
      targets: morphParams,
      idle: 0.25,
      duration: 5000,
      easing: "linear",
      direction: "alternate",
      loop: true,
    });
    this.idleTL.pause();
  }

  play() {
    this.videoOnPause = false;
    videos[videoIndex].play();

    if (!this.useMorphTarget) return;
    this.idleTL.play();

    anime({
      targets: morphParams,
      broken: 1,
      duration: 4000,
      easing: "easeOutCubic",
      update: () => {
        this.object.mesh.morphTargetInfluences[0] = morphParams.broken;
      },
      complete: () => {
        enableClick = true;
      },
    });
  }

  holdClick() {
    if (prevaultHoldClick >= MAX_HOLD_CLICK_TIME) return;

    holdClicked = true;
    this.camera.isShake = true;

    if (!this.useMorphTarget) return;
    this.idleTL.pause();
    morphParams.idle = 0;

    anime({
      targets: morphParams,
      broken: 0,
      easing: "easeOutCubic",
      duration: 2500,
      update: () => {
        this.object.mesh.morphTargetInfluences[0] = morphParams.broken;
      },
    });
  }

  releaseHoldClick() {
    if (!holdClicked) return;

    holdClicked = false;

    this.camera.isShake = false;

    if (!this.useMorphTarget) return;
    this.idleTL.play();

    anime({
      targets: morphParams,
      broken: 1,
      duration: 2500,
      easing: "easeOutExpo",
      update: () => {
        this.object.mesh.morphTargetInfluences[0] = morphParams.broken;
      },
    });
  }

  async setVideosTexture() {
    this.videosTexture = [null, null, null, null, null];

    await Promise.all(
      this.videosLink.map(async (src, i) => {
        const video = document.createElement("video");
        const source = document.createElement("source");
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.setAttribute("playsinline", true);
        video.controls = true;
        video.style.display = "none";
        video.preload = "metadata";

        source.type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

        await this.getMediaURLForTrack(source, src);
        video.appendChild(source);

        video.onloadedmetadata = () => {
          video.currentTime = 25;
        };

        videos[i] = video;

        const videoTexture = new VideoTexture(video);
        videoTexture.minFilter = LinearFilter;
        videoTexture.magFilter = LinearFilter;
        videoTexture.format = RGBAFormat;
        videoTexture.generateMipmaps = false;
        videoTexture.encoding = sRGBEncoding;

        videoTextures[i] = videoTexture;
      })
    );
  }

  async getMediaURLForTrack(texture_to_update, passed_url) {
    await fetch(passed_url, { method: "HEAD" }).then((response) => {
      texture_to_update.src = response.url;
    });
  }

  changeVideo(i) {
    if (videos[i].pause) videos[i].play();
    videoIndex = i;

    this.object.material.uniforms.uNextVideoTexture.value =
      videoTextures[videoIndex];

    anime({
      targets: this.object.material.uniforms.uTransiProgress,
      value: 1,
      easing: "easeOutCubic",
      duration: 500,
      complete: () => {
        this.object.material.uniforms.uCurrentVideoTexture.value =
          videoTextures[videoIndex];
        // videos[prevVideoIndex].pause();
        anime({
          targets: this.object.material.uniforms.uTransiProgress,
          value: 0,
          easing: "easeOutCubic",
          duration: 500,
        });
      },
    });
  }

  getTexture(src) {
    return textureLoader.load(src);
  }

  setMaterial() {
    this.glassStrength = 0.039;
    this.depthStrength = 0.65;
    this.slStrength = 3.74;
    this.uvProgress = 0;

    this.object.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      uniforms: {
        uTime: {
          value: 0,
        },
        uAlpha: {
          value: 1,
        },
        uUvProgress: {
          value: 0,
        },
        uCurrentVideoTexture: {
          value: videoTextures[videoIndex],
        },
        uNextVideoTexture: {
          value: null,
        },

        uTransiProgress: {
          value: 0,
        },

        uNormalTexture1: {
          value: this.getTexture(glassNormal),
        },
        uNormalTexture2: {
          value: this.getTexture(jspNormal),
        },

        uBorderLightColor: {
          value: borderPhong.color,
        },
        uBorderSpecularColor: {
          value: borderPhong.specularColor,
        },
        uBorderShininess: {
          value: borderPhong.shininess,
        },
        uBorderLightIntensity: {
          value: borderPhong.lightIntensity,
        },
        uBorderLightPos: {
          value: borderPhong.lightPos,
        },

        uFaceLightColor: {
          value: facePhong.color,
        },
        uFaceSpecularColor: {
          value: facePhong.specularColor,
        },
        uFaceShininess: {
          value: facePhong.shininess,
        },
        uFaceLightIntensity: {
          value: facePhong.lightIntensity,
        },
        uFaceLightPos: {
          value: facePhong.lightPos,
        },

        uResolution: {
          value: tVec3.set(
            Store.resolution.width,
            Store.resolution.height,
            Store.resolution.dpr
          ),
        },

        depthStrength: {
          value: this.depthStrength,
        },
        glassStrength: {
          value: this.glassStrength,
        },
        slStrength: {
          value: this.slStrength,
        },
      },
      side: DoubleSide,
      transparent: true,
    });
    this.object.material.needsUpdates = true;
  }

  addObject(object) {
    this.scene.add(object);
  }

  resize() {
    if (!this.initialized) return;

    checkDevice();

    this.object.material.uniforms.uResolution.value = tVec3.set(
      Store.resolution.width,
      Store.resolution.height,
      Store.resolution.dpr
    );

    this.updateScale();
  }

  updateScale() {
    if (!this.initialized) return;

    if (window.matchMedia("(max-width: 800px)").matches) {
      targetScale = scaleList[1];
      this.object.group.scale.setScalar(targetScale);
    }

    if (window.matchMedia("(max-width: 500px)").matches) {
      targetScale = scaleList[2];
      this.object.group.scale.setScalar(targetScale);
    }

    if (window.matchMedia("(max-width: 420px)").matches) {
      targetScale = scaleList[3];
      this.object.group.scale.setScalar(targetScale);
    }

    if (window.matchMedia("(min-width: 801px)").matches) {
      targetScale = scaleList[0];
      this.object.group.scale.setScalar(targetScale);
    }
  }

  destroy() {
    // videoTextures.forEach((texture) => {
    //   texture.dispose();
    // });

    videos.forEach((video) => {
      video.pause();
    });

    videoIndex = 0;

    this.object.group.scale.set(0.5, 0.5, 0.5);
    if (this.useMorphTarget) {
      this.idleTL.reset();
      this.idleTL.seek(0);
      this.object.mesh.morphTargetInfluences[0] =
        this.object.mesh.morphTargetInfluences[1] =
        morphParams.broken =
        morphParams.idle =
          0;
    }
    this.object.material.uniforms.uAlpha.value =
      this.renderer.postProcess.customPass.uniforms.uAppear.value = 0;
  }

  update(et, dt) {
    if (!this.initialized) {
      return;
    }

    if (this.useMorphTarget) {
      this.object.mesh.morphTargetInfluences[1] = lerp(
        this.object.mesh.morphTargetInfluences[1],
        morphParams.idle,
        holdClicked ? lerpParams.hold : lerpParams.default
      );
    }
    // console.log(morphParams.idle);

    if (enableClick) {
      if (holdClick && prevaultHoldClick > 0) prevaultHoldClick -= 1;
      else if (holdClick && prevaultHoldClick == 0) {
        this.holdClick();
        prevaultHoldClick = -1;
      }
      if (!holdClick) {
        prevaultHoldClick = MAX_HOLD_CLICK_TIME;
        this.releaseHoldClick();
      }
    }

    // console.log(prevaultHoldClick);

    /// #if DEBUG
    if (control) {
      /// #endif
      if (device == "desktop") {
        tVec2Tilt.set(
          this.mouse.scene.x * (Math.PI * 0.2),
          -this.mouse.scene.y * (Math.PI * 0.1)
        );
      } else {
        tVec2Tilt.set(
          this.webgl.orientation.tilt.x * (Math.PI * 0.2),
          this.webgl.orientation.tilt.y * (Math.PI * 0.1)
        );

        // console.log(this.webgl.orientation.tilt.x);
      }

      this.object.group.rotation.x +=
        0.25 * (0.05 * (tVec2Tilt.y / 2 - this.object.group.rotation.x));
      this.object.group.rotation.y +=
        0.25 *
        (0.05 *
          (-Math.PI / 2 + tVec2Tilt.x / 2 - this.object.group.rotation.y));

      /// #if DEBUG
    }
    /// #endif

    this.object.material.uniforms.uTime.value = et;

    // this.mixer.update(dt * 0.001);
  }
}

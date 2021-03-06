import {
  AdditiveBlending,
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  MathUtils,
  Mesh,
  PlaneBufferGeometry,
  RGBFormat,
  ShaderMaterial,
  SphereBufferGeometry,
  TextureLoader,
  Vector2,
  Vector3,
  VideoTexture
} from 'three'

import Webgl from '/webgl/js/Webgl/Webgl'

import { Store } from '/webgl/js/Tools/Store'

import vertex from '/webgl/glsl/particles/vertex.glsl'
import fragment from '/webgl/glsl/particles/fragment.glsl'

import particle from '/static/img/particles/particle.png'

const tVec3 = new Vector3()
const tCol = new Color()
const tVec2Tilt = new Vector2()
const textureLoader = new TextureLoader()

const params = {
  color: '#ffffff'
}

/// #if DEBUG
let control = false
/// #endif

export default class Particles {
  constructor (opt = {}) {
    this.webgl = new Webgl()
    this.scene = this.webgl.scene
    this.mouse = this.webgl.mouse.scene
    this.orientation = this.webgl.orientation.tilt
    /// #if DEBUG
    this.keyboard = this.webgl.keyboard
    /// #endif

    this.object = {}

    this.count = Store.browser == 'Safari' ? 150 : 250

    this.initialized = false

    this.init()
  }

  init () {
    this.setAttributes()
    this.setGeometry()
    this.setMaterial()
    this.setMesh()

    /// #if DEBUG
    this.debug()
    /// #endif

    this.resize()

    this.initialized = true
  }

  /// #if DEBUG
  debug () {
    this.debugFolder = this.webgl.debug.addFolder('Particles')

    this.debugFolder.addColor(params, 'color').onChange((e) => {
      tCol.set(e)
    })

    // this.keyboard.on('keyPressed', (e) => {
    //   if (e === 'a') { control = !control }
    // })
  }
  /// #endif

  getTexture (src) {
    return textureLoader.load(src)
  }

  setAttributes () {
    const particlesCount = this.count

    this.positions = new Float32Array(particlesCount * 3)
    this.offset = new Float32Array(particlesCount * 1)
    this.randomScale = new Float32Array(particlesCount * 1)

    for (let i = 0; i < particlesCount; i++) {
      this.positions[i * 3 + 0] = MathUtils.randFloatSpread(20)
      this.positions[i * 3 + 1] = MathUtils.randFloatSpread(15)
      this.positions[i * 3 + 2] = MathUtils.randFloatSpread(5)

      this.offset[i + 0] = MathUtils.randFloatSpread(5)
      this.randomScale[i + 0] = MathUtils.randFloat(0.25, 1.2)
    }
  }

  setGeometry () {
    const blueprintParticle = new PlaneBufferGeometry()
    blueprintParticle.scale(0.004, 0.004, 0.004)

    this.object.geometry = new InstancedBufferGeometry()

    this.object.geometry.index = blueprintParticle.index
    this.object.geometry.attributes.position =
			blueprintParticle.attributes.position
    this.object.geometry.attributes.normal =
			blueprintParticle.attributes.normal
    this.object.geometry.attributes.uv = blueprintParticle.attributes.uv

    this.object.geometry.setAttribute(
      'aPositions',
      new InstancedBufferAttribute(this.positions, 3, false)
    )
    this.object.geometry.setAttribute(
      'aOffset',
      new InstancedBufferAttribute(this.offset, 1, false)
    )
    this.object.geometry.setAttribute(
      'aRandomScale',
      new InstancedBufferAttribute(this.randomScale, 1, false)
    )
  }

  setMaterial () {
    this.object.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: tCol.set(params.color) },
        uAlpha: { value: 1 },
        uParticle: { value: this.getTexture(particle) },
        uResolution: {
          value: tVec3.set(
            Store.resolution.width,
            Store.resolution.height,
            Store.resolution.dpr
          )
        }
      },
      side: DoubleSide,
      transparent: true,

      /* for particles */
      depthTest: true,
      depthWrite: false,
      blending: AdditiveBlending
    })
  }

  setMesh () {
    this.object.mesh = new Mesh(this.object.geometry, this.object.material)
    this.object.mesh.frustumCulled = false

    this.addObject(this.object.mesh)
  }

  addObject (object) {
    this.scene.add(object)
  }

  resize () {
    this.object.material.uniforms.uResolution.value = tVec3.set(
      Store.resolution.width,
      Store.resolution.height,
      Store.resolution.dpr
    )
  }

  update (et) {
    if (!this.initialized) { return }

    /// #if DEBUG
    if (control) {
      /// #endif
      if (Store.device == 'Desktop') {
        tVec2Tilt.set(
          this.mouse.x * Math.PI,
          -this.mouse.y * (Math.PI * 0.5)
        )

        this.object.mesh.rotation.x +=
					0.15 *
					(0.05 * (tVec2Tilt.y / 2 - this.object.mesh.rotation.x))
        this.object.mesh.rotation.y +=
					0.15 *
					(0.05 * (tVec2Tilt.x / 2 - this.object.mesh.rotation.y))
      } else {
        tVec2Tilt.set(
          this.orientation.x * Math.PI,
          this.orientation.y * (Math.PI * 0.5)
        )

        this.object.mesh.rotation.x +=
					0.15 *
					(0.05 * (tVec2Tilt.y / 2 - this.object.mesh.rotation.x))
        this.object.mesh.rotation.y +=
					0.15 *
					(0.05 * (tVec2Tilt.x / 2 - this.object.mesh.rotation.y))
      }
      /// #if DEBUG
    }
    /// #endif

    this.object.mesh.material.uniforms.uTime.value = et
  }
}

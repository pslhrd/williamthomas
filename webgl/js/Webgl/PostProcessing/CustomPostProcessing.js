const snoise = /* glsl */ `
	vec3 mod289(vec3 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
	}

	vec2 mod289(vec2 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
	}

	vec3 permute(vec3 x) {
		return mod289(((x*34.0)+1.0)*x);
	}

	float snoise(vec2 v) {
		const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
							0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
						-0.577350269189626,  // -1.0 + 2.0 * C.x
							0.024390243902439); // 1.0 / 41.0
	// First corner
		vec2 i  = floor(v + dot(v, C.yy) );
		vec2 x0 = v -   i + dot(i, C.xx);

	// Other corners
		vec2 i1;
		//i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
		//i1.y = 1.0 - i1.x;
		i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		// x0 = x0 - 0.0 + 0.0 * C.xx ;
		// x1 = x0 - i1 + 1.0 * C.xx ;
		// x2 = x0 - 1.0 + 2.0 * C.xx ;
		vec4 x12 = x0.xyxy + C.xxzz;
		x12.xy -= i1;

	// Permutations
		i = mod289(i); // Avoid truncation effects in permutation
		vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

		vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
		m = m*m ;
		m = m*m ;

	// Gradients: 41 points uniformly over a line, mapped onto a diamond.
	// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

		vec3 x = 2.0 * fract(p * C.www) - 1.0;
		vec3 h = abs(x) - 0.5;
		vec3 ox = floor(x + 0.5);
		vec3 a0 = x - ox;

	// Normalise gradients implicitly by scaling m
	// Approximation of: m *= inversesqrt( a0*a0 + h*h );
		m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

	// Compute final noise value at P
		vec3 g;
		g.x  = a0.x  * x0.x  + h.x  * x0.y;
		g.yz = a0.yz * x12.xz + h.yz * x12.yw;
		return 130.0 * dot(m, g);
	}
`;

const distortion = /* glsl */ `
	vec2 barrelDistortion(vec2 coord, float amt) {
		vec2 cc = coord - 0.5;
		float dist = dot(cc, cc);
		return coord + cc * dist * amt;
	}
`;

export const CustomPostProcessing = {
  uniforms: {
    tDiffuse: {
      value: null,
    },
    resolution: {
      value: null,
    },
    uAppear: {
      value: 0,
    },

    // RGB SHIFT
    rgbShift: {
      value: 0,
    },
    angle: {
      value: 0,
    },

    // DISTORTION
    count: {
      value: 1,
    },
    intensity: {
      value: 1,
    },

    // HALO
    thColor: {
      value: null,
    },
    bhColor: {
      value: null,
    },
    haloStrength: {
      value: 5,
    },
  },

  vertexShader: /* glsl */ `
		precision highp float;

		varying vec2 vUv;

		void main() {
			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

  fragmentShader: /* glsl */ `
		precision highp float;

		#define PI 3.1415926535897932384626433832795

		uniform sampler2D tDiffuse;
		uniform vec3 resolution;
		uniform float uAppear;

		// RGB SHIFT
		uniform float rgbShift;
		uniform float angle;

		// DISTORTION
		uniform int count;
		uniform float intensity;

		// HALO
		uniform vec3 thColor;
		uniform vec3 bhColor;
		uniform float haloStrength;

		varying vec2 vUv;

		${distortion}

		void main() {
			// DISTORT
			vec2 uv = vUv;

			float dist = distance(vec2(uv.x, (uv.y + .35) * .6), vec2(.5));

			vec2 zoomUv = (uv * .9) + .05;

			vec4 render = vec4(0.);
			float s = .0;
			for (int i = 0; i < count; i++) {
				s += .2;
				render += texture2D(tDiffuse, mix(zoomUv, barrelDistortion(zoomUv, s * intensity), dist));
			}
			render /= vec4(count);


			// RGB PASS
			vec2 offset = rgbShift * vec2( cos(angle), sin(angle));
			vec4 cr = texture2D(tDiffuse, (zoomUv + offset));
			vec4 cga = texture2D(tDiffuse, zoomUv);
			vec4 cb = texture2D(tDiffuse, (zoomUv - offset));

			vec4 rgbPass = vec4(cr.r, cga.g, cb.b, cga.a);


			// HALO
			vec3 topHaloBorders = vec3(1. - (smoothstep(.49, .52, .45 * ((uv.y * .5) + uv.x)) + smoothstep(.49, .52, .45 * ((uv.y * .5) + (1. - (uv.x))))));
			topHaloBorders -= vec3(1. - (smoothstep(.49, .52, .45 * ((uv.y * .51) + uv.x)) + smoothstep(.49, .52, .45 * ((uv.y * .51) + (1. - (uv.x))))));

			float topHaloCircle = 1. - distance(vec2((uv.x + .5) * .5, (uv.y ) * .5), vec2(.5));
			topHaloCircle = smoothstep(.7, 1., topHaloCircle);
			vec3 topHalo = vec3(1. - (smoothstep(.49, .52, .45 * ((uv.y * .5) + uv.x)) + smoothstep(.49, .52, .45 * ((uv.y * .5) + (1. - (uv.x))))));

			// topHalo += topHaloBorders * .75;
			topHalo *= topHaloCircle;

			float bottomHaloCircle = 1. - distance(vec2((uv.x + .5) * .5, (1. - uv.y) * .4), vec2(.5));
			bottomHaloCircle = smoothstep(.79, 1., bottomHaloCircle);
			vec3 bottomHalo = vec3(1. - (smoothstep(.48, .52, .45 * (((1. - uv.y) * .5) + uv.x)) + smoothstep(.48, .52, .45 * (((1. - uv.y) * .5) + (1. - (uv.x))))));
			bottomHalo *= bottomHaloCircle;

			topHalo *= thColor;
			bottomHalo *= bhColor;

			vec3 halo = topHalo + bottomHalo;
			halo *= haloStrength;

      // APARRITION
      vec4 normalRender = texture2D(tDiffuse, zoomUv);

			vec4 finalRender = ((rgbPass + render * (1. + vec4(halo, 1.))) / 2.);

			gl_FragColor = mix(normalRender, finalRender, uAppear);
		}`,
};

precision highp float;

vec3 phong(vec3 color, vec3 specularColor, float shininess, float lightIntensity, vec3 normal, vec3 lightPos, vec3 objectPos) {
  vec3 n = normalize(normal);
  vec3 s = normalize(lightPos - objectPos);
  vec3 v = normalize(-objectPos);
  vec3 r = reflect(-s, n);

  vec3 ambient = color;
  vec3 diffuse = color * max(dot(s, n), 0.);
  vec3 specular = specularColor * pow(max(dot(r, v), 0.), shininess);

  return lightIntensity * (ambient + diffuse + specular);
}

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
  0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
  -0.577350269189626,  // -1.0 + 2.0 * C.x
  0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

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
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

// Compute final noise value at P
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// float rand(vec2 co) {
//   return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
// }

#define PI 3.1415926535897932384626433832795
#define twoPI PI*2.

// VHS
float bottomStaticOpt = 1.;
float scalinesOpt = 1.;
float horzFuzzOpt = 7.;

// debug
uniform float glassStrength;
uniform float depthStrength;
uniform float slStrength;

// Phong
uniform vec3 uBorderLightColor;
uniform vec3 uBorderSpecularColor;
uniform float uBorderShininess;
uniform float uBorderLightIntensity;
uniform vec3 uBorderLightPos;

uniform vec3 uFaceLightColor;
uniform vec3 uFaceSpecularColor;
uniform float uFaceShininess;
uniform float uFaceLightIntensity;
uniform vec3 uFaceLightPos;

uniform float uTransiProgress;
uniform float uTime;
uniform float uAlpha;
uniform float uUvProgress;
uniform vec3 uResolution;
uniform sampler2D uCurrentVideoTexture;
uniform sampler2D uNextVideoTexture;
uniform sampler2D uNormalTexture1;
uniform sampler2D uNormalTexture2;

varying float vDepth;
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vNormalMatrix;
varying vec3 vNormalTest;
varying vec3 vEyeVector;
// varying vec4 vMv;

float applySoftLightToChannel(float base, float blend) {
  return ((blend < 0.5) ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend)) : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend)));
}

vec4 softLight(vec4 base, vec4 blend) {
  vec4 color = vec4(applySoftLightToChannel(base.r, blend.r), applySoftLightToChannel(base.g, blend.g), applySoftLightToChannel(base.b, blend.b), applySoftLightToChannel(base.a, blend.a));
  return color;
}

float staticV(vec2 uv, float time) {
  float staticHeight = snoise(vec2(9.0, time * 1.2 + 3.0)) * 0.3 + 5.0;
  float staticAmount = snoise(vec2(1.0, time * 1.2 - 6.0)) * 0.1 + 0.3;
  float staticStrength = snoise(vec2(-9.75, time * 0.6 - 3.0)) * 2.0 + 2.0;
  return (1.0 - step(snoise(vec2(5.0 * pow(time, 2.0) + pow(uv.x * 7.0, 1.2), pow((mod(time, 100.0) + 100.0) * uv.y * 0.3 + 3.0, staticHeight))), staticAmount)) * staticStrength;
}

void main() {
  float time = uTime * .001;

  // vec2 mUv = vec2(vMv * vec4(normalize(vNormalMatrix), 0.)) * .5 + vec2(.5, .5);

  vec2 st = gl_FragCoord.xy / uResolution.xy;
  st /= uResolution.z;

  vec2 uvZoom = .75 * vec2(vUv.x + .25, 1. - vUv.y + .25);
  float normal = dot(vNormalMatrix, vec3(0., 0., 1.));
  float normalFix = dot(vNormal, vec3(1., 0., 0.));
  vec3 whiteBorders = vec3(1. - abs(normalFix));
  whiteBorders = smoothstep(.1, 1., whiteBorders);

  vec3 x = dFdx(vNormalTest);
  vec3 y = dFdy(vNormalTest);
  vec3 normal2 = normalize(cross(x, y));

  float fresnel = 1. - pow(1. + dot(vEyeVector, normal2), 2.);

  float depth = clamp(smoothstep(-1., 1., vDepth), .6, .9);

  // vec2 newUv = mix(st, uvZoom, uUvProgress);
  vec2 newUv = uvZoom;

  vec3 glassNormal1 = texture2D(uNormalTexture1, newUv).xyz;
  vec3 glassNormal2 = texture2D(uNormalTexture2, newUv).xyz;

	// VHS
  float fuzzOffset = snoise(vec2(time * 15., newUv.y * 80.)) * .003;
  float largeFuzzOffset = snoise(vec2(time * 1., newUv.y * 25.)) * .004;
  float xOffset = (fuzzOffset + largeFuzzOffset) * horzFuzzOpt;

  float staticVal = 0.;
  float maxDist = 5. / 200.;
  for(float y = -1.; y <= 1.; y += 1.) {
    float dist = y / 200.;
    staticVal += staticV(vec2(newUv.x, newUv.y + dist), time) * (maxDist - abs(dist)) * 1.5;
  }
  staticVal *= bottomStaticOpt;

  vec2 vhsEffect = vec2(newUv.x + xOffset, newUv.y) * (1. + staticVal);
  vec2 glassEffect = mix(vec2(newUv.x, mix(newUv.y, newUv.y, uTransiProgress)), (glassNormal2.xy - (glassNormal1.xy * .5)), glassStrength);

  vec2 vhsUv = vec2((.75 * (vhsEffect - .25)) + ((newUv - .1) * .55));
  vec2 glassUv = vec2((.75 * (glassEffect - .25)) + ((newUv - .1) * .55));
  vec2 videoUv = mix(glassUv, vhsUv, uTransiProgress);

  vec4 currentVideo = texture2D(uCurrentVideoTexture, videoUv);
  vec4 nextVideo = texture2D(uNextVideoTexture, videoUv);

  vec4 video = mix(currentVideo, nextVideo, smoothstep(.5, 1., uTransiProgress));

  // float n = (fract(sin(time * dot(newUv, vec2(12.9898, 78.233) * 2.)) * 43758.5453)) * .15;
  // video += n;

  float alpha = video.a;
  alpha *= uAlpha;
  alpha *= 1. - (depth * depthStrength) * .5;

  vec3 glass = video.xyz;
  glass *= 1. + whiteBorders;
  glass *= 1. - (depth * depthStrength);
  glass += (1. - fresnel) * .25;

  vec3 pointLight = phong(glass + uBorderLightColor, uBorderSpecularColor, uBorderShininess, uBorderLightIntensity, vNormalMatrix, uBorderLightPos, vPos);
  whiteBorders *= pointLight;

  vec3 lightNormalX = vec3(10. * smoothstep(.0, .5, (normal2.r * ((st.x - .5) * .5))));
  vec3 lightNormalY = vec3(10. * smoothstep(.0, .5, (normal2.y * ((st.y - .5) * .5))));

  vec3 pl = smoothstep(.25, 1., normal2.r * st.x) * phong(glass + uFaceLightColor, uFaceSpecularColor, uFaceShininess, uFaceLightIntensity, normal2, uFaceLightPos, vPos * -2.);
  vec3 sl = softLight(vec4(glass, alpha), vec4(slStrength)).xyz;

  glass *= sl;
  glass += clamp(lightNormalX, 0., .2) * .75;
  glass += clamp(lightNormalY, 0., .2) * .75;
  glass += whiteBorders;
  glass += pl;

  float scanline = sin(uvZoom.y * 800.0) * 0.04 * scalinesOpt;
  glass -= scanline * uTransiProgress;

  gl_FragColor = vec4(glass, alpha);
}

precision highp float;

#define PI 3.1415926535897932384626433832795

varying float vDepth;
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vNormalMatrix;
varying vec3 vNormalTest;
varying vec3 vEyeVector;
// varying vec4 vMv;

#ifdef USE_MORPHTARGETS

uniform float morphTargetBaseInfluence;

	#ifdef MORPHTARGETS_TEXTURE

uniform float morphTargetInfluences[MORPHTARGETS_COUNT];
uniform sampler2DArray morphTargetsTexture;
uniform vec2 morphTargetsTextureSize;

vec3 getMorph(const in int vertexIndex, const in int morphTargetIndex, const in int offset, const in int stride) {

  float texelIndex = float(vertexIndex * stride + offset);
  float y = floor(texelIndex / morphTargetsTextureSize.x);
  float x = texelIndex - y * morphTargetsTextureSize.x;

  vec3 morphUV = vec3((x + 0.5) / morphTargetsTextureSize.x, y / morphTargetsTextureSize.y, morphTargetIndex);
  return texture2D(morphTargetsTexture, morphUV).xyz;

}

	#else

		#ifndef USE_MORPHNORMALS

uniform float morphTargetInfluences[8];

		#else

uniform float morphTargetInfluences[4];

		#endif

	#endif

#endif
void main() {

  vec3 transformed = vec3(position);

  #ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
  transformed *= morphTargetBaseInfluence;

	#ifdef MORPHTARGETS_TEXTURE

  for(int i = 0; i < MORPHTARGETS_COUNT; i++) {

			#ifndef USE_MORPHNORMALS

    if(morphTargetInfluences[i] != 0.0)
      transformed += getMorph(gl_VertexID, i, 0, 1) * morphTargetInfluences[i];

			#else

    if(morphTargetInfluences[i] != 0.0)
      transformed += getMorph(gl_VertexID, i, 0, 2) * morphTargetInfluences[i];

			#endif

  }

	#else

  transformed += (morphTarget0 - position) * morphTargetInfluences[0];
  transformed += (morphTarget1 - position) * morphTargetInfluences[1];
  transformed += (morphTarget2 - position) * morphTargetInfluences[2];
  transformed += (morphTarget3 - position) * morphTargetInfluences[3];

		#ifndef USE_MORPHNORMALS

  transformed += (morphTarget4 - position) * morphTargetInfluences[4];
  transformed += (morphTarget5 - position) * morphTargetInfluences[5];
  transformed += (morphTarget6 - position) * morphTargetInfluences[6];
  transformed += (morphTarget7 - position) * morphTargetInfluences[7];

		#endif

	#endif

#endif

  // transformed += position;
  vUv = uv;
  vPos = transformed;
  vNormal = normal;
  vNormalMatrix = normal * normalMatrix;

  vec4 worldPosition = modelMatrix * vec4(transformed, 1.);
  vEyeVector = normalize(worldPosition.xyz - cameraPosition);
  vDepth = -(mat3(projectionMatrix * modelViewMatrix) * mat3(viewMatrix) * transformed).z;

  vec4 mv = modelViewMatrix * vec4(transformed, 1.);
  gl_Position = projectionMatrix * mv;
  // vMv = mv;
  vNormalTest = vec3(mv) / mv.w;
}

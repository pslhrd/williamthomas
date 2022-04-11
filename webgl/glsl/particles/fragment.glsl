precision highp float;

vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.411764705882353) * direction;
    vec2 off2 = vec2(3.2941176470588234) * direction;
    vec2 off3 = vec2(5.176470588235294) * direction;
    color += texture2D(image, uv) * 0.1964825501511404;
    color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
    color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
    return color;
}

#define PI 3.1415926535897932384626433832795

uniform float uTime;
uniform float uAlpha;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform sampler2D uParticle;
uniform sampler2D uDistort;

varying float vLoop;
varying float vRandomScale;
varying vec2 vUv;
varying vec3 vPos;

void main() {
	float time = uTime * .0001;
	vec2 uv = vUv;

	vec2 res = gl_FragCoord.xy / uResolution.xy;
	res /= uResolution.z;

	float progress = .15 * smoothstep(1., .75, vLoop) * smoothstep(.0, .25, vLoop);

	vec4 particle = texture2D(uParticle, uv);

	particle.xyz *= vec3(uColor);
	particle.xyz *= smoothstep(0., .75, particle.xyz);

	float alpha = particle.a;
	alpha *= progress * float(vPos + vec3(uAlpha));
	alpha *= vRandomScale;

	gl_FragColor = vec4(particle.xyz, alpha);
}

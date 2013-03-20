#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUv;

uniform sampler2D texture;
uniform sampler2D depth;

uniform float wSplitCnt;
uniform float hSplitCnt;

uniform float focusDistance;
uniform float focalLength;

void main() {
    float zbuffer = texture2D(depth, vUv).r;
    
    // calculate CoC
    float coc = abs(focalLength * (zbuffer - focusDistance) / zbuffer
            / (focusDistance - focalLength));
    
        //vec4 tmp = texture2D(texture, vUv + offset[i]);
    
    gl_FragColor = texture2D(texture, vUv); //texture2D(texture, vUv);
}
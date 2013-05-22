#ifdef GL_ES
precision highp float;
#endif

#define MAX_RADIUS 20
#define MAX_RADIUS_F 20.0
#define MAX_LENGTH 40

varying vec2 vUv;

uniform sampler2D texture;
uniform sampler2D depth;

uniform float wSplitCnt;
uniform float hSplitCnt;

// following uniforms are in world space
uniform float clipNear;
uniform float clipFar;
uniform float focalLength;
uniform float focusDistance;
uniform float minC;
uniform float maxC;
uniform float aperture;

// following uniform is in screen space
uniform float maxBlur;

// get world depth position from screen depth information
// screenDepth from 0.0 to 1.0
float getWorldDepth(float screenDepth) {
    return (1.0 - screenDepth) * (clipFar - clipNear) + clipNear;
}

// get blur coc from world depth
float getCoc(float worldDepth) {
    float cWorld = abs(focusDistance * focalLength * aperture /
            (focusDistance - focalLength)
            * (1.0 - focusDistance / worldDepth));
    if (cWorld < minC) {
        return 0.0;
    } else if (cWorld < maxC) {
        return maxBlur * (cWorld - minC) / (maxC - minC);
    } else {
        return maxBlur;
    }
}

void main() {
    float zWorld = getWorldDepth(texture2D(depth, vUv).r);
    float thisCoc = getCoc(zWorld);
    
    // do blur
    vec4 sum;
    int cnt = 0;
    int cocLength = 2 * int(thisCoc);
    for (int i = 0; i < MAX_RADIUS; ++i) {
        if (i < cocLength) {
            for (int j = 0; j < MAX_RADIUS; ++j) {
                if (j < cocLength) {
                    vec2 neighbor = vec2(
                            vUv.x + (float(i) - thisCoc) / wSplitCnt,
                            vUv.y + (float(j) - thisCoc) / hSplitCnt);
                    sum += texture2D(texture, neighbor);
                    cnt += 1;
                }
            }
        } else {
            break;
        }
    }
    
    if (cnt == 0) {
        gl_FragColor = texture2D(texture, vUv);
    } else {
        float cntFloat = float(cnt);
        gl_FragColor = vec4(sum.r / cntFloat, sum.g / cntFloat,
                sum.b / cntFloat, 1.0);
    }
}
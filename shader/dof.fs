#ifdef GL_ES
precision highp float;
#endif

#define MAX_RADIUS_F 20.0
#define MAX_LENGTH 40

varying vec2 vUv;

uniform sampler2D texture;
uniform sampler2D depth;

uniform float wSplitCnt;
uniform float hSplitCnt;

uniform float focusDistance;
uniform float focalLength;

uniform float clipNear;
uniform float clipFar;

uniform int maxCoc;

void main() {
    // depth was from 0.0 to 1.0
    // map it in world space, which is from clipNear to clipFar
    float zbuffer = (1.0 - texture2D(depth, vUv).r) * (clipFar - clipNear)
            + clipNear;
    
    // calculate CoC
    int coc = int(abs(zbuffer - focusDistance) * MAX_RADIUS_F /
                  max(clipFar - focusDistance, focusDistance - clipNear));
    coc = coc < maxCoc ? coc : maxCoc;
    int cocDouble = coc * 2;
    
    vec4 sum;
    int cnt = 0;
    for (int i = 0; i < MAX_LENGTH; ++i) {
        if (i > cocDouble) {
            break;
        }
        for (int j = 0; j < MAX_LENGTH; ++j) {
            if (j > cocDouble) {
                break;
            }
            vec2 neighbor = vec2(vUv.x + float(i - coc) / wSplitCnt,
                                 vUv.y + float(j - coc) / hSplitCnt);
            // blur those in front
            //if (texture2D(depth, neighbor).z - texture2D(depth, vUv).z > 0.001) {
                sum += texture2D(texture, neighbor);
                cnt += 1;
            //}
        }
    }
    
    vec4 color;
    if (cnt > 0) {
        color = sum / float(cnt);
    } else {
        color = texture2D(texture, vUv);
    }
    gl_FragColor = vec4(color.r, color.g, color.b, 1.0); //texture2D(texture, vUv);
}
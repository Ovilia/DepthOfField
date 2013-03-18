var DofDemo = {
    stats: null,

    windowWidth: 0,
    windowHeight: 0,

    renderer: null,
    scene: null,
    camera: null,
    light: null,
    
    model: {
        dragon: null,
    },
    
    shader: {
        dofVert: null,
        dofFrag: null,
        
        depthVert: null,
        depthFrag: null,
        
        screenVert: null,
        screenFrag: null
    },
    
    rttTexture: null,
    rttScene: null,
    rttRender: null,
    rttCamera: null,
    
    material: {
        dof: null,
        depth: null,
        
        plane: null,
        box: null,
        dragon: null,
        
        screen: null
    },
    
    mesh: {
        plane: null,
        box: null,
        dragon: null,
        
        screenPlane: null
    },
    
    mousePressed: false,
    mousePressX: 0,
    mousePressY: 0,
    
    gui: null,
    config: null,
    
    useDof: false,
    useDepth: false
}

$(document).ready(function() {
    // container
    DofDemo.windowWidth = $(window).innerWidth();
    DofDemo.windowHeight = $(window).innerHeight();
    
    $('#container').css({
        width: DofDemo.windowWidth, 
        height: DofDemo.windowHeight})
    
    .mousemove(function(event) {
        if (DofDemo.mousePressed) {
            // rotate camera with mouse dragging
            var dx = event.clientX - DofDemo.mousePressX;
            var da = Math.PI * dx / DofDemo.windowWidth * 0.05;
            var x = DofDemo.rttCamera.position.x;
            var z = DofDemo.rttCamera.position.z;
            var cos = Math.cos(da);
            var sin = Math.sin(da);
            DofDemo.rttCamera.position.x = cos * x - sin * z;
            DofDemo.rttCamera.position.z = sin * x + cos * z;
            DofDemo.rttCamera.lookAt(new THREE.Vector3(0, 250, 0));
        }
    })
    .mousedown(function(event) {
        DofDemo.mousePressed = true;
        DofDemo.mousePressX = event.clientX;
        DofDemo.mousePressY = event.clientY;
    })
    .mouseup(function() {
        DofDemo.mousePressed = false;
    });
    
    // loading
    $('#loading').css({'left': (DofDemo.windowWidth - 300) / 2,
            'top': (DofDemo.windowHeight - 200) / 2});
    
    // renderer
    DofDemo.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: $('#canvas')[0],
        preserveDrawingBuffer: true
    });
    DofDemo.renderer.setSize(DofDemo.windowWidth, DofDemo.windowHeight);
    DofDemo.renderer.shadowMapEnabled = true;
    DofDemo.renderer.shadowMapSoft = true;
    DofDemo.renderer.autoClear = false;
    
    // scene
    DofDemo.scene = new THREE.Scene();
    // render to target scene
    DofDemo.rttScene = new THREE.Scene();
    
    // render to target camera
    DofDemo.rttCamera = new THREE.PerspectiveCamera(
            60, DofDemo.windowWidth / DofDemo.windowHeight, 1, 40000);
    DofDemo.rttCamera.position.set(750, 1000, 750);
    DofDemo.rttCamera.lookAt(new THREE.Vector3(0, 250, 0));
    DofDemo.rttScene.add(DofDemo.rttCamera);
    // camera
    DofDemo.camera = new THREE.OrthographicCamera(-DofDemo.windowWidth / 2,
            DofDemo.windowWidth / 2, DofDemo.windowHeight / 2, 
            -DofDemo.windowHeight / 2, -10000, 10000);
    DofDemo.camera.position.z = 1000;
    DofDemo.scene.add(DofDemo.camera);
    
    // light
    DofDemo.light = new THREE.PointLight(0xffcc66);
    DofDemo.light.position = DofDemo.rttCamera.position;
    DofDemo.rttScene.add(DofDemo.light);
    
    var light2 = new THREE.SpotLight(0xffaa00);
    light2.position.set(0, 1500, 0);
    light2.shadowCameraFov = 90;
    light2.castShadow = true;
    light2.shadowDarkness = 0.5;
    DofDemo.rttScene.add(light2);
    
    // frame buffer
    initFramebuffer();
    
    // shader
    loadShader();
});

// init frame buffer to get texture and depth data
function initFramebuffer() {    
    DofDemo.rttTexture = new THREE.WebGLRenderTarget(DofDemo.windowWidth, 
            DofDemo.windowHeight, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
    });
}

// load vertex shaders and fregment shaders
function loadShader() {
    var loadedCnt = 0;
    var totalCnt = 6; // 6 shaders
    
    function checkAllLoaded() {
        ++loadedCnt;
        if (loadedCnt == totalCnt) {
            addObjects();
            initStatus();
            
            // start rendering
            animate();
        }
    }
    
    $.get('shader/dof.vs', function(data){
        console.log('dof.vs loaded.');
        DofDemo.shader.dofVert = data;
        checkAllLoaded();
    });
    
    $.get('shader/dof.fs', function(data){
        console.log('dof.fs loaded.');
        DofDemo.shader.dofFrag = data;
        checkAllLoaded();
    });
    
    $.get('shader/depth.vs', function(data){
        console.log('depth.vs loaded.');
        DofDemo.shader.depthVert = data;
        checkAllLoaded();
    });
    
    $.get('shader/depth.fs', function(data){
        console.log('depth.fs loaded.');
        DofDemo.shader.depthFrag = data;
        checkAllLoaded();
    });
    
    $.get('shader/screen.vs', function(data){
        console.log('screen.vs loaded.');
        DofDemo.shader.screenVert = data;
        checkAllLoaded();
    });
    
    $.get('shader/screen.fs', function(data){
        console.log('screen.fs loaded.');
        DofDemo.shader.screenFrag = data;
        checkAllLoaded();
    });
}

// add objects in the scene
function addObjects() {
    var attributes = {};
    
    var boxText = THREE.ImageUtils.loadTexture('image/box.jpg');
    var planeText = THREE.ImageUtils.loadTexture('image/chess.png')
    
    DofDemo.material.dof = {
        box: new THREE.ShaderMaterial({
            uniforms: {
                texture: {
                    type: 't', 
                    value: boxText
                },
                textRepeat: {
                    type: 'f',
                    value: 1
                },
                
                wSplitCnt: {
                    type: 'f',
                    value: boxText.image.width
                },
                hSplitCnt: {
                    type: 'f',
                    value: boxText.image.height
                }
            },
            attributes: {},
            vertexShader: DofDemo.shader.dofVert,
            fragmentShader: DofDemo.shader.dofFrag,
            transparent: true
        }),
        
        plane: new THREE.ShaderMaterial({
            uniforms: {
                texture: {
                    type: 't', 
                    value: planeText
                },
                textRepeat: {
                    type: 'f',
                    value: 16
                },
                
                wSplitCnt: {
                    type: 'f',
                    value: 50
                },
                hSplitCnt: {
                    type: 'f',
                    value: 50
                }
            },
            attributes: {},
            vertexShader: DofDemo.shader.dofVert,
            fragmentShader: DofDemo.shader.dofFrag,
            transparent: true
        })
    };
    planeText.wrapS = planeText.wrapT = THREE.RepeatWrapping;

    DofDemo.material.depth = new THREE.ShaderMaterial({
        uniforms: {},
        attributes: {},
        vertexShader: DofDemo.shader.depthVert,
        fragmentShader: DofDemo.shader.depthFrag,
        transparent: true
    });
    
    // plane
    var chessTexture = THREE.ImageUtils.loadTexture('image/chess.png');
    chessTexture.wrapS = chessTexture.wrapT = THREE.RepeatWrapping;
    chessTexture.repeat.set(16, 16);
    DofDemo.material.plane = new THREE.MeshLambertMaterial({
        color: 0x666666,
        map: chessTexture
    });
    DofDemo.mesh.plane = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000));
    DofDemo.mesh.plane.rotation.x = -Math.PI / 2;
    setMaterial('plane');
    DofDemo.rttScene.add(DofDemo.mesh.plane);
    
    // boxes
    var pos = [[350, 375, 200], [300, 150, 200], [0, 125, 700], 
            [-400, 250, 300], [-500, 650, 300]];
    var rot = [0, Math.PI / 3, 0, Math.PI / 5, 0];
    var size = [150, 300, 250, 500, 300];
    DofDemo.material.box = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture('image/box.jpg')
    });
    DofDemo.mesh.box = new Array(pos.length);
    for (var i in pos) {
        DofDemo.mesh.box[i] = new THREE.Mesh(
                new THREE.CubeGeometry(size[i] * 1.2, size[i], size[i] * 1.1)
        );
        DofDemo.mesh.box[i].position = new THREE.Vector3(
                pos[i][0], pos[i][1], pos[i][2]);
        DofDemo.mesh.box[i].rotation = new THREE.Vector3(0, rot[i], 0);
        DofDemo.mesh.box[i].castShadow = true;
        DofDemo.mesh.box[i].receiveShadow = true;
        DofDemo.rttScene.add(DofDemo.mesh.box[i]);
    }
    setMaterial('box');
    
    // render to target material
    DofDemo.material.screen = new THREE.ShaderMaterial({
        uniforms: {
            texture: {
                type: 't',
                value: DofDemo.rttTexture
            },
            textRepeat: {
                type: 'f',
                value: 1
            },
            
            wSplitCnt: {
                type: 'f',
                value: DofDemo.windowWidth
            },
            hSplitCnt: {
                type: 'f',
                value: DofDemo.windowHeight
            }
        },
        vertexShader: DofDemo.shader.dofVert,
        fragmentShader: DofDemo.shader.dofFrag,
        depthWrite: false
    });
    
    // plane to render the final result
    DofDemo.mesh.screenPlane = new THREE.Mesh(    
        new THREE.PlaneGeometry(DofDemo.windowWidth, DofDemo.windowHeight),
        DofDemo.material.screen);
    DofDemo.mesh.screenPlane.position.z = -1000;
    DofDemo.scene.add(DofDemo.mesh.screenPlane);
}

// set object material or shader material
function setMaterial(name) {
    if (DofDemo.useDof) {
        var material = DofDemo.material.dof[name];
    } else if (DofDemo.useDepth) {
        var material = DofDemo.material.depth;
    } else {
        var material = DofDemo.material[name];
    }
    if (DofDemo.mesh[name] instanceof Array) {
        for (var i in DofDemo.mesh[name]) {
            if (DofDemo.mesh[name][i]) {
                DofDemo.mesh[name][i].material = material;
            }
        }
    } else {
        DofDemo.mesh[name].material = material;
    }
}

// init status before rendering
function initStatus() {
    // stats
    DofDemo.stats = new Stats();
    DofDemo.stats.domElement.style.position = 'absolute';
    DofDemo.stats.domElement.style.left = '0px';
    DofDemo.stats.domElement.style.top = '0px';
    document.body.appendChild(DofDemo.stats.domElement);
    
    // gui control
    DofDemo.gui = new dat.GUI();
    DofDemo.config = {
        'Render Type': ['Depth of Field', 'z-buffer', 'None'],
        'Focal Length': 500,
        'Focus Distance': 50,
        'F-stop': 1.0
    };
    
    DofDemo.gui.add(DofDemo.config, 'Render Type', 
            ['Depth of Field', 'z-buffer', 'None']).onChange(function(value) {
        if (value === 'Depth of Field') {
            DofDemo.useDof = true;
            DofDemo.useDepth = false;
        } else if (value === 'z-buffer') {
            DofDemo.useDof = false;
            DofDemo.useDepth = true;
        } else {
            DofDemo.useDof = false;
            DofDemo.useDepth = false;
        }
        setMaterial('plane');
        setMaterial('box');
    });
    
    DofDemo.gui.add(DofDemo.config, 'Focal Length', 0, 2000);
    DofDemo.gui.add(DofDemo.config, 'Focus Distance', 0, 200);
    DofDemo.gui.add(DofDemo.config, 'F-stop', 0, 5);
    
    // show render
    $('#loading').fadeOut();
}

// call in each frame
function animate() {
    DofDemo.stats.begin();
    
    render();
    
    requestAnimationFrame(animate);
    
    DofDemo.stats.end();
}

// render called by animate
function render() {
    DofDemo.renderer.clear();
    
    // render to texture
    DofDemo.renderer.render(DofDemo.rttScene, DofDemo.rttCamera, 
            DofDemo.rttTexture, true);

    // render to screen
    DofDemo.renderer.render(DofDemo.scene, DofDemo.camera);
}

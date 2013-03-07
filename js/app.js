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
        depthFrag: null
    },
    
    material: {
        dof: null,
        depth: null,
        
        plane: null,
        box: null,
        dragon: null
    },
    
    mesh: {
        plane: null,
        box: null,
        dragon: null
    },
    
    mousePressed: false,
    mousePressX: 0,
    mousePressY: 0,
    
    gui: null,
    config: null,
    
    useDof: true,
    useDepth: false,
    
    largeScene: false
}

$(document).ready(function() {
    // container
    DofDemo.windowWidth = $(window).innerWidth();
    DofDemo.windowHeight = $(window).innerHeight();
    $('#container').css({
        width: DofDemo.windowWidth, 
        height: DofDemo.windowHeight})
    .mousemove(onMouseMove)
    .mousedown(onMouseDown)
    .mouseup(onMouseUp);
    
    // loading
    $('#loading').css({'left': (DofDemo.windowWidth - 300) / 2,
            'top': (DofDemo.windowHeight - 200) / 2});
    
    // renderer
    DofDemo.renderer = new THREE.WebGLRenderer({antialias: true});
    DofDemo.renderer.setSize(DofDemo.windowWidth, DofDemo.windowHeight);
    DofDemo.renderer.shadowMapEnabled = true;
    DofDemo.renderer.shadowMapSoft = true;
    $('#container').append(DofDemo.renderer.domElement);
    
    // scene
    DofDemo.scene = new THREE.Scene();
    DofDemo.sceneCube = new THREE.Scene();
    
    // camera
    DofDemo.camera = new THREE.PerspectiveCamera(
            60, DofDemo.windowWidth / DofDemo.windowHeight, 1, 40000);
    DofDemo.camera.position.set(750, 1000, 750);
    DofDemo.camera.lookAt(new THREE.Vector3(0, 250, 0));
    DofDemo.scene.add(DofDemo.camera);
    
    // light
    DofDemo.light = new THREE.PointLight(0xffcc66);
    DofDemo.light.position = DofDemo.camera.position;
    DofDemo.scene.add(DofDemo.light);
    
    light2 = new THREE.SpotLight(0xffaa00);
    light2.position.set(0, 1500, 0);
    light2.shadowCameraFov = 90;
    light2.castShadow = true;
    light2.shadowDarkness = 0.5;
    DofDemo.scene.add(light2);
    
    // shader
    loadShader();
});

// start rendering when loaded model
function start() {
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
        'Render Dragon': false,
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
    
    DofDemo.gui.add(DofDemo.config, 'Render Dragon').onChange(function(value) {
        toggleDragon();
    });
    
    DofDemo.gui.add(DofDemo.config, 'Focal Length', 0, 2000);
    DofDemo.gui.add(DofDemo.config, 'Focus Distance', 0, 200);
    DofDemo.gui.add(DofDemo.config, 'F-stop', 0, 5);
    
    // show render
    $('#loading').fadeOut();
    run();
}

function addObejects() {
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
        vertexShader: DofDemo.shader.dofVert,
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
    DofDemo.scene.add(DofDemo.mesh.plane);
    
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
        DofDemo.scene.add(DofDemo.mesh.box[i]);
    }
    setMaterial('box');
}

// call in each frame
function run() {
    DofDemo.stats.begin();
    
    DofDemo.renderer.render(DofDemo.scene, DofDemo.camera);
    
    DofDemo.stats.end();
    
    requestAnimationFrame(run);
}

function loadDragon() {
    var loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
        console.log('Dragon loaded.');
        
        // add dragon to scene once loaded
        DofDemo.model.dragon = event.content;
        DofDemo.model.dragon.scale = new THREE.Vector3(6000, 6000, 6000);
        DofDemo.model.dragon.position = new THREE.Vector3(0, -300, -500);

        addObejects();
        start();
    });
    loader.load('model/dragon.obj', 'model/dragon.mtl');
}

function toggleDragon() {
    DofDemo.largeScene = !DofDemo.largeScene;
    if (DofDemo.largeScene) {
        DofDemo.scene.add(DofDemo.model.dragon);
    } else {
        DofDemo.scene.remove(DofDemo.model.dragon);
    }
}

function onMouseMove(event) {
    if (DofDemo.mousePressed) {
        // rotate camera with mouse dragging
        var dx = event.clientX - DofDemo.mousePressX;
        var da = Math.PI * dx / DofDemo.windowWidth * 0.05;
        var x = DofDemo.camera.position.x;
        var z = DofDemo.camera.position.z;
        var cos = Math.cos(da);
        var sin = Math.sin(da);
        DofDemo.camera.position.x = cos * x - sin * z;
        DofDemo.camera.position.z = sin * x + cos * z;
        DofDemo.camera.lookAt(new THREE.Vector3(0, 250, 0));
    }
}

function onMouseDown(event) {
    DofDemo.mousePressed = true;
    DofDemo.mousePressX = event.clientX;
    DofDemo.mousePressY = event.clientY;
}

function onMouseUp() {
    DofDemo.mousePressed = false;
}

function loadShader() {
    var loadedCnt = 0;
    var totalCnt = 3; // 3 shaders
    
    function checkAllLoaded() {
        ++loadedCnt;
        if (loadedCnt == totalCnt) {
            loadDragon();
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
    
    $.get('shader/depth.fs', function(data){
        console.log('depth.fs loaded.');
        DofDemo.shader.depthFrag = data;
        checkAllLoaded();
    });
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

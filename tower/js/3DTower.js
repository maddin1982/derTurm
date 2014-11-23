
var camera, scene, renderer, geometry, material, mesh;
var lastFrameId = 0;
var lastFrameStartTime=0;

var windowMeshes=[];

function init3DSceneOnElement(element) {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, element.width() / 200, 1, 10000);
    camera.position.z = 30;
    scene.add(camera);

    group = new THREE.Object3D();
	var material = new THREE.MeshLambertMaterial({
	  color: 0x111111
	});
	
	
    towerTopUpper = new THREE.CylinderGeometry( 7, 7, 3, 16 );	
	towerTopUpperMesh = new THREE.Mesh(towerTopUpper, material);	
	//towerTopUpperMesh.castShadow = true;
	//towerTopUpperMesh.receiveShadow = true;
	
	towerTopLower = new THREE.CylinderGeometry( 7, 7, 5, 16);	
	towerTopLowerMesh = new THREE.Mesh(towerTopLower, material);	
	//towerTopLowerMesh.castShadow = true;
	 //towerTopLowerMesh.receiveShadow = true;

    towerBottom = new THREE.CylinderGeometry( 10, 10, 50, 32 );
	towerBottomMesh = new THREE.Mesh(towerBottom, material);	
	towerBottomMesh.castShadow = true;
	towerBottomMesh.receiveShadow = true;
	
    towerBottomMesh.position.y = - 25;
	towerTopUpperMesh.position.y =  7.5;
	towerTopLowerMesh.position.y =  1.5;
	
	group.add( towerTopUpperMesh );
	group.add( towerTopLowerMesh );
    group.add( towerBottomMesh );
	
	for(var i =0; i<16;i++){
		var mittelBalken = new THREE.BoxGeometry( 0.2,2,1.4);
		//window.applyMatrix( new THREE.Matrix4().makeTranslation( 6.5, 5, 0 ) );
		mittelBalken.applyMatrix( new THREE.Matrix4().makeTranslation( 6.7, 5, 0 ) );
		var mittelBalkenMesh = new THREE.Mesh(mittelBalken, material);
		mittelBalkenMesh.rotation.y = 360*i/16 * Math.PI / 180;
		group.add( mittelBalkenMesh );

		var windowMaterial = new THREE.MeshBasicMaterial( {color: 0x000000, transparent: true, opacity: 0.7, side: THREE.FrontSide } );
		var windowGlass= new THREE.PlaneGeometry(2, 2);
		windowGlass.applyMatrix( new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,1,0), 90* Math.PI / 180));	
		windowGlass.applyMatrix( new THREE.Matrix4().makeTranslation( 6.7, 5, 0 ) );		
		var plane = new THREE.Mesh(windowGlass,windowMaterial);
		plane.rotation.y = ((360*i/16)+(360/34)) * Math.PI / 180;
		windowMeshes[i]=plane;
		group.add(plane);
	}
	
    scene.add(group);
	scene.add( new THREE.AmbientLight( 0x111111 ) );
	//scene.fog = new THREE.Fog( 0x0, 2000, 4000 );
		
	var light = new THREE.SpotLight(0xaaaaaa );
		light.position.set(50, 50, 0);
		light.target.position.set(0,20,0)
		//light.shadowCameraVisible = true;
		light.castShadow = true;
		light.shadowDarkness = 0.6;
		light.shadowCameraNear = 10;
		light.shadowCameraFar = 200;
		
	scene.add(light);	
	
	camera.lookAt(towerBottomMesh.position);

	renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(element.width(), 200);
	renderer.shadowMapEnabled = true;
	//renderer.shadowMapSoft = true;

    element.append(renderer.domElement);

	controls = new THREE.OrbitControls( camera , renderer.domElement);
				controls.target = new THREE.Vector3( 0, 10, 0 );
				controls.update();
	
	animate();
	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {

	camera.aspect = $("#3DContainer").width() / $("#3DContainer").height();
	camera.updateProjectionMatrix();
	renderer.setSize($("#3DContainer").width(), $("#3DContainer").height());

}

function animate() {
    requestAnimationFrame(animate);

	//get current FrameID
	var currentFrameId=framesManager.currentframeId;

	if( lastFrameId !== currentFrameId)  // new animation started
	{
		lastFrameStartTime = new Date().getTime();
	}	

	var currentFrame=framesManager.getCurrentFrame(lastFrameStartTime,new Date().getTime(););
	if(!(currentFrame===undefined)){
		$.each(currentFrame.windows,function(i,window){
			setWindowToColor(i,window.color)
		})
	}
    render();
    lastFrameId=currentFrameId;
}

function setWindowToColor(i,newColor){
	windowMeshes[i].material=new THREE.MeshBasicMaterial( {color: newColor, transparent: true, opacity: 0.7, side: THREE.FrontSide } ); 
}

function render() {
    //group.rotation.x += 0.001;
	group.rotation.y += 0.001;
    renderer.render(scene, camera);
}
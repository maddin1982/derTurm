
var camera, scene, renderer, geometry, material, mesh;
var lastFrameId = 0;
var lastFrameStartTime=0;

var windowMeshes=[];

var windowMaterials=[];
var glowingBubbles=[];

var topWindowMeshes=[];
// var materials=[];



var _ambientLight;
var fullModelObject;
var _withGlowingWindows;
var _withTopWindows;

//if url parameter showFullModel is true show full model ;)
if(gup("showFullModel")=="true")
	showFullModel=true;
else
	showFullModel=false;

function init3DSceneOnElement(container) {
	//make 3d container resizable
	 container.resizable({
	  resize: function( event, ui ) {
		onWindowResize()
	  }
	});

	//add scene
    scene = new THREE.Scene();
	
	//add camera
    camera = new THREE.PerspectiveCamera(50, container.width() / 200, 1, 10000);
    camera.position.z = 30;
    scene.add(camera);

	var material = new THREE.MeshLambertMaterial({
	  color: 0x111111
	});
	
	group = new THREE.Object3D();
	//add full model of building
	if(showFullModel){
		function modelToScene( geometry, materials ) {
				var material = new THREE.MeshFaceMaterial( materials );
				fullModelObject = new THREE.Mesh( geometry, material );
				fullModelObject.scale.set(1,1,1);
				scene.add( fullModelObject );
				
				//add windowmaterials to array
				function getMaterialByName(materialName){
					var materials=fullModelObject.material.materials;
					var returnMaterial={};
					$.each(materials,function(i,material){
						if(material.name==materialName)
							returnMaterial=material;
					})
					return returnMaterial;
				}
				
				for(var i =0; i<16;i++){
					windowMaterials[i]=getMaterialByName("window_"+(i+1))
				}	
		}
		var loader = new THREE.JSONLoader();
		loader.load( "js/3dModels/ernemannturm.json", modelToScene );
		
		function getMaterialByName(materialName){
			var materials=fullModelObject.material.materials;
			var returnMaterial={};
			$.each(materials,function(i,material){
				if(material.name==materialName)
					returnMaterial=material;
			})
			return returnMaterial;
		}
		
	}
	else{
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
			//windlow plane 
			var plane = new THREE.Mesh(windowGlass,windowMaterial);
			plane.rotation.y = ((360*i/16)+(360/34)) * Math.PI / 180;
			windowMeshes[i]=plane;

			
			var topWindowGlass= new THREE.PlaneGeometry(2, 2);
			topWindowGlass.applyMatrix( new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1,0,0), 90* Math.PI / 180));	
			topWindowGlass.applyMatrix( new THREE.Matrix4().makeTranslation( 6.7, 5, 0 ) );		
			var topPlane = new THREE.Mesh(topWindowGlass,windowMaterial);
			topPlane.rotation.y = ((360*i/16)+(360/34)) * Math.PI / 180;
			topPlane.position.y = plane.position.y+8
			topWindowMeshes[i] = topPlane
			//topPlane.rotation.x = 90;
			scene.add(topPlane);
			
			//var moon = new THREE.Mesh(sphereGeom, material);
			//moon.position.set(150,0,-150);
			
			// create custom material from the shader code above
			// that is within specially labeled script tags
			var customMaterial = new THREE.ShaderMaterial( 
			{
				uniforms: 
				{ 
					"c":   { type: "f", value: 0 },
					"p":   { type: "f", value: 2.5 },
					glowColor: { type: "c", value: new THREE.Color(0x000000) },
					viewVector: { type: "v3", value: camera.position }
				},
				vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
				fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
				side: THREE.FrontSide,
				blending: THREE.AdditiveBlending,
				transparent: true,
				// side: THREE.BackSide
			}   );
			//sphere for glow 
			var sphereGeom = new THREE.SphereGeometry(1, 20, 20);
			//add glow to shere
			this.moonGlow = new THREE.Mesh( sphereGeom, customMaterial );
			moonGlow.position.x = plane.position.x+7;
			moonGlow.position.y = plane.position.y+5;
			moonGlow.scale.multiplyScalar(1.2);
			glowingBubbles[i] = moonGlow;

			plane.add( moonGlow );
			group.add(plane);
		}

		scene.add(group);
	}
	
	/**********
	* SKYBOX
	***********/
	// urls of the images, one per half axis
	var urls = [
	  'img/env/0004.png', //pos x
	  'img/env/0002.png', //neg-x
	  'img/env/0005.png', //neg y
	  'img/env/0006.png', //pos y  
	  'img/env/0001.png', //pos z
	  'img/env/0003.png'  //neg z
	],

	// wrap it up into the object that we need
	cubemap = THREE.ImageUtils.loadTextureCube(urls);
	// set the format, likely RGB unless you've gone crazy
	cubemap.format = THREE.RGBFormat;


	var material_env = new THREE.MeshLambertMaterial({
	  color: 0x111111,
	  envMap: cubemap,
	  side: THREE.BackSide
	});
    var skybox = new THREE.Mesh( new THREE.BoxGeometry( 2000, 2000, 2000 ), material_env );

    scene.add(skybox);	


	/**********
	* SETTINGS
	**********/
    //read the last used luminosity value from the cookie
    var cookieLum = readCookie('luminosity')
    var luminosity = 0x222222
    if (cookieLum) {
    	luminosity = rgbToHex(cookieLum, cookieLum, cookieLum)
	}

	//read the state of glowing windows
	var cookieGlowing = readCookie('withGlowingWindows')
    if (cookieGlowing) {
    	_withGlowingWindows = cookieGlowing
	}

	//read the state of the top windows
	var cookieTopwindow = readCookie('withTopWindows')
    if (cookieTopwindow) {
    	_withTopWindows = cookieTopwindow
	}

    _ambientLight = new THREE.AmbientLight( luminosity ) 
	scene.add( _ambientLight );

	//Renderer settings
	renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.width(), 200);
	renderer.shadowMapEnabled = true;

    container.append(renderer.domElement);

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

	var currentFrame=framesManager.getCurrentFrame(lastFrameStartTime,new Date().getTime());
	if(!(currentFrame===undefined)){
		$.each(currentFrame.windows,function(i,window){
			setWindowToColor(i,window.color)
		})
	}
    render();
    lastFrameId=currentFrameId;
}

function setWindowToColor(i,newColor){
	if(showFullModel){
		windowMaterials[i].color=new THREE.Color(newColor)
	}
	else{
		 windowMeshes[i].material=new THREE.MeshBasicMaterial( {color: newColor, transparent: true, opacity: 0.7, side: THREE.FrontSide } ); 
		 if( _withTopWindows == true ) {
			topWindowMeshes[i].material=new THREE.MeshBasicMaterial( {color: newColor, transparent: true, opacity: 0.7, side: THREE.BackSide } ); 
		}
		 if( _withGlowingWindows == true ){
			 glowingBubbles[i].material.uniforms.glowColor.value.set( newColor );
		 }
	 }
}

function render() {
	if(!showFullModel)
		group.rotation.y += 0.001;
		
    renderer.render(scene, camera);
}

function changeAmbientLight(i){
	scene.remove(_ambientLight)
	var color = rgbToHex(i, i, i)
    _ambientLight = new THREE.AmbientLight( color )
	scene.add( _ambientLight );
}

function switchGlowingWindows(value){
	if(!showFullModel){
		_withGlowingWindows = value

		if(_withGlowingWindows == false){
			clearColors()
		}
	}
}

function switchTopWindows(value){
	if(!showFullModel){
		_withTopWindows = value

		if(_withTopWindows == false){
		for(var i =0; i<16;i++){
			topWindowMeshes[i].material=new THREE.MeshBasicMaterial( {color: 0, transparent: true, opacity: 0.0, side: THREE.BackSide } ); 
		}	}
	}
}

function clearColors(){
	for(var i =0; i<16;i++){
		glowingBubbles[i].material.uniforms.glowColor.value.set( 0 );
	}
}

//Helper functions for converting numbers to hex
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
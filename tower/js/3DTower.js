var Tower3DObj=function(){
	var that=this;

	//privat Variables
	var camera, scene, renderer, geometry, material, mesh;
	var lastFrameId = 0;
	var lastFrameStartTime=0;
	var windowMeshes=[];

	var windowMaterials=[];
	var glowingBubbles=[];
	var topWindowMeshes=[];

	var _ambientLight;
	var fullModelObject;
	var _withGlowingWindows;
	var _withTopWindows;
	
	var showFullModel=false;
	var renderTimeout;
	
	this.container;

	this.init3DSceneOnElement=function(container) {
		that.container=container;

		if(renderer)
			renderer.domElement.remove()
		
		//kill running animation timeout 
		if(renderTimeout)
			window.clearTimeout(renderTimeout);
		
		//make 3d container resizable
		 container.resizable({
		  handles: 's',
		  resize: function( event, ui ) {
			that.update3DWindowAspectRatio();
		  }
		});

		//if url parameter showFullModel is true show full model
		if(gup("showFullModel")=="true")
			showFullModel=true;

		//read the last used Model from the cookie
		var cookieModel = readCookie('modelview')
		if (cookieModel) {
			if(cookieModel == "fullview"){
				showFullModel = true;
				windowVector.hide();
			}
			else if (cookieModel == "tower"){
				showFullModel = false;
				windowVector.hide();
			}
			else if (cookieModel == "vector"){
				showFullModel = false;
				windowVector.show();
				return;
			}
		}
		else{
			if(checkIfMobileDevice()){
				// Show Mobile Version
				return;
			}
		}

		scene = new THREE.Scene();
		
		//add camera
		camera = new THREE.PerspectiveCamera(50, container.width() / 200, 1, 10000);
		camera.position.set(-30,30,-60)
		scene.add(camera);

		//get standard material
		var material = new THREE.MeshLambertMaterial({
		  color: 0x111111
		});
		
		//add basic group node
		group = new THREE.Object3D();
		
		//add full model of ernemann tower
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
				moonGlow = new THREE.Mesh( sphereGeom, customMaterial );
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
		var imagePrefix = "img/env/";
		var directions  = ["negx", "posx", "negy", "posy", "posz", "negz"];
		var imageSuffix = ".png";
		var skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 );	
		
		var materialArray = [];
		for (var i = 0; i < 6; i++)
			materialArray.push( new THREE.MeshLambertMaterial({
				map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
				side: THREE.BackSide
			}));
		var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
		var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
		scene.add( skyBox );
		
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
		if(showFullModel)
			controls.target = new THREE.Vector3( 10, 40, -10 );
		else
			controls.target = new THREE.Vector3( 0, 10, 0 );
		controls.update();
		
		that.animate();
		window.addEventListener( 'resize', that.update3DWindowAspectRatio, false );
	}

	this.update3DWindowAspectRatio=function() {

		if(camera){
			camera.aspect = that.container.width() / that.container.height();
			camera.updateProjectionMatrix();
			renderer.setSize(that.container.width(), that.container.height());
		}
	}

	this.animate=function() {
		//render with 24 fps
		renderTimeout=setTimeout( function() {
			console.log("frame")
			if(!that.stopAnimation)
				requestAnimationFrame(that.animate);
		}, 1000 / 24 );

		var currentFrame=player.getCurrentFrame(lastFrameStartTime,new Date().getTime());
		if(!(currentFrame.windows===undefined)){
			$.each(currentFrame.windows,function(i,window){
				that.setWindowToColor(i,window.color)
			})
		}
		that.render();
	}

	this.setWindowToColor=function(i,newColor){
		newColor="rgb("+newColor[0]+","+newColor[1]+","+newColor[2]+")";
		if(showFullModel){
			if(windowMaterials[i])
				windowMaterials[i].color=new THREE.Color(newColor)
		}
		else{
			 if(windowMeshes[i])  
			    windowMeshes[i].material=new THREE.MeshBasicMaterial( {color: newColor, transparent: true, opacity: 0.7, side: THREE.FrontSide } ); 
			 if( _withTopWindows == true ) {
			 	if(topWindowMeshes[i])
					topWindowMeshes[i].material=new THREE.MeshBasicMaterial( {color: newColor, transparent: true, opacity: 0.7, side: THREE.BackSide } ); 
			}
			 if( _withGlowingWindows == true ){
			 	if (glowingBubbles[i])
				 glowingBubbles[i].material.uniforms.glowColor.value.set( newColor );
			 }
		 }
	}

	this.render=function() {
		if(!showFullModel)
			group.rotation.y += 0.001;
			
		renderer.render(scene, camera);
	}

	//set ambient light 
	this.changeAmbientLight=function(i){
		scene.remove(_ambientLight)
		var color = rgbToHex(i, i, i)
		_ambientLight = new THREE.AmbientLight( color )
		scene.add( _ambientLight );
	}

	//set variable to add glowing windows
	this.switchGlowingWindows=function(value){
		if(!showFullModel){
			_withGlowingWindows = value

			if(_withGlowingWindows == false){
				that.clearColors()
			}
		}
	}
	
	//reset glowbubbles color
	this.clearColors=function(){
		for(var i =0; i<16;i++){
			if (glowingBubbles[i])
				glowingBubbles[i].material.uniforms.glowColor.value.set( 0 );
		}
	}

	//set opacity of top window ring to zero
	this.switchTopWindows=function(value){
		if(!showFullModel){
			_withTopWindows = value

			if(_withTopWindows == false){
			for(var i =0; i<16;i++){
				if(topWindowMeshes[i])
					topWindowMeshes[i].material=new THREE.MeshBasicMaterial( {color: 0, transparent: true, opacity: 0.0, side: THREE.BackSide } ); 
			}	}
		}
	}
}
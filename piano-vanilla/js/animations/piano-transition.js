/**
 * Piano 3D Animation Transition
 * This script manages the 3D animation that transitions from a piano model to either piano mode
 */

// Self-executing function to avoid polluting the global namespace
(function() {
    // DOM elements
    const animationContainer = document.getElementById('pianoAnimationContainer');
    const canvas = document.getElementById('animationCanvas');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const progressBar = document.getElementById('loadingProgressBar');
    const skipButton = document.getElementById('skipAnimationButton');
    
    // Virtual Piano and Guided Play buttons
    const startPianoButton = document.getElementById('startPiano');
    const guidedPlayButton = document.getElementById('guidedPlayButton');
    
    // Three.js variables
    let scene, camera, renderer;
    let piano, controls;
    let animationMixer, animations = [];
    let clock = new THREE.Clock();
    
    // Animation state
    let isAnimating = false;
    let targetSection = '';
    let loadingProgress = 0;
    
    // TEMPORARY: Flag to bypass animation for testing
    const skipAnimationForTesting = true;
    
    // Initialize event listeners
    function initEventListeners() {
        // Add click event listeners to piano buttons
        startPianoButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default action
            startTransition('pianoSection');
        });
        
        guidedPlayButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default action
            startTransition('guidedPlaySection');
        });
        
        // Skip animation button
        skipButton.addEventListener('click', function() {
            completeTransition();
        });
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
    }
    
    // Initialize the 3D scene
    function initScene() {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x121212);
        
        // Add ambient light - increase intensity for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); 
        scene.add(ambientLight);
        
        // Add directional light - modified for better key visibility and shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 10);
        directionalLight.castShadow = true;
        // Improve shadow quality to reduce noise
        directionalLight.shadow.mapSize.width = 2048;  // Increased from 1024
        directionalLight.shadow.mapSize.height = 2048; // Increased from 1024
        directionalLight.shadow.bias = -0.001;  // Adjust shadow bias to reduce artifacts
        directionalLight.shadow.normalBias = 0.05;
        scene.add(directionalLight);
        
        // Add specific key light for piano keys with better shadow settings
        const keyboardLight = new THREE.SpotLight(0xffffff, 0.8); // Reduced intensity
        keyboardLight.position.set(0, 5, 2);
        keyboardLight.angle = Math.PI / 4;
        keyboardLight.penumbra = 0.2; // Increased for softer shadows
        keyboardLight.decay = 1.5;
        keyboardLight.distance = 25;
        keyboardLight.castShadow = true;
        // Improve shadow quality
        keyboardLight.shadow.mapSize.width = 1024;
        keyboardLight.shadow.mapSize.height = 1024;
        keyboardLight.shadow.bias = -0.0005;
        scene.add(keyboardLight);
        
        // Keep existing point lights for dramatic effect but adjust for better rendering
        const keyLight = new THREE.PointLight(0x3a86ff, 0.5); // Reduced intensity
        keyLight.position.set(0, 3, 5);
        keyLight.castShadow = false; // Disable shadow to reduce noise
        scene.add(keyLight);
        
        const fillLight = new THREE.PointLight(0xff9e00, 0.3); // Reduced intensity
        fillLight.position.set(-5, 2, 0);
        fillLight.castShadow = false; // Disable shadow to reduce noise
        scene.add(fillLight);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 3, 5);
        
        // Create renderer with better quality settings
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            precision: 'highp'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio to prevent performance issues
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better quality shadows
        renderer.outputEncoding = THREE.sRGBEncoding; // Better color rendering
        renderer.physicallyCorrectLights = true; // More realistic lighting
        
        // Add orbit controls for development (can be disabled in production)
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        
        // Always use the simple piano model instead of loading a 3D model
        createSimplePiano();
        
        // Start animation loop
        animate();
    }
    
    // Create a simple piano model
    function createSimplePiano() {
        // Show loading indicator briefly for consistency
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';
        
        // Piano group
        piano = new THREE.Group();
        
        // Piano body - slightly larger and more detailed with improved materials
        const bodyGeometry = new THREE.BoxGeometry(3.2, 0.7, 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 0.2,
            roughness: 0.8,
            envMapIntensity: 0.5,
            flatShading: false // Ensure smooth shading
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.35;
        body.castShadow = true;
        body.receiveShadow = true;
        piano.add(body);
        
        // Piano body front panel (decorative)
        const panelGeometry = new THREE.BoxGeometry(3.2, 0.4, 0.05);
        const panelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, 
            metalness: 0.1,
            roughness: 0.9,
            envMapIntensity: 0.3
        });
        const frontPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        frontPanel.position.set(0, 0.35, 0.625);
        frontPanel.castShadow = true;
        frontPanel.receiveShadow = true;
        piano.add(frontPanel);
        
        // Create white keys with improved materials
        const whiteKeyGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.8);
        const whiteKeyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf0f0f0,  // Slightly off-white to reduce harshness
            metalness: 0.0,
            roughness: 0.25,  // More polished look for keys
            emissive: 0x111111,
            emissiveIntensity: 0.02  // Reduced
        });
        
        // Create black keys with improved materials
        const blackKeyGeometry = new THREE.BoxGeometry(0.12, 0.15, 0.5);
        const blackKeyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            metalness: 0.1,
            roughness: 0.7
        });
        
        // White key positions (simplified for demonstration)
        const whiteKeyPositions = [
            -1.4, -1.2, -1.0, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4
        ];
        
        // Black key positions (simplified)
        const blackKeyPositions = [
            -1.3, -1.1, -0.7, -0.5, -0.3, 0.1, 0.3, 0.7, 0.9, 1.1
        ];
        
        // Add white keys
        whiteKeyPositions.forEach((posX) => {
            const key = new THREE.Mesh(whiteKeyGeometry, whiteKeyMaterial);
            key.position.set(posX, 0.65, 0);
            key.castShadow = true;
            key.receiveShadow = true;
            piano.add(key);
        });
        
        // Add black keys
        blackKeyPositions.forEach((posX) => {
            const key = new THREE.Mesh(blackKeyGeometry, blackKeyMaterial);
            key.position.set(posX, 0.7, -0.15);
            key.castShadow = true;
            key.receiveShadow = true;
            piano.add(key);
        });
        
        // Add to scene
        scene.add(piano);
        
        // Set initial position
        piano.rotation.x = 0.2;
        
        // Set loading to complete
        loadingProgress = 100;
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }, 800); // Slightly longer timeout for a smoother experience
    }
    
    // Animation loop - optimize rendering
    function animate() {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        
        // Update controls
        if (controls) controls.update();
        
        // Update animation mixer if needed
        if (animationMixer) animationMixer.update(delta);
        
        // Rotate piano gently - use smoother rotation with lerp
        if (piano && !isAnimating) {
            // Use smoother rotation with damping factor
            piano.rotation.y += 0.002; // Further reduced for smoother motion
        }
        
        // Render scene with better settings
        renderer.render(scene, camera);
    }
    
    // Window resize handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Start transition to the selected piano mode
    function startTransition(sectionId) {
        if (isAnimating) return;
        
        isAnimating = true;
        targetSection = sectionId;
        
        // TEMPORARY: Skip animation for testing purposes
        if (skipAnimationForTesting) {
            console.log('TESTING MODE: Skipping animation and transitioning immediately');
            completeTransition();
            return;
        }
        
        // Show animation container
        animationContainer.classList.add('active');
        
        // Once the container is visible, start the transition animation
        setTimeout(() => {
            animateToPianoView();
        }, 500);
    }
    
    // Animate to piano view - improve the transition
    function animateToPianoView() {
        // Disable orbit controls during animation
        if (controls) controls.enabled = false;
        
        // Create a timeline of camera positions
        const startPosition = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
        const midPosition = { x: 0, y: 1.5, z: 3 };
        const endPosition = { x: 0, y: 0.8, z: 1.5 };
        
        // Start rotation animation with smoother easing
        const duration = 3500; // Slightly longer duration for smoother transition
        const startTime = Date.now();
        
        function updateCameraPosition() {
            const elapsed = Date.now() - startTime;
            let progress = Math.min(elapsed / duration, 1);
            
            // Apply easing function for smoother motion
            progress = easeInOutCubic(progress);
            
            if (progress < 0.5) {
                // First half: move to mid position with easing
                const subProgress = progress * 2; // Scale 0-0.5 to 0-1
                camera.position.x = startPosition.x + (midPosition.x - startPosition.x) * subProgress;
                camera.position.y = startPosition.y + (midPosition.y - startPosition.y) * subProgress;
                camera.position.z = startPosition.z + (midPosition.z - startPosition.z) * subProgress;
            } else {
                // Second half: move to end position with easing
                const subProgress = (progress - 0.5) * 2; // Scale 0.5-1 to 0-1
                camera.position.x = midPosition.x + (endPosition.x - midPosition.x) * subProgress;
                camera.position.y = midPosition.y + (endPosition.y - midPosition.y) * subProgress;
                camera.position.z = midPosition.z + (endPosition.z - midPosition.z) * subProgress;
            }
            
            // Adjust piano rotation with smoother motion
            if (piano) {
                // Apply smoother easing to rotation
                piano.rotation.x = 0.2 - (0.2 * easeOutQuad(progress));
                piano.rotation.y = easeInOutQuad(progress) * Math.PI * 2 * 0.25; // Smooth rotation
            }
            
            // Look at the piano - smooth target
            camera.lookAt(0, 0.4 * (1 - progress) + 0.1 * progress, 0);
            
            // Decrease opacity near the end - start fading later for smoother transition
            if (progress > 0.85) {
                const fadeProgress = (progress - 0.85) * (1 / 0.15); // Scale 0.85-1 to 0-1
                piano.traverse((child) => {
                    if (child.isMesh && child.material) {
                        // Use a safer approach to setting opacity
                        if (!child.material.transparent) {
                            child.material.transparent = true;
                        }
                        child.material.opacity = 1 - fadeProgress;
                        // Ensure depthWrite is disabled when transparent
                        child.material.depthWrite = child.material.opacity > 0.5;
                    }
                });
                
                // Fade out scene with easing
                const fadeColorValue = 0.07 * (1 - fadeProgress);
                scene.background.setRGB(fadeColorValue, fadeColorValue, fadeColorValue);
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCameraPosition);
            } else {
                // Animation complete
                completeTransition();
            }
        }
        
        updateCameraPosition();
    }
    
    // Easing functions for smoother animations
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    function easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }
    
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    // Complete the transition and show the target section
    function completeTransition() {
        // Hide animation container
        animationContainer.classList.remove('active');
        
        // Show target section
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        // TEMPORARY: Remove delay for testing purposes
        if (skipAnimationForTesting) {
            document.getElementById(targetSection).style.display = 'block';
            isAnimating = false;
            return;
        }
        
        // Wait a moment before showing the target section
        setTimeout(() => {
            document.getElementById(targetSection).style.display = 'block';
            
            // Reset animation state for next time - but don't remove the cached model
            isAnimating = false;
            loadingProgress = 0;
            progressBar.style.width = '0%';
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
            
            // Reset camera and piano
            if (camera) {
                camera.position.set(0, 3, 5);
                camera.lookAt(0, 0, 0);
            }
            
            if (piano) {
                piano.rotation.x = 0.2;
                piano.rotation.y = 0;
                piano.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = 1;
                        child.material.transparent = false;
                        child.material.depthWrite = true; // Ensure proper depth writing
                        child.material.needsUpdate = true; // Make sure material updates properly
                    }
                });
            }
            
            if (scene) {
                scene.background.setRGB(0.07, 0.07, 0.07);
            }
            
            // Re-enable controls
            if (controls) controls.enabled = true;
        }, 500);
    }
    
    // Initialize 3D animation when the DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initEventListeners();
        initScene();
    });
})();

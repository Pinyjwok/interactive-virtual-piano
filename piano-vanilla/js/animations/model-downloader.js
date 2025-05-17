/**
 * Model Downloader
 * This script is used to download and prepare the 3D piano model
 * It can be run separately in development to ensure models are ready
 */

(function() {
    // URLs for piano models (example URLs - replace with actual models)
    const MODEL_URLS = {
        piano: {
            main: 'https://example.com/models/piano/scene.gltf',
            textures: [
                'https://example.com/models/piano/textures/piano_diffuse.jpg',
                'https://example.com/models/piano/textures/piano_normal.jpg',
                'https://example.com/models/piano/textures/piano_metallic.jpg'
            ]
        }
    };
    
    // Function to preload models
    function preloadModels() {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            
            loader.load(
                MODEL_URLS.piano.main,
                function(gltf) {
                    console.log('Piano model loaded successfully');
                    // Store model in cache if needed
                    localStorage.setItem('piano-model-loaded', 'true');
                    resolve(gltf);
                },
                function(xhr) {
                    // Progress callback
                    const percent = (xhr.loaded / xhr.total) * 100;
                    console.log('Model loading: ' + percent.toFixed(2) + '%');
                },
                function(error) {
                    console.error('Error loading piano model', error);
                    reject(error);
                }
            );
        });
    }
    
    // Function to check if models are already cached
    function areModelsCached() {
        return localStorage.getItem('piano-model-loaded') === 'true';
    }
    
    // Export functions for use in other scripts
    window.ModelDownloader = {
        preloadModels,
        areModelsCached,
        MODEL_URLS
    };
})();

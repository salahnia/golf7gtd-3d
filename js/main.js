/* ============================================
   VISUALIZZATORE 3D VOLKSWAGEN GOLF 7 GTD
   Script principale con Three.js
   ============================================ */

// Importazioni da CDN (Three.js, GLTFLoader, OrbitControls)
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

/* ============================================
   CONFIGURAZIONE INIZIALE SCENA
   ============================================ */

// Riferimento al contenitore principale
const canvasContainer = document.getElementById('viewer');
const loadingScreen = document.getElementById('loading');

// Creazione del renderer WebGL con antialiasing
const renderer = new THREE.WebGLRenderer({ 
  antialias: true, 
  alpha: true 
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasContainer.appendChild(renderer.domElement);

// Creazione della scena con sfondo scuro
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071018);

// Creazione della camera prospettica
const camera = new THREE.PerspectiveCamera(
  45,  // Field of view
  window.innerWidth / window.innerHeight,  // Aspect ratio
  0.1,  // Near clipping plane
  200   // Far clipping plane
);
camera.position.set(4, 1.8, 7);

// Controlli OrbitControls per rotazione con mouse
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Inerzia fluida
controls.dampingFactor = 0.08;
controls.minDistance = 2.5;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2 + 0.2;  // Limita rotazione verso il basso
controls.target.set(0, 0.8, 0);

/* ============================================
   ILLUMINAZIONE REALISTICA
   ============================================ */

// Luce emisferica per illuminazione ambientale morbida
const hemisphereLight = new THREE.HemisphereLight(
  0xddeeff,  // Colore cielo (blu chiaro)
  0x222233,  // Colore terra (blu scuro)
  0.6
);
scene.add(hemisphereLight);

// Luce direzionale principale con ombre
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(6, 12, 8);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

// Luce di riempimento per dettagli nelle zone d'ombra
const fillLight = new THREE.PointLight(0xffffff, 0.2);
fillLight.position.set(-6, 4, -6);
scene.add(fillLight);

// Luce posteriore per contorno
const rimLight = new THREE.DirectionalLight(0x5bd6ff, 0.3);
rimLight.position.set(-4, 3, -5);
scene.add(rimLight);

/* ============================================
   PIANO DI APPOGGIO (Ground)
   ============================================ */

const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x061016, 
  metalness: 0.0, 
  roughness: 0.95 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = -0.01;
scene.add(ground);

/* ============================================
   GESTIONE MODELLO 3D (GLTF)
   ============================================ */

const loader = new GLTFLoader();

// Array per raccogliere le diverse parti del modello
const bodyMeshes = [];      // Carrozzeria
const rimMeshes = [];       // Cerchi/ruote
const interiorMeshes = [];  // Interni
const doorParts = [];       // Porte
const hoodParts = [];       // Cofano

// Contenitore root per il modello
const carRoot = new THREE.Object3D();
scene.add(carRoot);

// Stato dell'applicazione
const state = {
  doorsOpen: false,
  hoodOpen: false,
  idleAutoRotate: true,
  lastInteraction: performance.now(),
  autoRotateSpeed: 0.0015,  // Velocità rotazione automatica
  modelLoaded: false
};

/* ============================================
   FUNZIONI UTILITY
   ============================================ */

/**
 * Trova mesh nel modello che contengono una parola chiave nel nome
 * @param {THREE.Object3D} root - Oggetto radice da cui iniziare la ricerca
 * @param {string} keyword - Parola chiave da cercare (case-insensitive)
 * @returns {Array} Array di mesh trovate
 */
function findMeshesByNameKeyword(root, keyword) {
  const found = [];
  root.traverse((node) => {
    if (node.isMesh && node.name && node.name.toLowerCase().includes(keyword.toLowerCase())) {
      found.push(node);
    }
  });
  return found;
}

/**
 * Centra e scala il modello per adattarlo alla scena
 * @param {THREE.Object3D} rootObj - Oggetto da centrare
 * @param {number} desiredHeight - Altezza desiderata del modello
 */
function centerAndScaleModel(rootObj, desiredHeight = 1.2) {
  // Calcola bounding box del modello
  const box = new THREE.Box3().setFromObject(rootObj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Scala in base all'altezza desiderata
  const scale = desiredHeight / size.y;
  rootObj.scale.setScalar(scale);

  // Riposiziona al livello del suolo e centra
  const box2 = new THREE.Box3().setFromObject(rootObj);
  const center2 = new THREE.Vector3();
  box2.getCenter(center2);
  const yMin = box2.min.y;

  rootObj.position.set(-center2.x, -yMin, -center2.z);
}

/**
 * Crea pivot per animare porte e cofano
 * @param {Array} parts - Array di mesh da preparare
 * @param {string} type - Tipo di parte ('door' o 'hood')
 */
function preparePivotsForParts(parts, type) {
  parts.forEach((mesh) => {
    // Se già ha un pivot, salta
    if (mesh.userData.pivot) return;

    // Calcola bounding box della mesh
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Crea pivot (punto di rotazione)
    const parent = mesh.parent || carRoot;
    const pivot = new THREE.Object3D();
    parent.add(pivot);

    // Posiziona il pivot in base al tipo di parte
    let pivotPos = center.clone();

    if (type === 'door') {
      // Per le porte: pivot sul lato esterno
      const side = (center.x > 0) ? 1 : -1;
      pivotPos.x = side === 1 ? box.max.x : box.min.x;
      pivotPos.y = center.y;
      pivotPos.z = center.z;
    } else if (type === 'hood') {
      // Per il cofano: pivot sulla parte posteriore (cerniera)
      pivotPos.x = center.x;
      pivotPos.y = center.y;
      pivotPos.z = box.max.z;
    }

    pivot.position.copy(pivotPos);

    // Salva la matrice world della mesh
    mesh.updateMatrixWorld();
    const worldMatrix = mesh.matrixWorld.clone();

    // Rimuovi la mesh dal parent originale
    parent.remove(mesh);

    // Aggiungi la mesh come figlia del pivot
    pivot.add(mesh);

    // Ricalcola la posizione locale della mesh per mantenere la stessa posizione world
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrix();

    // Applica la trasformazione inversa del pivot
    const pivotWorldMatrix = new THREE.Matrix4();
    pivot.updateMatrixWorld();
    pivotWorldMatrix.copy(pivot.matrixWorld);
    const pivotInverse = new THREE.Matrix4().copy(pivotWorldMatrix).invert();
    
    const localMatrix = new THREE.Matrix4().multiplyMatrices(pivotInverse, worldMatrix);
    mesh.matrix.copy(localMatrix);
    mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);

    // Salva riferimenti
    mesh.userData.pivot = pivot;
    mesh.userData.type = type;
    mesh.userData.initialRotation = pivot.rotation.clone();
  });
}

/* ============================================
   CARICAMENTO MODELLO GLTF
   ============================================ */

loader.load(
  'models/golf7.gltf',
  
  // Callback di successo
  (gltf) => {
    console.log('✅ Modello caricato con successo!');
    
    // Pulisci root precedente
    carRoot.clear();

    const model = gltf.scene || gltf.scenes[0];
    
    // Configura ombre e materiali per tutte le mesh
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        // Clona i materiali per poterli modificare indipendentemente
        if (Array.isArray(node.material)) {
          node.material = node.material.map(m => m.clone());
        } else if (node.material) {
          node.material = node.material.clone();
        }
      }
    });

    // Aggiungi il modello al root
    carRoot.add(model);

    /* ============================================
       RICONOSCIMENTO AUTOMATICO PARTI
       ============================================ */

    // Carrozzeria (body, paint, exterior)
    const bodyKeywords = ['body', 'carro', 'paint', 'coat', 'exterior', 'shell'];
    bodyKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!bodyMeshes.includes(m)) bodyMeshes.push(m);
      });
    });

    // Cerchi/ruote (wheels, rims)
    const wheelKeywords = ['wheel', 'rim', 'alloy', 'tire', 'ruota'];
    wheelKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!rimMeshes.includes(m)) rimMeshes.push(m);
      });
    });

    // Interni (interior, seats, dashboard)
    const interiorKeywords = ['interior', 'seat', 'dashboard', 'inner', 'sedile'];
    interiorKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!interiorMeshes.includes(m)) interiorMeshes.push(m);
      });
    });

    // Porte (doors)
    const doorKeywords = ['door', 'porta', 'porte'];
    doorKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!doorParts.includes(m)) doorParts.push(m);
      });
    });

    // Cofano (hood, bonnet)
    const hoodKeywords = ['hood', 'bonnet', 'cofano'];
    hoodKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!hoodParts.includes(m)) hoodParts.push(m);
      });
    });

    // Fallback: se non troviamo parti specifiche, usa euristica geometrica
    if (doorParts.length === 0) {
      console.log('⚠️ Porte non trovate per nome, uso euristica geometrica...');
      model.traverse((m) => {
        if (m.isMesh) {
          const box = new THREE.Box3().setFromObject(m);
          const size = new THREE.Vector3();
          box.getSize(size);
          // Cerca mesh piatte e verticali (possibili porte)
          if (size.x > 0.3 && size.y > 0.5 && size.z > 0.05 && size.z < 0.5) {
            doorParts.push(m);
          }
        }
      });
    }

    if (hoodParts.length === 0) {
      console.log('⚠️ Cofano non trovato per nome, uso euristica geometrica...');
      // Cerca la mesh più anteriore (Z minimo)
      let candidate = null;
      let minZ = Infinity;
      model.traverse((m) => {
        if (m.isMesh) {
          const box = new THREE.Box3().setFromObject(m);
          const center = new THREE.Vector3();
          box.getCenter(center);
          if (center.z < minZ && Math.abs(center.x) < 1.5) {
            minZ = center.z;
            candidate = m;
          }
        }
      });
      if (candidate) hoodParts.push(candidate);
    }

    // Log diagnostico
    console.log('📊 Parti riconosciute:');
    console.log('  - Carrozzeria:', bodyMeshes.length, 'mesh');
    console.log('  - Cerchi:', rimMeshes.length, 'mesh');
    console.log('  - Interni:', interiorMeshes.length, 'mesh');
    console.log('  - Porte:', doorParts.length, 'mesh');
    console.log('  - Cofano:', hoodParts.length, 'mesh');

    // Centra e scala il modello
    centerAndScaleModel(carRoot, 1.2);

    // Inizializza materiali PBR per riflessi realistici
    function initPBRMaterials(meshes, metalness = 0.6, roughness = 0.3) {
      meshes.forEach(m => {
        if (m.material) {
          if ('metalness' in m.material) {
            m.material.metalness = metalness;
          }
          if ('roughness' in m.material) {
            m.material.roughness = roughness;
          }
          m.material.needsUpdate = true;
        }
      });
    }

    // Applica materiali PBR
    initPBRMaterials(bodyMeshes, 0.7, 0.25);  // Carrozzeria lucida
    initPBRMaterials(rimMeshes, 0.9, 0.15);   // Cerchi metallici
    initPBRMaterials(interiorMeshes, 0.1, 0.8); // Interni opachi

    // Prepara pivot per animazioni
    preparePivotsForParts(doorParts, 'door');
    preparePivotsForParts(hoodParts, 'hood');

    // Nascondi schermata di caricamento
    state.modelLoaded = true;
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  },
  
  // Callback di progresso
  (xhr) => {
    const percentComplete = (xhr.loaded / xhr.total) * 100;
    console.log(`📦 Caricamento: ${Math.round(percentComplete)}%`);
  },
  
  // Callback di errore
  (error) => {
    console.error('❌ Errore caricamento modello:', error);
    const loadingText = loadingScreen.querySelector('p');
    if (loadingText) {
      loadingText.textContent = '⚠️ Errore: Modello non trovato. Assicurati che il file models/golf7.gltf esista.';
      loadingText.style.color = '#ff6b6b';
    }
  }
);

/* ============================================
   FUNZIONI DI ANIMAZIONE PARTI
   ============================================ */

/**
 * Anima l'apertura/chiusura delle porte
 * @param {boolean} open - true per aprire, false per chiudere
 */
function animateDoors(open = true) {
  const targetAngle = open ? Math.PI / 2.5 : 0;  // ~72 gradi
  
  doorParts.forEach(mesh => {
    if (mesh.userData && mesh.userData.pivot) {
      // Determina direzione in base alla posizione X
      const side = (mesh.userData.pivot.position.x >= 0) ? 1 : -1;
      mesh.userData.rotationTarget = side * targetAngle;
      mesh.userData.animating = true;
    }
  });
}

/**
 * Anima l'apertura/chiusura del cofano
 * @param {boolean} open - true per aprire, false per chiudere
 */
function animateHood(open = true) {
  const targetAngle = open ? -Math.PI / 3 : 0;  // ~60 gradi verso l'alto
  
  hoodParts.forEach(mesh => {
    if (mesh.userData && mesh.userData.pivot) {
      mesh.userData.rotationTarget = targetAngle;
      mesh.userData.animating = true;
    }
  });
}

/* ============================================
   FUNZIONI DI PERSONALIZZAZIONE
   ============================================ */

/**
 * Applica un colore alla carrozzeria con transizione fluida
 * @param {string} hexColor - Colore in formato esadecimale
 */
function applyBodyColor(hexColor) {
  const targetColor = new THREE.Color(hexColor);
  
  bodyMeshes.forEach(mesh => {
    if (!mesh.material || !mesh.material.color) return;
    
    // Salva colore corrente e target per interpolazione
    mesh.userData.colorTween = {
      from: mesh.material.color.clone(),
      to: targetColor,
      progress: 0
    };
  });
}

/**
 * Applica uno stile ai cerchi
 * @param {string} style - Stile da applicare ('style1', 'style2', 'style3')
 */
function applyRimStyle(style) {
  // Definisci gli stili disponibili
  const styles = {
    style1: { color: 0x111111, metalness: 0.2, roughness: 0.6 },   // Scuro opaco
    style2: { color: 0xf7f7f7, metalness: 0.95, roughness: 0.1 },  // Lucido cromato
    style3: { color: 0x7e7e7e, metalness: 0.75, roughness: 0.25 }  // Metallico grigio
  };

  const targetStyle = styles[style] || styles.style1;

  rimMeshes.forEach(mesh => {
    if (!mesh.material) return;
    
    mesh.userData.rimTween = {
      fromColor: mesh.material.color.clone(),
      toColor: new THREE.Color(targetStyle.color),
      fromMetalness: mesh.material.metalness || 0.5,
      toMetalness: targetStyle.metalness,
      fromRoughness: mesh.material.roughness || 0.5,
      toRoughness: targetStyle.roughness,
      progress: 0
    };
  });
}

/**
 * Applica un colore agli interni
 * @param {string} mode - Modalità colore ('black', 'light', 'beige')
 */
function applyInteriorColor(mode) {
  const colors = {
    black: '#111111',
    light: '#e5e5e5',
    beige: '#d6bea6'
  };

  const targetHex = colors[mode] || colors.black;
  const targetColor = new THREE.Color(targetHex);

  interiorMeshes.forEach(mesh => {
    if (!mesh.material || !mesh.material.color) return;
    
    mesh.userData.interiorTween = {
      from: mesh.material.color.clone(),
      to: targetColor,
      progress: 0
    };
  });
}

/* ============================================
   SETUP INTERFACCIA UTENTE
   ============================================ */

function setupUI() {
  // Pulsanti colore carrozzeria
  document.querySelectorAll('#color-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      applyBodyColor(color);
      touchInteraction();
    });
  });

  // Pulsanti cerchi
  document.querySelectorAll('#rim-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.rim;
      applyRimStyle(style);
      touchInteraction();
    });
  });

  // Pulsante porte
  const doorsBtn = document.getElementById('toggle-doors');
  if (doorsBtn) {
    doorsBtn.addEventListener('click', () => {
      state.doorsOpen = !state.doorsOpen;
      animateDoors(state.doorsOpen);
      doorsBtn.textContent = state.doorsOpen ? '🚪 Chiudi porte' : '🚪 Apri porte';
      touchInteraction();
    });
  }

  // Pulsante cofano
  const hoodBtn = document.getElementById('toggle-hood');
  if (hoodBtn) {
    hoodBtn.addEventListener('click', () => {
      state.hoodOpen = !state.hoodOpen;
      animateHood(state.hoodOpen);
      hoodBtn.textContent = state.hoodOpen ? '🔧 Chiudi cofano' : '🔧 Apri cofano';
      touchInteraction();
    });
  }

  // Pulsanti interni
  document.querySelectorAll('#interior-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.interior;
      applyInteriorColor(mode);
      touchInteraction();
    });
  });

  // Eventi per disattivare auto-rotazione durante interazione
  ['pointerdown', 'wheel', 'touchstart'].forEach(eventType => {
    window.addEventListener(eventType, touchInteraction, { passive: true });
  });

  // Riattiva auto-rotazione dopo 4 secondi di inattività
  setInterval(() => {
    if (performance.now() - state.lastInteraction > 4000) {
      state.idleAutoRotate = true;
    }
  }, 500);
}

/**
 * Registra interazione utente
 */
function touchInteraction() {
  state.lastInteraction = performance.now();
  state.idleAutoRotate = false;
}

// Inizializza UI
setupUI();

/* ============================================
   LOOP DI ANIMAZIONE E RENDERING
   ============================================ */

const clock = new THREE.Clock();

/**
 * Aggiorna tutte le interpolazioni (tweens) per transizioni fluide
 */
function updateTweens(deltaTime) {
  const tweenSpeed = 2.5;  // Velocità delle transizioni

  // Tween colore carrozzeria
  bodyMeshes.forEach(mesh => {
    const tween = mesh.userData.colorTween;
    if (tween) {
      tween.progress = Math.min(1, tween.progress + deltaTime * tweenSpeed);
      mesh.material.color.lerpColors(tween.from, tween.to, tween.progress);
      
      if (tween.progress >= 1) {
        delete mesh.userData.colorTween;
      }
    }
  });

  // Tween cerchi
  rimMeshes.forEach(mesh => {
    const tween = mesh.userData.rimTween;
    if (tween) {
      tween.progress = Math.min(1, tween.progress + deltaTime * tweenSpeed);
      
      mesh.material.color.lerpColors(tween.fromColor, tween.toColor, tween.progress);
      
      if ('metalness' in mesh.material) {
        mesh.material.metalness = THREE.MathUtils.lerp(
          tween.fromMetalness, 
          tween.toMetalness, 
          tween.progress
        );
      }
      
      if ('roughness' in mesh.material) {
        mesh.material.roughness = THREE.MathUtils.lerp(
          tween.fromRoughness, 
          tween.toRoughness, 
          tween.progress
        );
      }
      
      if (tween.progress >= 1) {
        delete mesh.userData.rimTween;
      }
    }
  });

  // Tween interni
  interiorMeshes.forEach(mesh => {
    const tween = mesh.userData.interiorTween;
    if (tween) {
      tween.progress = Math.min(1, tween.progress + deltaTime * tweenSpeed);
      mesh.material.color.lerpColors(tween.from, tween.to, tween.progress);
      
      if (tween.progress >= 1) {
        delete mesh.userData.interiorTween;
      }
    }
  });

  // Animazioni porte e cofano
  const animationSpeed = 3.5;
  const allParts = [...doorParts, ...hoodParts];
  
  allParts.forEach(mesh => {
    if (mesh.userData.animating && mesh.userData.pivot) {
      const pivot = mesh.userData.pivot;
      const target = mesh.userData.rotationTarget || 0;
      
      if (mesh.userData.type === 'door') {
        // Interpola rotazione Y per le porte
        pivot.rotation.y = THREE.MathUtils.lerp(
          pivot.rotation.y, 
          target, 
          deltaTime * animationSpeed
        );
        
        // Ferma animazione quando vicino al target
        if (Math.abs(pivot.rotation.y - target) < 0.001) {
          pivot.rotation.y = target;
          mesh.userData.animating = false;
        }
      } else if (mesh.userData.type === 'hood') {
        // Interpola rotazione X per il cofano
        pivot.rotation.x = THREE.MathUtils.lerp(
          pivot.rotation.x, 
          target, 
          deltaTime * animationSpeed
        );
        
        if (Math.abs(pivot.rotation.x - target) < 0.001) {
          pivot.rotation.x = target;
          mesh.userData.animating = false;
        }
      }
    }
  });
}

/**
 * Ridimensiona il renderer quando la finestra cambia dimensione
 */
function handleResize() {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height, false);
}

// Listener per ridimensionamento finestra
window.addEventListener('resize', handleResize);
handleResize();

/**
 * Loop principale di animazione
 */
function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();

  // Auto-rotazione quando l'utente è inattivo
  if (state.idleAutoRotate && state.modelLoaded) {
    carRoot.rotation.y += state.autoRotateSpeed * deltaTime * 60;
  }

  // Aggiorna tutte le interpolazioni
  updateTweens(deltaTime);

  // Aggiorna controlli OrbitControls
  controls.update();

  // Renderizza la scena
  renderer.render(scene, camera);
}

// Avvia il loop di animazione
animate();

/* ============================================
   LOG INIZIALE
   ============================================ */

console.log('🚗 Visualizzatore 3D Volkswagen Golf 7 GTD');
console.log('📦 Three.js caricato');
console.log('🎮 Controlli attivi');
console.log('⏳ In attesa del modello...');

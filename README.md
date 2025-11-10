# 🚗 Visualizzatore 3D Volkswagen Golf 7 GTD

Un'applicazione web interattiva per visualizzare e personalizzare in 3D la tua Volkswagen Golf 7 GTD utilizzando Three.js.

![Three.js](https://img.shields.io/badge/Three.js-0.158.0-black?style=flat-square&logo=three.js)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

## ✨ Caratteristiche

### 🎨 Personalizzazione Completa
- **Colori carrozzeria**: 4 colori disponibili (Rosso, Bianco, Nero, Grigio)
- **Cerchi**: 3 stili diversi (Scuro, Lucido, Metallico)
- **Interni**: 3 colorazioni (Nero, Chiaro, Beige)

### 🚪 Animazioni Interattive
- Apertura/chiusura porte con animazioni fluide
- Apertura/chiusura cofano per vedere il motore
- Transizioni smooth con interpolazione

### 🎮 Controlli Intuitivi
- **Rotazione**: Click sinistro + trascina
- **Zoom**: Rotella del mouse o pinch su touch
- **Pan**: Click destro + trascina (o due dita su touch)
- **Auto-rotazione**: Attivata automaticamente dopo 4 secondi di inattività

### 💡 Illuminazione Realistica
- Luce emisferica per illuminazione ambientale
- Luce direzionale con ombre dinamiche
- Luci di riempimento e contorno
- Materiali PBR (Physically Based Rendering) per riflessi realistici

### 🎯 Design Moderno
- Interfaccia glass-morphism con effetto blur
- Pannello controlli semi-trasparente
- Design responsive per desktop, tablet e mobile
- Font moderno (Inter da Google Fonts)

## 📁 Struttura del Progetto

```
/vercel/sandbox/
├── index.html          # Pagina principale HTML
├── styles.css          # Stili CSS con glass-morphism
├── js/
│   └── main.js        # Script principale Three.js
└── models/
    └── golf7.gltf     # Modello 3D della Golf 7 GTD (da aggiungere)
```

## 🚀 Come Utilizzare

### 1. Preparazione del Modello 3D

Posiziona il tuo file modello 3D nella cartella `models/`:

```bash
# Assicurati che il file sia nominato correttamente
models/golf7.gltf
```

**Formati supportati**: GLTF (.gltf) o GLB (.glb)

> **Nota**: Se il tuo modello è in formato GLB, modifica il path in `js/main.js` alla riga del loader:
> ```javascript
> loader.load('models/golf7.glb', ...
> ```

### 2. Avvio del Server Locale

Per visualizzare l'applicazione, è necessario un server web locale (a causa delle restrizioni CORS per il caricamento dei modelli).

#### Opzione A: Python (se installato)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Opzione B: Node.js con http-server

```bash
# Installa http-server globalmente (una volta sola)
npm install -g http-server

# Avvia il server
http-server -p 8000
```

#### Opzione C: VS Code Live Server

Se usi Visual Studio Code:
1. Installa l'estensione "Live Server"
2. Click destro su `index.html`
3. Seleziona "Open with Live Server"

### 3. Apertura nel Browser

Apri il browser e vai a:
```
http://localhost:8000
```

## 🎮 Guida ai Controlli

### Pannello Controlli

| Controllo | Funzione |
|-----------|----------|
| **🎨 Colore carrozzeria** | Cambia il colore della carrozzeria tra 4 opzioni |
| **⚙️ Cerchi** | Seleziona tra 3 stili di cerchi diversi |
| **🚪 Portiere** | Apri/chiudi le porte dell'auto |
| **🔧 Cofano** | Apri/chiudi il cofano per vedere il motore |
| **🪑 Colori interni** | Cambia il colore degli interni |

### Controlli Mouse/Touch

- **Rotazione**: Click sinistro + trascina (o un dito su touch)
- **Zoom**: Rotella del mouse (o pinch con due dita)
- **Pan**: Click destro + trascina (o due dita su touch)

## 🔧 Personalizzazione del Codice

### Modificare i Colori della Carrozzeria

Modifica l'array dei colori in `index.html`:

```html
<button data-color="#b30000" title="Rosso">Rosso</button>
<button data-color="#ffffff" title="Bianco">Bianco</button>
<!-- Aggiungi altri colori qui -->
```

### Modificare la Velocità di Auto-Rotazione

In `js/main.js`, modifica la proprietà `autoRotateSpeed`:

```javascript
const state = {
  autoRotateSpeed: 0.0015,  // Aumenta per rotazione più veloce
  // ...
};
```

### Modificare l'Illuminazione

In `js/main.js`, sezione illuminazione:

```javascript
// Luce direzionale principale
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(6, 12, 8);  // Modifica posizione
```

### Aggiungere Nuovi Stili di Cerchi

In `js/main.js`, funzione `applyRimStyle`:

```javascript
const styles = {
  style1: { color: 0x111111, metalness: 0.2, roughness: 0.6 },
  style2: { color: 0xf7f7f7, metalness: 0.95, roughness: 0.1 },
  style3: { color: 0x7e7e7e, metalness: 0.75, roughness: 0.25 },
  style4: { color: 0xff0000, metalness: 0.8, roughness: 0.2 }  // Nuovo stile rosso
};
```

## 📝 Note sul Modello 3D

### Nomenclatura delle Parti

Il codice riconosce automaticamente le parti del modello in base ai nomi dei nodi. Per risultati ottimali, assicurati che il tuo modello GLTF abbia nomi che includano:

- **Carrozzeria**: `body`, `paint`, `exterior`, `shell`
- **Cerchi**: `wheel`, `rim`, `alloy`, `tire`
- **Interni**: `interior`, `seat`, `dashboard`
- **Porte**: `door`, `porta`
- **Cofano**: `hood`, `bonnet`, `cofano`

### Fallback Automatico

Se il modello non ha nomi specifici, il codice usa **euristica geometrica** per identificare le parti:
- Cerca mesh piatte e verticali per le porte
- Identifica la mesh più anteriore come cofano
- Questo potrebbe non essere sempre accurato

### Ottimizzazione del Modello

Per prestazioni ottimali:
- Mantieni il numero di poligoni sotto 100k
- Usa texture compresse (JPG invece di PNG quando possibile)
- Considera l'uso di formato GLB (binario) invece di GLTF per file più piccoli

## 🐛 Risoluzione Problemi

### Il modello non si carica

1. **Verifica il path**: Assicurati che il file sia in `models/golf7.gltf`
2. **Controlla la console**: Apri DevTools (F12) e guarda eventuali errori
3. **Server locale**: Assicurati di usare un server web locale, non `file://`
4. **Formato file**: Verifica che il file sia GLTF/GLB valido

### Le parti non vengono riconosciute

1. **Controlla i nomi**: Apri il file GLTF in un editor di testo e verifica i nomi dei nodi
2. **Console log**: Guarda i log nella console per vedere quali parti sono state trovate
3. **Modifica keywords**: Aggiungi le tue parole chiave nell'array `bodyKeywords`, `wheelKeywords`, etc.

### Prestazioni lente

1. **Riduci la qualità delle ombre**: In `js/main.js`, riduci `shadow.mapSize`
2. **Disabilita antialiasing**: Cambia `antialias: false` nel renderer
3. **Ottimizza il modello**: Riduci il numero di poligoni

### Animazioni non fluide

1. **Verifica FPS**: Apri DevTools > Performance per controllare il framerate
2. **Riduci qualità**: Disabilita ombre o riduci la risoluzione del renderer
3. **Controlla pivot**: Assicurati che i pivot siano stati creati correttamente

## 🎨 Personalizzazione Avanzata

### Aggiungere Nuove Animazioni

Esempio per animare il bagagliaio:

```javascript
// In js/main.js, dopo la sezione di caricamento del modello

const trunkParts = [];
findMeshesByNameKeyword(model, 'trunk').forEach(m => {
  if (!trunkParts.includes(m)) trunkParts.push(m);
});

preparePivotsForParts(trunkParts, 'trunk');

function animateTrunk(open = true) {
  const targetAngle = open ? Math.PI / 2.5 : 0;
  trunkParts.forEach(mesh => {
    if (mesh.userData && mesh.userData.pivot) {
      mesh.userData.rotationTarget = targetAngle;
      mesh.userData.animating = true;
    }
  });
}
```

### Aggiungere Effetti Particellari

Per aggiungere effetti come fumo dallo scarico o pioggia:

```javascript
// Crea un sistema di particelle
const particleGeometry = new THREE.BufferGeometry();
const particleCount = 1000;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 10;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.05,
  transparent: true,
  opacity: 0.6
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);
```

## 📚 Risorse Utili

- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [GLTF Viewer Online](https://gltf-viewer.donmccurdy.com/)
- [Blender (per creare/modificare modelli 3D)](https://www.blender.org/)

## 📄 Licenza

Questo progetto è fornito "as-is" per scopi educativi e dimostrativi.

## 🤝 Contributi

Sentiti libero di modificare e migliorare il codice secondo le tue esigenze!

---

**Creato con ❤️ usando Three.js**

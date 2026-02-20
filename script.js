// --- 1. IMPORTACIONES DE FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDNTBGYK3b5H51jPshSte1iAx39Dbq5Ozs",
    authDomain: "snkonline-57120.firebaseapp.com",
    projectId: "snkonline-57120",
    storageBucket: "snkonline-57120.firebasestorage.app",
    messagingSenderId: "423981876403",
    appId: "1:423981876403:web:4edfd365fca6fabcd69cc6",
    measurementId: "G-8QNTSRXZVW"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const scoresCol = collection(db, "highscores");

// --- 3. VARIABLES DEL JUEGO Y DOM ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreElement = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

// Variables para Firebase UI
const saveBtn = document.getElementById("save-score-btn");
const nameInput = document.getElementById("player-name");
const rankingList = document.getElementById("ranking-list");
const saveSection = document.getElementById("save-section");

const gridSize = 20;
let score = 0;
let dx = gridSize;
let dy = 0;
let changingDirection = false;
let snake = [];
let foodX;
let foodY;
let gameLoopTimeout;

// --- 4. FUNCIONES DE FIREBASE ---
async function loadRankings() {
    rankingList.innerHTML = "<li>Cargando rankings...</li>";
    try {
        const q = query(scoresCol, orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        rankingList.innerHTML = ""; // Limpiar lista
        let position = 1;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement("li");
            li.innerHTML = `<strong>#${position}</strong> ${data.name}: ${data.score} pts`;
            rankingList.appendChild(li);
            position++;
        });
    } catch (error) {
        console.error("Error al cargar rankings:", error);
        rankingList.innerHTML = "<li>Error al cargar la tabla.</li>";
    }
}

saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim() || "Anónimo";
    saveBtn.disabled = true;
    saveBtn.innerText = "Guardando...";

    try {
        await addDoc(scoresCol, {
            name: name,
            score: score,
            timestamp: new Date()
        });
        saveSection.style.display = "none"; // Ocultar formulario tras guardar
        loadRankings(); // Recargar tabla
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error al guardar tu puntuación.");
        saveBtn.disabled = false;
        saveBtn.innerText = "Guardar Puntuación";
    }
});

// --- 5. LÓGICA DEL JUEGO ---
function initGame() {
    snake = [
        { x: 200, y: 200 },
        { x: 180, y: 200 },
        { x: 160, y: 200 }
    ];
    score = 0;
    dx = gridSize;
    dy = 0;
    scoreElement.innerHTML = score;
    gameOverScreen.classList.add("hidden");
    
    // Restaurar UI de guardado
    if (saveSection) saveSection.style.display = "block";
    saveBtn.disabled = false;
    saveBtn.innerText = "Guardar Puntuación";
    nameInput.value = "";

    generateFood();
    main();
}

function main() {
    if (hasGameEnded()) {
        gameOverScreen.classList.remove("hidden");
        finalScoreElement.innerText = score;
        loadRankings(); // Cargar la tabla al perder
        return;
    }

    changingDirection = false;
    gameLoopTimeout = setTimeout(function onTick() {
        clearCanvas();
        drawFood();
        advanceSnake();
        drawSnake();
        main();
    }, 100);
}

function clearCanvas() {
    ctx.fillStyle = "#ecf0f1";
    ctx.strokeStyle = "#34495e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach(part => {
        ctx.fillStyle = "#27ae60";
        ctx.strokeStyle = "#2c3e50";
        ctx.fillRect(part.x, part.y, gridSize, gridSize);
        ctx.strokeRect(part.x, part.y, gridSize, gridSize);
    });
}

function drawFood() {
    ctx.fillStyle = "#e74c3c";
    ctx.strokeStyle = "#c0392b";
    ctx.fillRect(foodX, foodY, gridSize, gridSize);
    ctx.strokeRect(foodX, foodY, gridSize, gridSize);
}

function advanceSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (snake[0].x === foodX && snake[0].y === foodY) {
        score += 1;
        scoreElement.innerHTML = score;
        generateFood();
    } else {
        snake.pop();
    }
}

function randomGridPosition(min, max) {
    return Math.round((Math.random() * (max - min) + min) / gridSize) * gridSize;
}

function generateFood() {
    foodX = randomGridPosition(0, canvas.width - gridSize);
    foodY = randomGridPosition(0, canvas.height - gridSize);

    snake.forEach(function hasSnakeEatenFood(part) {
        if (part.x === foodX && part.y === foodY) generateFood();
    });
}

function hasGameEnded() {
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    return snake[0].x < 0 || snake[0].x >= canvas.width || snake[0].y < 0 || snake[0].y >= canvas.height;
}

// --- 6. CONTROLES DE TECLADO ---
document.addEventListener("keydown", event => {
    const LEFT_KEY = 37, A_KEY = 65;
    const RIGHT_KEY = 39, D_KEY = 68;
    const UP_KEY = 38, W_KEY = 87;
    const DOWN_KEY = 40, S_KEY = 83;

    if (changingDirection) return;
    const keyPressed = event.keyCode;

    const goingUp = dy === -gridSize;
    const goingDown = dy === gridSize;
    const goingRight = dx === gridSize;
    const goingLeft = dx === -gridSize;

    if ((keyPressed === LEFT_KEY || keyPressed === A_KEY) && !goingRight) {
        dx = -gridSize; dy = 0; changingDirection = true;
    }
    if ((keyPressed === UP_KEY || keyPressed === W_KEY) && !goingDown) {
        dx = 0; dy = -gridSize; changingDirection = true;
    }
    if ((keyPressed === RIGHT_KEY || keyPressed === D_KEY) && !goingLeft) {
        dx = gridSize; dy = 0; changingDirection = true;
    }
    if ((keyPressed === DOWN_KEY || keyPressed === S_KEY) && !goingUp) {
        dx = 0; dy = gridSize; changingDirection = true;
    }
});

// --- 7. CONTROLES TÁCTILES (SWIPE) ---
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

canvas.addEventListener('touchend', e => {
    if (changingDirection) return;
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;

    let dxTouch = touchEndX - touchStartX;
    let dyTouch = touchEndY - touchStartY;

    const goingUp = dy === -gridSize;
    const goingDown = dy === gridSize;
    const goingRight = dx === gridSize;
    const goingLeft = dx === -gridSize;

    if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
        if (dxTouch > 0 && !goingLeft) { dx = gridSize; dy = 0; changingDirection = true; } 
        else if (dxTouch < 0 && !goingRight) { dx = -gridSize; dy = 0; changingDirection = true; } 
    } else {
        if (dyTouch > 0 && !goingUp) { dx = 0; dy = gridSize; changingDirection = true; } 
        else if (dyTouch < 0 && !goingDown) { dx = 0; dy = -gridSize; changingDirection = true; } 
    }
}, { passive: false });

canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

restartBtn.addEventListener("click", () => {
    clearTimeout(gameLoopTimeout);
    initGame();
});

// Iniciar por primera vez
initGame();

// 1. Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDNTBGYK3b5H51jPshSte1iAx39Dbq5Ozs",
    authDomain: "snkonline-57120.firebaseapp.com",
    projectId: "snkonline-57120",
    storageBucket: "snkonline-57120.firebasestorage.app",
    messagingSenderId: "423981876403",
    appId: "1:423981876403:web:4edfd365fca6fabcd69cc6",
    measurementId: "G-8QNTSRXZVW"
};
// ------------------------------------------------

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const scoresCol = collection(db, "highscores");

// Variables del Juego
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreElement = document.getElementById("final-score");
const saveBtn = document.getElementById("save-score-btn");
const nameInput = document.getElementById("player-name");
const rankingList = document.getElementById("ranking-list");

const gridSize = 20;
let score = 0;
let dx = gridSize, dy = 0;
let snake = [];
let foodX, foodY;
let gameLoopTimeout;
let changingDirection = false;

// --- LÓGICA DE FIREBASE ---

// Guardar puntuación
saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim() || "Anónimo";
    saveBtn.disabled = true;
    saveBtn.innerText = "Guardando...";

    try {
        await addDoc(scoresCol, {
            name: name,
            score: score,
            date: new Date()
        });
        alert("¡Puntuación guardada!");
        document.getElementById("save-section").style.display = "none"; // Ocultar form tras guardar
        loadRankings(); // Recargar tabla
    } catch (e) {
        console.error("Error al guardar: ", e);
        alert("Error al guardar. Revisa tu conexión.");
        saveBtn.disabled = false;
    }
});

// Cargar Ranking (Top 10)
async function loadRankings() {
    rankingList.innerHTML = "Cargando...";
    const q = query(scoresCol, orderBy("score", "desc"), limit(10));

    try {
        const querySnapshot = await getDocs(q);
        rankingList.innerHTML = "";
        let position = 1;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement("li");
            li.innerHTML = `<span class="rank-pos">#${position}</span> ${data.name} <span>${data.score} pts</span>`;
            rankingList.appendChild(li);
            position++;
        });
    } catch (e) {
        rankingList.innerHTML = "Error al cargar rankings.";
        console.error(e);
    }
}

// --- LÓGICA DEL JUEGO ---

function initGame() {
    snake = [{ x: 200, y: 200 }, { x: 180, y: 200 }, { x: 160, y: 200 }];
    score = 0;
    dx = gridSize; dy = 0;
    scoreElement.innerHTML = score;
    gameOverScreen.classList.add("hidden");
    document.getElementById("save-section").style.display = "block"; // Mostrar form de nuevo
    saveBtn.disabled = false;
    saveBtn.innerText = "Guardar Puntuación";

    generateFood();
    main();
}

function main() {
    if (hasGameEnded()) {
        gameOverScreen.classList.remove("hidden");
        finalScoreElement.innerText = score;
        loadRankings(); // Cargar rankings al perder
        return;
    }
    changingDirection = false;
    gameLoopTimeout = setTimeout(() => {
        clearCanvas();
        drawFood();
        advanceSnake();
        drawSnake();
        main();
    }, 100);
}

function clearCanvas() {
    ctx.fillStyle = "#ecf0f1"; ctx.strokeStyle = "#34495e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach(part => {
        ctx.fillStyle = "#27ae60"; ctx.strokeStyle = "#2c3e50";
        ctx.fillRect(part.x, part.y, gridSize, gridSize);
        ctx.strokeRect(part.x, part.y, gridSize, gridSize);
    });
}

function drawFood() {
    ctx.fillStyle = "#e74c3c"; ctx.strokeStyle = "#c0392b";
    ctx.fillRect(foodX, foodY, gridSize, gridSize);
    ctx.strokeRect(foodX, foodY, gridSize, gridSize);
}

function advanceSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    if (snake[0].x === foodX && snake[0].y === foodY) {
        score++;
        scoreElement.innerHTML = score;
        generateFood();
    } else {
        snake.pop();
    }
}

function generateFood() {
    foodX = Math.round((Math.random() * (canvas.width - gridSize)) / gridSize) * gridSize;
    foodY = Math.round((Math.random() * (canvas.height - gridSize)) / gridSize) * gridSize;
    snake.forEach(part => { if (part.x === foodX && part.y === foodY) generateFood(); });
}

function hasGameEnded() {
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    return snake[0].x < 0 || snake[0].x >= canvas.width || snake[0].y < 0 || snake[0].y >= canvas.height;
}

// Controles Teclado
document.addEventListener("keydown", event => {
    if (changingDirection) return;
    const key = event.keyCode;
    const up = dy === -gridSize, down = dy === gridSize, right = dx === gridSize, left = dx === -gridSize;
    if ((key === 37 || key === 65) && !right) { dx = -gridSize; dy = 0; changingDirection = true; }
    if ((key === 38 || key === 87) && !down) { dx = 0; dy = -gridSize; changingDirection = true; }
    if ((key === 39 || key === 68) && !left) { dx = gridSize; dy = 0; changingDirection = true; }
    if ((key === 40 || key === 83) && !up) { dx = 0; dy = gridSize; changingDirection = true; }
});

// Controles Touch
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive: false });
canvas.addEventListener('touchend', e => {
    if (changingDirection) return;
    let dxTouch = e.changedTouches[0].screenX - touchStartX;
    let dyTouch = e.changedTouches[0].screenY - touchStartY;
    const up = dy === -gridSize, down = dy === gridSize, right = dx === gridSize, left = dx === -gridSize;
    if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
        if (dxTouch > 0 && !left) { dx = gridSize; dy = 0; changingDirection = true; }
        else if (dxTouch < 0 && !right) { dx = -gridSize; dy = 0; changingDirection = true; }
    } else {
        if (dyTouch > 0 && !up) { dx = 0; dy = gridSize; changingDirection = true; }
        else if (dyTouch < 0 && !down) { dx = 0; dy = -gridSize; changingDirection = true; }
    }
}, { passive: false });
canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

document.getElementById("restart-btn").addEventListener("click", () => { clearTimeout(gameLoopTimeout); initGame(); });

// Iniciar
initGame();

/**
 * KOTODAMA RITUAL - CORE ENGINE (LEVEL SYSTEM UPGRADE)
 */

let ALL_LEVELS_DATA = null;
let VALID_WORDS = new Set();
const HIRAGANA_DECK = [
    'あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ',
    'た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ',
    'ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん'
];

let currentLevel = 1;
let deck = [...HIRAGANA_DECK];
let hand = [];
let selectedLetters = [];
let timeLeft = 90;
let yokaiHP = 100;
let gameActive = false;

/**
 * 1. LOADING DATABASE & LEVEL SYSTEM
 */
async function loadDatabase() {
    try {
        console.log("Membuka kitab mantra level...");
        const response = await fetch('database.json');
        const data = await response.json();
        ALL_LEVELS_DATA = data.levels;
        
        initLevel(currentLevel);
    } catch (error) {
        console.error("Gagal memuat database.json:", error);
        alert("Kitab mantra (database.json) tidak ditemukan!");
    }
}

function initLevel(level) {
    if (!ALL_LEVELS_DATA[level]) {
        alert("🎉 SELAMAT! Anda telah menyegel semua Yokai dari segala level!");
        location.reload();
        return;
    }

    const levelData = ALL_LEVELS_DATA[level];
    
    // Khusus Level 10: Gabungkan semua kata dari level 1-9
    if (level === 10) {
        let allWords = [];
        for (let i = 1; i <= 9; i++) {
            allWords = allWords.concat(ALL_LEVELS_DATA[i].words);
        }
        VALID_WORDS = new Set(allWords);
    } else {
        VALID_WORDS = new Set(levelData.words);
    }

    // Reset State Game
    yokaiHP = 100;
    timeLeft = 90;
    deck = [...HIRAGANA_DECK];
    hand = [];
    selectedLetters = [];
    
    shuffle(deck);
    drawCards();
    
    if (!gameActive) {
        gameActive = true;
        startTimer();
    }
    
    alert(`📜 MEMULAI ${levelData.level_name}\nTema: ${levelData.tema}`);
    updateUI();
}

/**
 * 2. GAME LOGIC
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function drawCards() {
    while (hand.length < 5 && deck.length > 0) {
        hand.push(deck.shift());
    }
    renderHand();
    updateUI();
}

function renderHand() {
    const handEl = document.getElementById('player-hand');
    if (!handEl) return;
    handEl.innerHTML = '';
    hand.forEach((char, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerText = char;
        card.onclick = () => selectLetter(index);
        handEl.appendChild(card);
    });
}

function selectLetter(index) {
    if (selectedLetters.length >= 5) return;
    const char = hand.splice(index, 1)[0];
    selectedLetters.push(char);
    renderWordZone();
    renderHand();
}

function renderWordZone() {
    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach((slot, index) => {
        slot.innerText = selectedLetters[index] || "";
        if (selectedLetters[index]) {
            slot.classList.add('active');
        } else {
            slot.classList.remove('active');
        }
    });
}

function clearWord() {
    hand.push(...selectedLetters);
    selectedLetters = [];
    renderWordZone();
    renderHand();
}

function confirmWord() {
    const word = selectedLetters.join('');
    
    if (VALID_WORDS.has(word)) {
        const damage = word.length * 20;
        yokaiHP = Math.max(0, yokaiHP - damage);
        timeLeft += 5; 
        
        alert(`✨ KOTODAMA AKTIF: ${word}! HP Yokai -${damage}`);
        
        selectedLetters = [];
        drawCards();
    } else {
        timeLeft -= 5;
        alert(`💀 ${word} bukan mantra valid untuk level ini!`);
        clearWord();
    }
    updateUI();
}

function shuffleDeck() {
    if (timeLeft <= 5) return;
    timeLeft -= 5;
    deck.push(...hand, ...selectedLetters);
    hand = [];
    selectedLetters = [];
    shuffle(deck);
    drawCards();
    renderWordZone();
    updateUI();
}

/**
 * 3. UI & HP COLOR SYSTEM
 */
function updateUI() {
    // Update HP Fill & Warna Dinamis
    const hpFill = document.getElementById('hp-fill');
    if (hpFill) {
        hpFill.style.width = yokaiHP + "%";
        
        // Logika Warna HP (0-30-70-100)
        if (yokaiHP <= 30) {
            hpFill.style.backgroundColor = "#ff4d4d"; // Merah
        } else if (yokaiHP <= 70) {
            hpFill.style.backgroundColor = "#f1c40f"; // Kuning
        } else {
            hpFill.style.backgroundColor = "#2ecc71"; // Hijau
        }
    }

    // Update Timer (Warna Putih dikontrol CSS)
    const timerEl = document.getElementById('time-val');
    if (timerEl) timerEl.innerText = timeLeft;

    // Update Deck Count
    const deckVal = document.getElementById('deck-val');
    if (deckVal) deckVal.innerText = deck.length;

    // Cek Kemenangan Level
    if (yokaiHP <= 0 && gameActive) {
        checkLevelClear();
    }
}

function checkLevelClear() {
    gameActive = false;
    setTimeout(() => {
        const next = confirm(`✨ RITUAL BERHASIL!\nLevel ${currentLevel} Selesai.\nLanjut ke Level Berikutnya?`);
        if (next) {
            currentLevel++;
            initLevel(currentLevel);
        } else {
            location.reload();
        }
    }, 500);
}

function startTimer() {
    const timerEl = document.getElementById('time-val');
    const interval = setInterval(() => {
        if (!gameActive) {
            // Timer tidak berhenti, hanya menunggu level baru aktif kembali
            if (yokaiHP <= 0) return; 
            clearInterval(interval); 
            return; 
        }
        
        timeLeft--;
        if (timerEl) timerEl.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            alert("💀 WAKTU HABIS! Yokai menyerang!");
            location.reload();
        }
    }, 1000);
}

window.onload = loadDatabase;

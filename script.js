let ALL_LEVELS_DATA = null;
let VALID_WORDS = new Set();
let currentLevel = 1;

// Pembersihan Hiragana murni berdasarkan komposisi 71 kartu
const DECK_DATA = {
    3: ['ん','い','う','え','あ','し','た','の','る','か','て'],
    2: ['さ','と','na','も','こ','は','ま','や','よ','き'],
    1: ['り','お','く','が','ぎ','ぐ','ご','ば','ぱ','ふ','ひ','へ','ほ','わ','ち','つ']
};

let deck = []; let hand = []; let selectedLetters = [];
let timeLeft = 90; let yokaiHP = 100; let gameActive = false;
let timerInt = null;
let hasUsedHintThisLevel = false; // Flag untuk pembatasan Onmyouroku

async function loadDatabase() {
    try {
        const res = await fetch('database.json');
        const data = await res.json();
        ALL_LEVELS_DATA = data.levels;
        initLevel(currentLevel);
    } catch (e) { console.error("Database error", e); }
}

function buildDeck() {
    deck = [];
    for (let n in DECK_DATA) {
        DECK_DATA[n].forEach(c => { for(let i=0; i < parseInt(n); i++) deck.push(c); });
    }
    shuffle(deck);
}

function initLevel(level) {
    currentLevel = level;
    const data = ALL_LEVELS_DATA[level];
    if(!data) return;

    VALID_WORDS = new Set(data.words);
    yokaiHP = 100; timeLeft = 90; hand = []; selectedLetters = [];
    
    // Reset status Onmyouroku setiap kali masuk level baru
    hasUsedHintThisLevel = false;
    const hintBtn = document.getElementById('hint-btn');
    if(hintBtn) {
        hintBtn.disabled = false;
        hintBtn.innerText = "Onmyouroku";
        hintBtn.style.opacity = "1";
    }

    document.getElementById('level-banner').innerText = `Level ${level} (${data.category})`;
    document.getElementById('modal-overlay').style.display = 'none';
    
    buildDeck();
    drawCards();
    updateUI();
    if (!gameActive) { gameActive = true; startTimer(); }
}

function startTimer() {
    if(timerInt) clearInterval(timerInt);
    timerInt = setInterval(() => {
        if (gameActive && timeLeft > 0) {
            timeLeft--; updateUI();
            if (timeLeft <= 0) { gameActive = false; showEndModal(false); }
        }
    }, 1000);
}

function updateUI() {
    const fill = document.getElementById('hp-fill');
    if (fill) fill.style.width = yokaiHP + "%";
    document.getElementById('time-val').innerText = timeLeft;
    document.getElementById('deck-val').innerText = deck.length;
}

function confirmWord() {
    const word = selectedLetters.join('');
    if (VALID_WORDS.has(word)) {
        yokaiHP = Math.max(0, yokaiHP - (word.length * 25));
        const main = selectedLetters.filter(c => !['ゃ','ゅ','ょ','っ'].includes(c));
        deck.push(...main); 
        shuffle(deck);
        selectedLetters = []; 
        drawCards(); 
        renderWordZone();
        if (yokaiHP <= 0) { gameActive = false; showEndModal(true); }
    } else {
        clearWord();
    }
    updateUI();
}

function showEndModal(isWin) {
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');

    overlay.style.display = 'flex';
    if(isWin) {
        title.innerText = "RITUAL BERHASIL!";
        title.style.color = "#d4af37";
    } else {
        title.innerText = "RITUAL GAGAL!";
        title.style.color = "#ff4d4d";
    }

    btnPrev.style.display = (currentLevel > 1) ? "block" : "none";
    btnNext.style.display = (isWin && currentLevel < 10) ? "block" : "none";
}

function changeLevel(delta) {
    currentLevel += delta;
    initLevel(currentLevel);
}

function retryLevel() {
    initLevel(currentLevel);
}

function drawCards() {
    while (hand.length < 7 && deck.length >= 7) {
        let trial = deck.slice(0, 7);
        if (canFormWord(trial) || deck.length < 14) {
            hand.push(...deck.splice(0, 7 - hand.length));
            break;
        }
        shuffle(deck);
    }
    renderHand();
}

function canFormWord(test) {
    for (let w of VALID_WORDS) {
        let t = [...test]; let m = 0;
        for (let c of w) {
            let i = t.indexOf(c);
            if (i !== -1) { m++; t[i] = null; }
        }
        if (m === w.length) return true;
    }
    return false;
}

function renderHand() {
    const el = document.getElementById('player-hand');
    if (!el) return;
    el.innerHTML = '';
    hand.forEach((c, i) => {
        const card = document.createElement('div');
        card.className = 'card'; card.innerText = c;
        card.onclick = () => {
            if (selectedLetters.length < 5) {
                selectedLetters.push(hand.splice(i, 1)[0]);
                renderHand(); renderWordZone();
            }
        };
        el.appendChild(card);
    });
}

function addSupport(c) {
    if (selectedLetters.length < 5) {
        selectedLetters.push(c);
        renderWordZone();
    }
}

function renderWordZone() {
    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach((s, i) => {
        s.innerText = selectedLetters[i] || "";
        s.classList.toggle('active', !!selectedLetters[i]);
    });
    document.getElementById('confirm-btn').disabled = selectedLetters.length < 2;
}

function clearWord() {
    selectedLetters.forEach(c => { if (!['ゃ','ゅ','ょ','っ'].includes(c)) hand.push(c); });
    selectedLetters = []; renderHand(); renderWordZone();
}

function shuffleDeck() {
    if (timeLeft <= 3) return;
    timeLeft -= 3;
    const main = hand.concat(selectedLetters.filter(c => !['ゃ','ゅ','ょ','っ'].includes(c)));
    deck.push(...main); hand = []; selectedLetters = [];
    shuffle(deck); drawCards(); renderWordZone(); updateUI();
}

// LOGIKA ONMYOUROKU: 1x Per Level
function showHint() {
    if (hasUsedHintThisLevel) return;

    const cards = document.querySelectorAll('.hand .card');
    VALID_WORDS.forEach(w => {
        let t = [...hand]; let match = [];
        for (let c of w) {
            let idx = t.indexOf(c);
            if (idx !== -1) { match.push(idx); t[idx] = null; }
            else { match = []; break; }
        }
        match.forEach(idx => {
            if(cards[idx]) cards[idx].classList.add('hint-glow');
        });
    });

    // Tandai sudah digunakan
    hasUsedHintThisLevel = true;
    const hintBtn = document.getElementById('hint-btn');
    hintBtn.disabled = true;
    hintBtn.innerText = "Sudah Digunakan";
    hintBtn.style.opacity = "0.5";

    setTimeout(() => {
        cards.forEach(c => c.classList.remove('hint-glow'));
    }, 3000);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

window.onload = loadDatabase;

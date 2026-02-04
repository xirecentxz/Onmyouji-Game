let ALL_LEVELS_DATA = null;
let VALID_WORDS = new Set();
let currentLevel = 1;
let isRomajiVisible = false;

const ROMAJI_MAP = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'っ': '(stop)'
};

const DECK_DATA = {
    3: ['ん','い','う','え','あ','し','た','の','る','か','て'],
    2: ['さ','と','な','も','こ','は','ま','や','よ','き'],
    1: ['り','お','く','が','ぎ','ぐ','ご','ば','ぱ','ふ','ひ','へ','ほ','わ','ち','つ']
};

let deck = []; let hand = []; let selectedLetters = [];
let timeLeft = 90; let yokaiHP = 100; let gameActive = false;
let timerInt = null; let hasUsedHintThisLevel = false;

function toggleRomaji() {
    isRomajiVisible = !isRomajiVisible;
    const btn = document.getElementById('romaji-toggle-btn');
    if(btn) btn.innerText = `Romaji: ${isRomajiVisible ? 'ON' : 'OFF'}`;
    renderHand(); renderWordZone(); renderSupportButtons();
}

async function loadDatabase() {
    try {
        const res = await fetch('database.json');
        const data = await res.json();
        ALL_LEVELS_DATA = data.levels;
        initLevel(currentLevel);
    } catch (e) { console.error("Database error", e); }
}

function initLevel(level) {
    currentLevel = level;
    const data = ALL_LEVELS_DATA[level];
    if(!data) return;
    
    VALID_WORDS = new Set(data.words);
    yokaiHP = 100; timeLeft = 90; hand = []; selectedLetters = [];
    hasUsedHintThisLevel = false;
    gameActive = true; 

    document.getElementById('level-banner').innerText = `Level ${level} (${data.category})`;
    document.getElementById('modal-overlay').style.display = 'none';
    
    const hb = document.getElementById('hint-btn');
    if(hb) { hb.disabled = false; hb.innerText = "Onmyouroku"; hb.style.opacity = "1"; }
    
    buildDeck(); 
    drawCards(); 
    renderSupportButtons();
    updateUI();
    startTimer();
}

function confirmWord() {
    if(!gameActive) return; // Proteksi Modal
    const word = selectedLetters.join('');
    if (VALID_WORDS.has(word)) {
        yokaiHP = Math.max(0, yokaiHP - (word.length * 10));
        const main = selectedLetters.filter(c => !['ゃ','ゅ','ょ','っ'].includes(c));
        deck.push(...main); 
        shuffle(deck);
        selectedLetters = []; 
        drawCards(); 
        if (yokaiHP <= 0) { gameActive = false; showEndModal(true); }
    } else {
        timeLeft = Math.max(0, timeLeft - 5);
        showFlashError(); 
        clearWord();
    }
    renderWordZone(); 
    updateUI();
}

function renderHand() {
    const el = document.getElementById('player-hand');
    if (!el) return; el.innerHTML = '';
    const hClass = isRomajiVisible ? '' : 'hidden'; 
    hand.forEach((c, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="kana">${c}</div><div class="romaji ${hClass}">${ROMAJI_MAP[c] || ''}</div>`;
        card.onclick = () => {
            if (!gameActive) return;
            if (selectedLetters.length < 7) {
                selectedLetters.push(hand.splice(i, 1)[0]);
                renderHand(); renderWordZone();
            }
        };
        el.appendChild(card);
    });
}

function renderWordZone() {
    const slots = document.querySelectorAll('.letter-slot');
    const hClass = isRomajiVisible ? '' : 'hidden';
    slots.forEach((s, i) => {
        const char = selectedLetters[i];
        if (char) {
            s.innerHTML = `<div class="kana-small">${char}</div><div class="romaji-tiny ${hClass}">${ROMAJI_MAP[char] || ''}</div>`;
            s.classList.add('active');
        } else {
            s.innerHTML = ""; s.classList.remove('active');
        }
    });
    document.getElementById('confirm-btn').disabled = selectedLetters.length < 2 || !gameActive;
}

function renderSupportButtons() {
    const container = document.getElementById('support-container');
    if(!container) return;
    const supports = ['ゃ', 'ゅ', 'ょ', 'っ'];
    const hClass = isRomajiVisible ? '' : 'hidden';
    container.innerHTML = '';
    supports.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'btn-support';
        btn.innerHTML = `<span>${s}</span><span class="romaji-support ${hClass}">${ROMAJI_MAP[s] || ''}</span>`;
        btn.onclick = () => { if(gameActive && selectedLetters.length < 7) addSupport(s); };
        container.appendChild(btn);
    });
}

function clearWord() {
    if(!gameActive) return;
    selectedLetters.forEach(c => { 
        if (!['ゃ','ゅ','ょ','っ'].includes(c)) hand.push(c); 
    });
    selectedLetters = []; 
    renderHand(); 
    renderWordZone();
}

function showEndModal(isWin) {
    gameActive = false; // Stop interaksi
    if(timerInt) clearInterval(timerInt);
    
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    overlay.style.display = 'flex';
    
    if(isWin) {
        title.innerText = "RITUAL BERHASIL!";
        title.style.color = "#d4af37";
        desc.innerText = "Yokai telah tersegel ke dalam kitab.";
    } else {
        title.innerText = "RITUAL GAGAL!";
        title.style.color = "#ff4d4d";
        desc.innerText = "Yokai terlalu kuat, segel Anda hancur!";
    }
    document.getElementById('btn-prev').style.display = (currentLevel > 1) ? "block" : "none";
    document.getElementById('btn-next').style.display = (isWin && currentLevel < 10) ? "block" : "none";
}

function drawCards() {
    // Perbaikan logika penarikan kartu sisa deck
    while (hand.length < 7 && deck.length > 0) {
        hand.push(deck.shift());
    }
    renderHand();
}

function shuffleDeck() {
    if(!gameActive || timeLeft <= 3) return;
    timeLeft -= 3; showFlashError();
    const main = hand.concat(selectedLetters.filter(c => !['ゃ','ゅ','ょ','っ'].includes(c)));
    deck.push(...main); hand = []; selectedLetters = [];
    shuffle(deck); drawCards(); renderWordZone(); updateUI();
}

// Fungsi Standar
function startTimer() {
    if(timerInt) clearInterval(timerInt);
    timerInt = setInterval(() => {
        if (gameActive && timeLeft > 0) {
            timeLeft--; updateUI();
            if (timeLeft <= 0) { showEndModal(false); }
        }
    }, 1000);
}

function buildDeck() {
    deck = [];
    for (let n in DECK_DATA) {
        DECK_DATA[n].forEach(c => { for(let i=0; i < parseInt(n); i++) deck.push(c); });
    }
    shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateUI() {
    const fill = document.getElementById('hp-fill');
    if (fill) fill.style.width = yokaiHP + "%";
    document.getElementById('time-val').innerText = timeLeft;
    document.getElementById('deck-val').innerText = deck.length;
}

function showFlashError() {
    const ts = document.querySelector('.timer-section');
    if(ts) {
        ts.style.color = "#ff4d4d"; ts.style.transform = "scale(1.2)";
        setTimeout(() => { ts.style.color = "white"; ts.style.transform = "scale(1)"; }, 500);
    }
}

function addSupport(c) {
    if (gameActive && selectedLetters.length < 7) { selectedLetters.push(c); renderWordZone(); }
}

function changeLevel(delta) { currentLevel += delta; initLevel(currentLevel); }
function retryLevel() { initLevel(currentLevel); }

function showHint() {
    if (!gameActive || hasUsedHintThisLevel) return;
    const cards = document.querySelectorAll('.hand .card');
    VALID_WORDS.forEach(w => {
        let t = [...hand]; let match = [];
        for (let c of w) {
            let idx = t.indexOf(c);
            if (idx !== -1) { match.push(idx); t[idx] = null; }
            else { match = []; break; }
        }
        match.forEach(idx => { if(cards[idx]) cards[idx].classList.add('hint-glow'); });
    });
    hasUsedHintThisLevel = true;
    const hb = document.getElementById('hint-btn');
    if(hb) { hb.disabled = true; hb.innerText = "Terpakai"; hb.style.opacity = "0.5"; }
    setTimeout(() => { cards.forEach(c => c.classList.remove('hint-glow')); }, 3000);
}

window.onload = loadDatabase;

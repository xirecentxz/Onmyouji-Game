let ALL_LEVELS_DATA = null;
let VALID_WORDS = new Set();

// PERBAIKAN: Semua Romaji diubah ke Hiragana sesuai desain dokumen
const DECK_DATA = {
    3: ['ん','い','う','え','あ','し','た','の','る','か','て'],
    2: ['さ','と','な','も','こ','は','ま','や','よ','き'],
    1: ['り','お','く','が','ぎ','ぐ','ご','ば','ぱ','ふ','ひ','へ','ほ','わ','ち','つ']
};

let deck = []; let hand = []; let selectedLetters = [];
let timeLeft = 90; let yokaiHP = 100; let gameActive = false;
let lastHintTime = 0;

function buildDeck() {
    deck = [];
    for (let n in DECK_DATA) {
        DECK_DATA[n].forEach(c => { 
            for(let i=0; i < parseInt(n); i++) deck.push(c); 
        });
    }
    shuffle(deck);
}

async function loadDatabase() {
    try {
        const res = await fetch('database.json');
        const data = await res.json();
        ALL_LEVELS_DATA = data.levels;
        buildDeck();
        initLevel(1);
    } catch (e) { console.error("Database error", e); }
}

function initLevel(level) {
    if (!ALL_LEVELS_DATA[level]) return;
    VALID_WORDS = new Set(ALL_LEVELS_DATA[level].words);
    yokaiHP = 100; timeLeft = 90; hand = []; selectedLetters = [];
    drawCards();
    if (!gameActive) { gameActive = true; startTimer(); }
    updateUI();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function drawCards() {
    let attempts = 0;
    while (hand.length < 7 && deck.length >= 7) {
        let trial = deck.slice(0, 7);
        if (canFormWord(trial) || attempts > 20) {
            hand.push(...deck.splice(0, 7 - hand.length));
            break;
        }
        shuffle(deck); attempts++;
    }
    renderHand();
    updateUI();
}

function canFormWord(testHand) {
    for (let word of VALID_WORDS) {
        let temp = [...testHand]; let m = 0;
        for (let c of word) {
            let i = temp.indexOf(c);
            if (i !== -1) { m++; temp[i] = null; }
        }
        if (m === word.length) return true;
    }
    return false;
}

function renderHand() {
    const el = document.getElementById('player-hand');
    if(!el) return;
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

function confirmWord() {
    const word = selectedLetters.join('');
    if (VALID_WORDS.has(word)) {
        yokaiHP = Math.max(0, yokaiHP - (word.length * 20));
        // Kembalikan kartu utama ke deck, abaikan support card
        const mainCards = selectedLetters.filter(c => !['ゃ','ゅ','ょ','っ'].includes(c));
        deck.push(...mainCards);
        shuffle(deck); 
        selectedLetters = [];
        drawCards(); 
    } else {
        clearWord();
    }
    renderWordZone();
    updateUI();
}

function clearWord() {
    selectedLetters.forEach(c => { 
        if (!['ゃ','ゅ','ょ','っ'].includes(c)) hand.push(c); 
    });
    selectedLetters = []; renderHand(); renderWordZone();
}

function shuffleDeck() {
    if (timeLeft <= 3) return;
    timeLeft -= 3;
    const mainCards = hand.concat(selectedLetters.filter(c => !['ゃ','ゅ','ょ','っ'].includes(c)));
    deck.push(...mainCards);
    hand = []; selectedLetters = [];
    shuffle(deck); drawCards(); renderWordZone(); updateUI();
}

function showHint() {
    if (Date.now() - lastHintTime < 5000) return;
    const cards = document.querySelectorAll('.hand .card');
    VALID_WORDS.forEach(w => {
        let temp = [...hand]; let match = [];
        for (let c of w) {
            let idx = temp.indexOf(c);
            if (idx !== -1) { match.push(idx); temp[idx] = null; }
            else { match = []; break; }
        }
        match.forEach(idx => cards[idx].classList.add('hint-glow'));
    });
    setTimeout(() => cards.forEach(c => c.classList.remove('hint-glow')), 2000);
    lastHintTime = Date.now();
    
    // Cooldown UI hint
    const btn = document.getElementById('hint-btn');
    btn.disabled = true;
    setTimeout(() => btn.disabled = false, 5000);
}

function updateUI() {
    const fill = document.getElementById('hp-fill');
    if(fill) fill.style.width = yokaiHP + "%";
    document.getElementById('time-val').innerText = timeLeft;
    document.getElementById('deck-val').innerText = deck.length;
}

function startTimer() {
    const timer = setInterval(() => { 
        if (gameActive && timeLeft > 0) { 
            timeLeft--; 
            updateUI(); 
        } else if (timeLeft <= 0) {
            clearInterval(timer);
            alert("💀 Ritual Gagal! Yokai menyerang!");
            location.reload();
        }
    }, 1000);
}

window.onload = loadDatabase;

/**
 * LOGIKA UTAMA GAME KOTODAMA
 */

const HIRAGANA_DECK = [
    'あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ',
    'た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ',
    'ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん'
];

let deck = [...HIRAGANA_DECK];
let hand = [];
let selectedLetters = []; // Menampung huruf yang dipilih
let timeLeft = 90;
let yokaiHP = 100;
let gameActive = true;

function initGame() {
    shuffle(deck);
    drawCards();
    startTimer();
}

// Fisher-Yates Shuffle
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
}

function renderHand() {
    const handEl = document.getElementById('player-hand');
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
    if (selectedLetters.length >= 5) return; // Maksimal 5 huruf sesuai revisi

    const char = hand.splice(index, 1)[0];
    selectedLetters.push(char);
    renderWordZone();
    renderHand();
}

function renderWordZone() {
    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach((slot, index) => {
        slot.innerText = selectedLetters[index] || "";
        slot.classList.toggle('active', !!selectedLetters[index]);
    });
}

function clearWord() {
    // Kembalikan huruf ke tangan
    hand.push(...selectedLetters);
    selectedLetters = [];
    renderWordZone();
    renderHand();
}

function confirmWord() {
    const word = selectedLetters.join('');
    
    if (VALID_WORDS.has(word)) {
        // BERHASIL (Sesuai flow user)
        const damage = word.length * 20;
        yokaiHP = Math.max(0, yokaiHP - damage);
        timeLeft += 5; // Bonus waktu
        
        alert(`✨ KOTODAMA AKTIF: ${word}! HP Yokai -${damage}`);
        
        selectedLetters = [];
        drawCards();
        updateUI();
    } else {
        // GAGAL
        timeLeft -= 5;
        alert("💀 Kata tidak valid! Penalti waktu.");
        clearWord();
    }
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
}

function updateUI() {
    document.getElementById('hp-fill').style.width = yokaiHP + "%";
    if (yokaiHP <= 0) {
        gameActive = false;
        alert("🎉 YOKAI TERSEGEL! Ritual Berhasil.");
        location.reload();
    }
}

function startTimer() {
    const timerEl = document.getElementById('time-val');
    const interval = setInterval(() => {
        if (!gameActive) { clearInterval(interval); return; }
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(interval);
            alert("💀 Ritual Gagal! Yokai menyerang!");
            location.reload();
        }
    }, 1000);
}

window.onload = initGame;

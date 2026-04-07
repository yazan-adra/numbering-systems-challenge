// المتغيرات الأساسية للنظام
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft;
let quizStartTime; // لحساب الوقت الإجمالي بالميلي ثانية
let totalTimeTaken = 0; 
let studentName = "";
let studentClass = "";
let timePerQuestion = 10;

// عناصر الواجهة
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const progressBar = document.getElementById('progress-bar'); // تم تعريفه هنا للوصول السهل

// منطق البداية
document.getElementById('start-btn').addEventListener('click', () => {
    studentName = document.getElementById('student-name').value.trim() || "طالب مجهول";
    studentClass = document.getElementById('student-class').value;
    const numQ = parseInt(document.getElementById('num-questions').value);
    timePerQuestion = parseInt(document.getElementById('time-per-question').value);
    
    // الأسطر الجديدة لقراءة الخيارات
    selectedSystems = document.getElementById('system-select').value;
    bitLength = parseInt(document.getElementById('bit-length').value);
    
    startQuiz(numQ);
});

function startQuiz(num) {
    questions = [];
    for (let i = 0; i < num; i++) {
        questions.push(generateQuestion());
    }
    
    currentQuestionIndex = 0;
    score = 0;
    quizStartTime = Date.now(); // بدء تسجيل الوقت الفعلي
    
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    showQuestion();
}

function generateQuestion() {
    // تحديد الأنظمة بناءً على اختيار المستخدم
    let availableBases = [];
    if (selectedSystems === 'all') availableBases = [{ radix: 2, name: 'ثنائي' }, { radix: 10, name: 'عشري' }, { radix: 16, name: 'ست عشري' }];
    if (selectedSystems === 'bin_hex') availableBases = [{ radix: 2, name: 'ثنائي' }, { radix: 16, name: 'ست عشري' }];
    if (selectedSystems === 'bin_dec') availableBases = [{ radix: 2, name: 'ثنائي' }, { radix: 10, name: 'عشري' }];
    if (selectedSystems === 'dec_hex') availableBases = [{ radix: 10, name: 'عشري' }, { radix: 16, name: 'ست عشري' }];

    // تحديد الحد الأقصى للأرقام بناءً على حجم الخانات (4-bit = 15, 8-bit = 255)
    const maxNum = bitLength === 4 ? 15 : 255;

    // دالة مساعدة لتنسيق الرقم بناءً على عدد الخانات المختار
    const formatNum = (n, r) => r === 2 ? n.toString(2).padStart(bitLength, '0') : n.toString(r).toUpperCase();

    const isAddition = Math.random() < 0.3; 
    let qText, correctNum, targetRadix;

    if (isAddition) {
        // الجمع (نقسم الحد الأقصى على 2 لكي لا يتجاوز الناتج عدد الخانات المسموح)
        const base = availableBases[Math.floor(Math.random() * availableBases.length)];
        const num1 = Math.floor(Math.random() * (maxNum / 2)) + 1; 
        const num2 = Math.floor(Math.random() * (maxNum / 2)) + 1;
        correctNum = num1 + num2;
        targetRadix = base.radix;
        
        qText = `ما هو ناتج جمع [ ${formatNum(num1, targetRadix)} ] + [ ${formatNum(num2, targetRadix)} ] بالنظام الـ ${base.name}؟`;
    } else {
        // التحويل
        let fromBase = availableBases[Math.floor(Math.random() * availableBases.length)];
        let toBase = availableBases[Math.floor(Math.random() * availableBases.length)];
        // التأكد من أن النظامين مختلفان (إذا كان هناك أكثر من نظام متاح)
        while (fromBase.radix === toBase.radix && availableBases.length > 1) {
            toBase = availableBases[Math.floor(Math.random() * availableBases.length)];
        }
        
        correctNum = Math.floor(Math.random() * maxNum) + 1;
        targetRadix = toBase.radix;
        
        qText = `حول [ ${formatNum(correctNum, fromBase.radix)} ] من ${fromBase.name} إلى ${toBase.name}`;
    }

    const correct = formatNum(correctNum, targetRadix);
    let options = [correct];

    // توليد خيارات خاطئة بذكاء ضمن النطاق
    while (options.length < 4) {
        // توليد رقم خاطئ قريب ولا يتجاوز الحد الأقصى ولا يقل عن صفر
        let wrongNum = Math.max(0, Math.min(maxNum, correctNum + (Math.floor(Math.random() * 15) - 7))); 
        let wrongVal = formatNum(wrongNum, targetRadix);
        if (!options.includes(wrongVal)) options.push(wrongVal);
    }
    
    return { qText, correct, options: options.sort(() => Math.random() - 0.5) };
}
function showQuestion() {
    if (currentQuestionIndex >= questions.length) {
        return endQuiz();
    }

    const q = questions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.qText;
    document.getElementById('question-counter').innerText = `السؤال: ${currentQuestionIndex + 1}/${questions.length}`;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    document.getElementById('feedback-message').innerHTML = ''; 
    
    progressBar.classList.remove('progress-danger'); // إزالة اللون الأحمر عند بداية سؤال جديد

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, btn);
        container.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    clearInterval(timer);
    timeLeft = timePerQuestion;
    updateTimerDisplay();
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            checkAnswer(null, null); 
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer-display');
    timerElement.innerText = `الوقت: ${timeLeft} ثانية`;
    
    // شريط التقدم يعبر فقط عن اكتمال الأسئلة (لا يغير لونه)
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    // منطق آخر 5 ثوانٍ
    if (timeLeft <= 5 && timeLeft > 0) {
        timerElement.classList.add('timer-danger'); // تغيير لون النص وعمل نبض
        playTickSound(); // تشغيل صوت الدقة
    } else {
        timerElement.classList.remove('timer-danger');
    }
}

function checkAnswer(selected, btn) {
    clearInterval(timer);
    const correct = questions[currentQuestionIndex].correct;
    const feedback = document.getElementById('feedback-message');
    progressBar.classList.remove('progress-danger'); // إيقاف الوميض عند الإجابة
    
    const buttons = document.querySelectorAll('.option-btn');
    let correctBtnTarget = null;
    
    buttons.forEach(b => {
        b.disabled = true;
        if (b.innerText === correct) {
            correctBtnTarget = b;
        }
    });

    if (selected === correct) {
        score++;
        if(btn) btn.classList.add('correct');
    } else {
        if(btn) btn.classList.add('wrong');
        if(correctBtnTarget) correctBtnTarget.classList.add('correct');
    }

    const nextBtn = document.createElement('button');
    nextBtn.innerText = currentQuestionIndex < questions.length - 1 ? "السؤال التالي" : "إنهاء وعرض النتيجة";
    nextBtn.style.marginTop = "20px";
    nextBtn.style.backgroundColor = "#555555";
    nextBtn.onclick = () => {
        let selectedSystems = 'all';
        let bitLength = 8;
        currentQuestionIndex++;
        showQuestion();
    };
    
    feedback.appendChild(nextBtn);
}

function endQuiz() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    // حساب الوقت الفعلي المستغرق بالميلي ثانية
    totalTimeTaken = Date.now() - quizStartTime; 
    
    document.getElementById('final-score').innerText = score;
    document.getElementById('total-questions').innerText = questions.length;
    // عرض الوقت بالثواني مع كسر عشري (مثلاً 12.45 ثانية)
    document.getElementById('total-time').innerText = (totalTimeTaken / 1000).toFixed(2);
    
    saveToLeaderboard();
}

// لوحة الشرف ونظام الفئات
function saveToLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('hexQuizLeaderboard')) || [];
    leaderboard.push({ name: studentName, class: studentClass, score: score, time: totalTimeTaken });
    localStorage.setItem('hexQuizLeaderboard', JSON.stringify(leaderboard));
}

document.getElementById('show-leaderboard-btn').addEventListener('click', () => {
    updateLeaderboards();
    startScreen.classList.remove('active');
    leaderboardScreen.classList.add('active');
});

// مستمعات أحداث للفلترة والبحث
document.getElementById('view-class-filter').addEventListener('change', updateClassLeaderboard);
document.getElementById('search-student').addEventListener('input', updateClassLeaderboard);

function updateLeaderboards() {
    const leaderboard = JSON.parse(localStorage.getItem('hexQuizLeaderboard')) || [];
    
    // 1. تحديث جدول أوائل المدرسة الشامل (أفضل 3 طلاب)
    const globalSorted = [...leaderboard].sort((a, b) => b.score - a.score || a.time - b.time).slice(0, 3);
    const globalBody = document.getElementById('global-leaderboard-body');
    globalBody.innerHTML = '';
    
    globalSorted.forEach((entry, index) => {
        const row = document.createElement('tr');
        if (index === 0) row.style.border = "5px solid red";
        else if (index === 1) row.style.border = "5px solid yellow";
        else if (index === 2) row.style.border = "5px solid orange";
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.class}</td>
            <td class="highlight-green">${entry.score} نقطة</td>
            <td>${(entry.time / 1000).toFixed(2)} ثانية</td>
        `;
        globalBody.appendChild(row);
    });

    // 2. تحديث جدول الفئة
    updateClassLeaderboard();
}

function updateClassLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('hexQuizLeaderboard')) || [];
    const selectedClass = document.getElementById('view-class-filter').value;
    const searchTerm = document.getElementById('search-student').value.toLowerCase().trim();
    
    // فلترة الطلاب حسب الفئة المحددة وحسب نص البحث (إن وجد)
    const classFiltered = leaderboard.filter(entry => {
        const matchesClass = entry.class === selectedClass;
        const matchesSearch = entry.name.toLowerCase().includes(searchTerm);
        return matchesClass && matchesSearch;
    });

    // الترتيب: النقاط أولاً، ثم الوقت الأقل (بالميلي ثانية)
    classFiltered.sort((a, b) => b.score - a.score || a.time - b.time);
    
    const classBody = document.getElementById('leaderboard-body');
    classBody.innerHTML = '';
    
    classFiltered.forEach((entry, index) => {
        const row = document.createElement('tr');
        if (index === 0 && !searchTerm) row.style.border = "5px solid red";
        else if (index === 1 && !searchTerm) row.style.border = "5px solid yellow";
        else if (index === 2 && !searchTerm) row.style.border = "5px solid orange";
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td class="highlight-green">${entry.score} نقطة</td>
            <td>${(entry.time / 1000).toFixed(2)} ثانية</td>
        `;
        classBody.appendChild(row);
    });
}

document.getElementById('restart-btn').addEventListener('click', () => {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
});

document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
    leaderboardScreen.classList.remove('active');
    startScreen.classList.add('active');
});

document.getElementById('clear-leaderboard-btn').addEventListener('click', () => {
    if (confirm("تحذير: هل أنت متأكد من مسح جميع نتائج الطلاب والفئات بشكل نهائي؟")) {
        localStorage.removeItem('hexQuizLeaderboard');
        updateLeaderboards();
    }
});

// ... (المتغيرات الأساسية تبقى كما هي) ...

// دالة لتوليد صوت "تكة" الساعة
function playTickSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

// دالة لتوليد صوت "بوق احتفالي" (Ta-Da)
function playEndSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playNote(freq, start, duration) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle'; // صوت يشبه البوق قليلاً
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
    }

    // نغمتين احتفاليتين
    playNote(523.25, 0, 0.2); // نغمة C5
    playNote(659.25, 0.2, 0.5); // نغمة E5 (أعلى وأطول)
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer-display');
    timerElement.innerHTML = `<i class="fas fa-clock"></i> الوقت: ${timeLeft} ثانية`;
    
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    if (timeLeft <= 5 && timeLeft > 0) {
        timerElement.classList.add('timer-danger');
        playTickSound();
    } else {
        timerElement.classList.remove('timer-danger');
    }
}

function endQuiz() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    totalTimeTaken = Date.now() - quizStartTime; 
    
    document.getElementById('final-score').innerText = score;
    document.getElementById('total-questions').innerText = questions.length;
    document.getElementById('total-time').innerText = (totalTimeTaken / 1000).toFixed(2);
    
    playEndSound(); // تشغيل صوت البوق عند النهاية
    saveToLeaderboard();
}


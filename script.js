let currentSessionId = null;
let scores = { mistakes: 0, prompts: 0 };

let startTime = 0;
let elapsedBeforePause = 0;
let difference = 0;
let timerAnimationId = null;
let isRunning = false;

const display = document.getElementById('display');
const mainBtn = document.getElementById('mainBtn');
const resetBtn = document.getElementById('resetBtn');
const mainText = document.getElementById('mainText');
const mainCard = document.getElementById('mainCard');
const titleInput = document.getElementById('sessionTitleInput');

function getUniqueDefaultName() {
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    let i = 1;
    let name = `السرد ${i}`;
    while (sessions.some(s => s.title === name)) {
        i++;
        name = `السرد ${i}`;
    }
    return name;
}

window.addEventListener('DOMContentLoaded', () => {
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    if (sessions.length > 0) {
        loadSession(sessions[0].id);
    } else {
        createNewSession();
    }
});

function createNewSession() {
    if (isRunning) toggleStopwatch();
    currentSessionId = Date.now();
    titleInput.value = getUniqueDefaultName();
    scores = { mistakes: 0, prompts: 0 };
    document.getElementById('mistakes').innerText = '0';
    document.getElementById('prompts').innerText = '0';
    resetStopwatchStateOnly();
    autoSave();
    if(document.getElementById('sidebar').classList.contains('active')) {
        toggleSidebar();
    }
}

function resetStopwatchStateOnly() {
    if (timerAnimationId) cancelAnimationFrame(timerAnimationId);
    isRunning = false;
    difference = 0;
    elapsedBeforePause = 0;
    display.innerHTML = '00:00:00<span class="ms">.00</span>';
    mainBtn.classList.remove('pause-state');
    mainBtn.classList.add('play-state');
    mainText.innerHTML = 'بدء';
    mainCard.classList.remove('running-glow', 'paused-glow');
}

function autoSave() {
    if (!currentSessionId) return;
    let title = titleInput.value.trim() !== '' ? titleInput.value.trim() : 'جلسة بدون عنوان';
    let timeText = display.innerHTML;

    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    let existingIndex = sessions.findIndex(s => s.id === currentSessionId);

    let sessionData = {
        id: currentSessionId,
        title: title,
        time: timeText,
        mistakes: scores.mistakes,
        prompts: scores.prompts,
        date: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    };

    if (existingIndex !== -1) {
        sessions[existingIndex] = sessionData;
    } else {
        sessions.unshift(sessionData);
    }
    localStorage.setItem('sard_sessions', JSON.stringify(sessions));
}

function handleTitleChange() {
    let val = titleInput.value.trim();
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    
    let isDuplicate = sessions.some(s => s.id !== currentSessionId && s.title === val);
    if (isDuplicate && val !== '') {
        let i = 1;
        let newval = `${val} (${i})`;
        while (sessions.some(s => s.id !== currentSessionId && s.title === newval)) {
            i++;
            newval = `${val} (${i})`;
        }
        titleInput.value = newval;
    }
    autoSave();
}

function runTimer() {
    if (!isRunning) return;
    
    let currentTime = performance.now();
    difference = elapsedBeforePause + (currentTime - startTime);

    let hours = Math.floor(difference / (1000 * 60 * 60));
    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((difference % (1000 * 60)) / 1000);
    let milliseconds = Math.floor((difference % 1000) / 10); 

    let hStr = (hours < 10) ? "0" + hours : hours;
    let mStr = (minutes < 10) ? "0" + minutes : minutes;
    let sStr = (seconds < 10) ? "0" + seconds : seconds;
    let msStr = (milliseconds < 10) ? "0" + milliseconds : milliseconds;

    display.innerHTML = hStr + ':' + mStr + ':' + sStr + '<span class="ms">.' + msStr + '</span>';
    autoSave();

    if (document.getElementById('sidebar').classList.contains('active')) {
        let liveTimeEl = document.getElementById(`sidebar-time-${currentSessionId}`);
        if (liveTimeEl) {
            liveTimeEl.innerText = `${hStr}:${mStr}:${sStr}`;
        }
    }

    timerAnimationId = requestAnimationFrame(runTimer);
}

function toggleStopwatch() {
    animateButton(mainBtn);
    if (!isRunning) {
        isRunning = true;
        startTime = performance.now();
        timerAnimationId = requestAnimationFrame(runTimer);
        
        mainBtn.classList.remove('play-state');
        mainBtn.classList.add('pause-state');
        mainText.innerHTML = 'إيقاف';
        
        mainCard.classList.remove('paused-glow');
        mainCard.classList.add('running-glow');
    } else {
        isRunning = false;
        cancelAnimationFrame(timerAnimationId);
        elapsedBeforePause = difference;
        
        mainBtn.classList.remove('pause-state');
        mainBtn.classList.add('play-state');
        mainText.innerHTML = 'إكمال';
        
        mainCard.classList.remove('running-glow');
        mainCard.classList.add('paused-glow');
    }
    autoSave();
    if (document.getElementById('sidebar').classList.contains('active')) {
        loadSessionsHistory();
    }
}

function resetStopwatch() {
    animateButton(resetBtn);
    resetStopwatchStateOnly();
    autoSave();
    if (document.getElementById('sidebar').classList.contains('active')) {
        loadSessionsHistory();
    }
}

function animateButton(btn) {
    btn.style.transform = "scale(0.85)";
    setTimeout(() => btn.style.transform = "scale(1)", 150);
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && event.target.tagName !== 'INPUT') {
        event.preventDefault(); 
        toggleStopwatch();
    }
    if (event.key.toLowerCase() === 'r' || event.key.toLowerCase() === 'ث') {
        if (event.target.tagName !== 'INPUT') {
            event.preventDefault();
            resetStopwatch();
        }
    }
});

function updateCounter(type, value) {
    scores[type] += value;
    if (scores[type] < 0) scores[type] = 0; 
    
    let el = document.getElementById(type);
    el.innerText = scores[type];
    
    el.style.transform = "scale(1.4)";
    setTimeout(() => el.style.transform = "scale(1)", 150);
    autoSave();
    if (document.getElementById('sidebar').classList.contains('active')) {
        loadSessionsHistory();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    if (sidebar.classList.contains('active')) {
        loadSessionsHistory();
    }
}

function loadSessionsHistory() {
    const container = document.getElementById('sessionsList');
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');

    if (sessions.length === 0) {
        container.innerHTML = '<div class="empty-history">لا توجد جلسات في السجل حتى الآن.</div>';
        return;
    }

    container.innerHTML = '';
    sessions.forEach(s => {
        const item = document.createElement('div');
        item.className = 'session-item';
        if(s.id === currentSessionId) {
            item.style.borderColor = 'var(--accent-cyan)';
            item.style.background = 'rgba(34, 211, 238, 0.08)';
        }

        let liveIndicator = (s.id === currentSessionId && isRunning) ? '<span class="live-dot" title="جاري السرد..."></span>' : '';
        let rawTime = s.time.split('<span')[0].trim();

        item.innerHTML = `
            <button class="del-session" onclick="event.stopPropagation(); deleteSession(${s.id})" title="حذف">حذف</button>
            <div class="session-item-title">${s.title} ${liveIndicator}</div>
            <div class="session-item-details">
                <span>الزمن: <span id="sidebar-time-${s.id}">${rawTime}</span></span>
                <span style="color:var(--accent-red)">أخطاء: ${s.mistakes}</span>
                <span style="color:var(--accent-cyan)">تنبيهات: ${s.prompts}</span>
            </div>
            <div class="session-item-date">${s.date}</div>
        `;
        item.onclick = () => loadSession(s.id);
        container.appendChild(item);
    });
}

function loadSession(id) {
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    let s = sessions.find(item => item.id === id);
    if (!s) return;

    if (isRunning) {
        toggleStopwatch();
    }

    currentSessionId = s.id;
    titleInput.value = s.title;
    scores.mistakes = s.mistakes;
    scores.prompts = s.prompts;
    document.getElementById('mistakes').innerText = scores.mistakes;
    document.getElementById('prompts').innerText = s.prompts;
    display.innerHTML = s.time;

    try {
        let timePart = s.time.split('<span')[0].trim();
        let parts = timePart.split(':');
        let h = parseInt(parts[0]) || 0;
        let m = parseInt(parts[1]) || 0;
        let sec = parseInt(parts[2]) || 0;
        difference = (h * 3600 + m * 60 + sec) * 1000;
        elapsedBeforePause = difference;
    } catch(e) {
        difference = 0;
        elapsedBeforePause = 0;
    }

    if(document.getElementById('sidebar').classList.contains('active')) {
        toggleSidebar();
    }
}

function deleteSession(id) {
    let sessions = JSON.parse(localStorage.getItem('sard_sessions') || '[]');
    sessions = sessions.filter(s => s.id !== id);
    localStorage.setItem('sard_sessions', JSON.stringify(sessions));
    if (id === currentSessionId) {
        if (sessions.length > 0) {
            loadSession(sessions[0].id);
        } else {
            createNewSession();
        }
    } else {
        loadSessionsHistory();
    }
}

function takeScreenshot() {
    const captureElement = document.getElementById('captureArea');
    html2canvas(captureElement, {
        backgroundColor: '#0b1120',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'sard-session-' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}
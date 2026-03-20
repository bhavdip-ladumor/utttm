
const btn1 = document.getElementById('btn-1');
const btn2 = document.getElementById('btn-2');
const div1 = document.getElementById('div-1');
const div2 = document.getElementById('div-2');

function switchTab(tabIndex) {
    if (tabIndex === 1) {
        btn1.classList.add('active');
        btn2.classList.remove('active');
        div1.classList.remove('hidden');
        div2.classList.add('hidden');
    } else {
        btn2.classList.add('active');
        btn1.classList.remove('active');
        div2.classList.remove('hidden');
        div1.classList.add('hidden');
    }
}

btn1.onclick = () => switchTab(1);
btn2.onclick = () => switchTab(2);



window.closeAuth = () => {
    // Logic: Go back to where you came from, otherwise index
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = "index.html"; 
    }
};
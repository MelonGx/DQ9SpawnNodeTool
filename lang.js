const DQ9Lang = (function () {
    const LANGS = [['en', 'English'], ['ja', '日本語']], KEY = 'DQ9SpawnNodeTool.lang', root = document.documentElement;
    const index = () => Math.max(0, LANGS.findIndex(([code]) => code === root.dataset.lang));

    const style = document.createElement("style");
    style.textContent = `
        .lang-row { display: flex; justify-content: flex-end; gap: 4px; margin-bottom: 8px; }
        .lang-sw { background: #224; color: #888; border: 1px solid #444; border-radius: 4px; padding: 2px 8px; cursor: pointer;
                   font-family: monospace; font-size: 16px; font-weight: bold; line-height: 1.4; transition: all .15s; }
        .lang-sw:hover { border-color: #00A2E8; color: #ccc; }
        .lang-sw[aria-pressed=true] { background: #00A2E8; color: #fff; border-color: #00A2E8; }
    `;
    document.head.appendChild(style);

    const row = document.createElement("div");
    row.className = "lang-row";
    row.innerHTML = LANGS.map(([, name], L) => `<button type="button" class="lang-sw" data-lang="${L}">${name}</button>`).join('');
    document.querySelector("body > .panel").before(row);
    const show = () => row.querySelectorAll(".lang-sw").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.lang) === index())));

    function set(L) {
        root.dataset.lang = LANGS[L][0];
        try { localStorage.setItem(KEY, String(L)); } catch (e) {}
        show();
        document.dispatchEvent(new Event("langchange"));
    }
    row.addEventListener("click", e => { const b = e.target.closest(".lang-sw"); if (b) set(Number(b.dataset.lang)); });

    let saved = 0;
    try { saved = Number(localStorage.getItem(KEY)) || 0; } catch (e) {}
    root.dataset.lang = (LANGS[saved] || LANGS[0])[0];
    show();

    return { index, pick: (en, ja) => index() ? ja : en };
})();

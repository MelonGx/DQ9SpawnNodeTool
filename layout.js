(function () {
    const SIDE_MIN = 440, GAP = 16;
    const SIDE_MIN_SHORT = 340;
    const STACK_SIDE_MIN = 300;

    const style = document.createElement("style");
    style.textContent = `
        .app { display: flex; gap: ${GAP}px; align-items: flex-start; width: 100%; }
        .app-map { position: sticky; top: 10px; flex: 0 0 auto; }
        .app-side { flex: 1 1 ${SIDE_MIN}px; min-width: 0; display: flex; flex-direction: column; align-items: stretch; }
        .app-side > .panel { margin-bottom: 12px; width: auto; }
        .app-side .srch-table-wrap { overflow-x: auto; max-width: 100%; }
        .app.stacked { flex-direction: column; align-items: center; gap: 8px; }
        .app.stacked .app-map { top: 0; z-index: 5; background: #1e1e1e; padding: 4px 0; align-self: stretch; }
        .app.stacked .app-map.unpinned { position: static; }
        .app.stacked .app-side { width: 100%; }
        .map-pin { display: none; }
        .app.stacked .map-pin { display: block; margin: 4px auto 0; background: #2d2d2d; border: 1px solid #555; color: #d4d4d4;
                                font-family: monospace; font-size: 14px; padding: 4px 12px; border-radius: 4px; }
        html { -webkit-text-size-adjust: 100%; }
        .tip { position: relative; display: inline-block; margin-left: 4px; color: #888; cursor: help; font-weight: normal; font-size: 14px; }
        .tip:hover, .tip:focus { color: #fff; outline: none; }
        .tip-box { position: absolute; display: none; z-index: 20; max-width: min(320px, calc(100vw - 16px)); box-sizing: border-box;
            text-align: left; background: #111; color: #ddd; border: 1px solid #555; border-radius: 4px; padding: 6px 8px;
            font-family: monospace; font-size: 12px; line-height: 1.4; pointer-events: none; }
        @media (max-width: 600px) {
            body { padding: 8px; }
            .app-side > .panel { padding: 10px; }
            .srch-panel .srch-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .srch-table { font-size: 13px; }
            .srch-table th, .srch-table td { padding: 3px 5px; }
        }
        @media (pointer: fine) {
            .app-side .srch-panel, .app-side .dist-panel { gap: 6px; }
            .app-side .srch-panel select, .app-side .srch-panel input, .app-side .srch-panel button,
            .app-side .dist-panel select { font-size: 13px; padding: 2px 4px; }
            .app-side .srch-panel label, .app-side .dist-panel label { font-size: 13px; }
            .app-side .srch-panel .srch-cell > label { font-size: 12px; }
            .app-side .srch-panel .srch-grid { gap: 3px 8px; }
            .app-side .srch-panel .srch-boxes input.srch-box { width: 32px; padding: 1px 3px; }
            .app-side .srch-panel .srch-row input.srch-hex { width: 52px; }
        }
        @media (pointer: coarse) {
            input[type=checkbox] { width: 20px; height: 20px; vertical-align: middle; }
            .srch-table .srch-stop { padding: 6px 6px; }
            .dist-table td.pick { padding-top: 8px; padding-bottom: 8px; }
        }
    `;
    document.head.appendChild(style);

    const app = document.createElement("div");
    app.className = "app";
    const mapCol = document.createElement("div");
    mapCol.className = "app-map";
    const side = document.createElement("div");
    side.className = "app-side";
    const grid = document.querySelector(".grid-container");
    grid.before(app);
    app.append(mapCol, side);
    mapCol.append(grid);

    const pin = document.createElement("button");
    pin.className = "map-pin";
    pin.type = "button";
    pin.textContent = "Unpin Map";
    pin.addEventListener("click", () => {
        const off = mapCol.classList.toggle("unpinned");
        pin.textContent = off ? "Pin Map" : "Unpin Map";
    });
    mapCol.append(pin);

    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none";
    document.body.append(probe);
    const viewH = () => probe.getBoundingClientRect().height || window.innerHeight;
    document.querySelectorAll("body > .panel").forEach(p => side.append(p));

    const results = document.getElementById("srchResults");
    if (results) {
        const wrap = document.createElement("div");
        wrap.className = "srch-table-wrap";
        results.before(wrap);
        wrap.append(results);
    }

    window.mapDisplaySize = () => {
        const cs = getComputedStyle(document.body);
        const w = document.documentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const h = viewH();
        const short = h < 500 && w - SIDE_MIN_SHORT - GAP >= h - 20;
        const twoCols = w - SIDE_MIN - GAP >= 480 || short;
        app.classList.toggle("stacked", !twoCols);
        if (!twoCols) return Math.max(200, Math.min(w, 1024, h - STACK_SIDE_MIN));
        if (short) return h - 20;
        return Math.max(320, Math.min(1024, h - 20, w - SIDE_MIN - GAP));
    };
    const tipBox = document.createElement("div");
    tipBox.className = "tip-box";
    document.body.append(tipBox);
    const showTip = el => {
        tipBox.textContent = el.dataset.tip;
        tipBox.style.display = "block";
        const r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth;
        const x = Math.max(8, Math.min(r.left, vw - tipBox.offsetWidth - 8));
        tipBox.style.left = `${x + window.scrollX}px`;
        tipBox.style.top = `${r.bottom + 4 + window.scrollY}px`;
    };
    const hideTip = () => { tipBox.style.display = "none"; };
    const tipOf = e => e.target.closest && e.target.closest(".tip");
    document.addEventListener("mouseover", e => { const t = tipOf(e); if (t) showTip(t); });
    document.addEventListener("mouseout", e => { const t = tipOf(e); if (t && document.activeElement !== t) hideTip(); });
    document.addEventListener("focusin", e => { const t = tipOf(e); if (t) showTip(t); });
    document.addEventListener("focusout", e => { if (tipOf(e)) hideTip(); });

    scaleRenderedOutput();
})();

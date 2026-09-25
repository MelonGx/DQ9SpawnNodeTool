// Two-column layout: the map on the left stays in view (sticky) while the controls and results on
// the right scroll; on narrow screens (phones) everything stacks and the map stays pinned on top.
(function () {
    const SIDE_MIN = 440, GAP = 16;          // side column minimum, column gap
    const SIDE_MIN_SHORT = 340;              // side column minimum on short screens (phone landscape)
    const STACK_SIDE_MIN = 300;              // stacked: height kept free below the pinned map

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
        @media (max-width: 600px) {
            body { padding: 8px; }
            .app-side > .panel { padding: 10px; }
            .srch-table { font-size: 13px; }
            .srch-table th, .srch-table td { padding: 3px 5px; }
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

    // Stacked: the pinned map can be released to give the controls the whole screen
    const pin = document.createElement("button");
    pin.className = "map-pin";
    pin.type = "button";
    pin.textContent = "Unpin Map";
    pin.addEventListener("click", () => {
        const off = mapCol.classList.toggle("unpinned");
        pin.textContent = off ? "Pin Map" : "Unpin Map";
    });
    mapCol.append(pin);

    // Stable viewport height (iOS Safari's toolbar changes innerHeight while scrolling)
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none";
    document.body.append(probe);
    const viewH = () => probe.getBoundingClientRect().height || window.innerHeight;
    document.querySelectorAll("body > .panel").forEach(p => side.append(p));

    // Results table scrolls sideways inside the column instead of widening it
    const results = document.getElementById("srchResults");
    if (results) {
        const wrap = document.createElement("div");
        wrap.className = "srch-table-wrap";
        results.before(wrap);
        wrap.append(results);
    }

    // Map size: as large as fits next to the side column and within the window height;
    // stacked, it leaves room below the pinned map for the controls
    window.mapDisplaySize = () => {
        const cs = getComputedStyle(document.body);
        const w = document.documentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const h = viewH();
        const short = h < 500 && w - SIDE_MIN_SHORT - GAP >= h - 20;   // phone landscape
        const twoCols = w - SIDE_MIN - GAP >= 480 || short;
        app.classList.toggle("stacked", !twoCols);
        if (!twoCols) return Math.max(200, Math.min(w, 1024, h - STACK_SIDE_MIN));
        if (short) return h - 20;
        return Math.max(320, Math.min(1024, h - 20, w - SIDE_MIN - GAP));
    };
    scaleRenderedOutput();
})();

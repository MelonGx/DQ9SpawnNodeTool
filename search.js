(function () {
    const ELIST_OPTIONS = [
        ['MULTI_SPECIAL', 'EL_M'], ['SIZE_15', '15×15'], ['PARTIAL_NONE', 'EL_P'],
        ['4', 'EL_4'], ['3', 'EL_3'], ['2', 'EL_2'], ['ONLY', 'EL_1'], ['NONE', 'EL_0'],
    ];
    const ITEM_GROUPS = {
        og1: ['Ethereal stone', 'Lucida shard', 'Orichalcum', 'Gold bar', "Saint's ashes", 'Malicite', "Sorcerer's stone",
              "Sage's elixir", "Hephaestus' flame", 'Iron nails', 'Mini medal'],
        ogS: ['Sainted soma', 'Yggdrasil leaf', 'Reset stone', 'S weapon'],
        og2: ['Millionaire', 'Slime shield', 'Fuddle bow', 'Dangerous bustier'],
        og3: ['Oh-no bow', "Hades' helm", 'Skull ring', 'Skull helm', 'Ruinous shield'],
        og4: ['Silver platter', 'Glombolero', 'Brouhaha boomstick', "Hela's hammer", 'Depressing shoes', 'Unhappy hat', 'Divine dress'],
        og5: ['Cannibox', 'Mimic', "Pandora's box"],
    };
    const LANGS = [['en', 'English'], ['ja', '日本語']], LANG_KEY = 'DQ9SpawnNodeTool.lang';
    const TEXT = {
        A03: ['Sorry! Quickload search is not available for chest monsters.', '宝箱モンスターは体感検索のみ対応しています。'],
        A05: ['Sorry! Searching for this item is currently unavailable.', 'このアイテムの検索機能は現在未実装です。'],
        A08: ['No valid maps in this Seed range when filtering by location.', '場所候補フィルター有効時、この Seed 範囲に該当する地図はありません！'],
        A09: ['Invalid Location. Valid range: 01–96 (hex), digits 0–9 and A–F only.', '無効な場所コードです。有効な入力範囲：01–96（16進数）、0–9 および A–F のみ。'],
        A10: ['Invalid Seed. Valid range: 0000–FFFF (hex), digits 0–9 and A–F only.', '無効な Seed です。有効な入力範囲：0000–FFFF（16進数）、0–9 および A–F のみ。'],
        A11: ['"Only Monster" cannot be paired with ONLY (1-enemy) / No-enemy / 15x15 / Multi-special together.', '「オンリーM」は オンリー／敵無／15x15／複数の特殊フロア と併用できません。'],
        A13: ['Fastest Map Search does not support this option.', '最短地図検索はこの選択肢に対応しておりません。'],
        A14: ['Fastest Map Search requires at least one of: Depth, Lv, Sp.Floor (ElistOfs), ONLY Monster, Location, or Boss.', '最短地図検索では、深さ・Lv・特殊フロア (ElistOfs)・オンリーM・場所・ボス のうち、少なくとも 1 つの入力が必要です。'],
        B03: ['Found', '個'],
        B07: ['Conditions conflict. All searches skipped.', '条件が矛盾しているため、全ての検索をスキップしました。'],
        B08: ['Unable to match this Rank. Skipped.', 'この条件は選択した Rank では不可能です。スキップしました。'],
        C01: ['Map', '地図名'],
        C02: ['Type', '地形'],
        C03: ['SMR', '敵ランク'],
        F01: ['Search all Ranks', '全てのRankを検索'],
        F02: ['Valid Locations', '場所のある地図のみ'],
        G03: ['Prefix', '地図名1'],
        G04: ['Suffix', '地図名2'],
        G05: ['Locale', '地図名3'],
        G06: ['Location', '場所'],
        G10: ['Depth', '深さ'],
        G12: ['Sp.Floor', '特殊フロア'],
        G13: ['ONLY Monster', 'オンリーM'],
        G14: ['Seed Range (Hex)', 'Seed 範囲 (Hex)'],
        G16: ['B3/B4/B9 Solo･Party / Combo / 3rd Chest (B13:S3)', 'B3/B4/B9 即開･一人旅 / 体感 / 整列箱 (B13:S整列)'],
        GBQ: ['Base Quality', 'Base値'],
        H00: ['Chest Timer Search', '中断技 検索'],
        H01: ['QL', '即一人旅'],
        H02: ['Combo', '体感'],
        H03: ['3rd', '整列箱'],
        EL_M: ['Multi-Special-Floor', '複数の特殊フロア'],
        EL_P: ['Partially No-enemy', '部分敵無'],
        EL_4: ['4-enemy', '敵減 4 種'],
        EL_3: ['3-enemy', '敵減 3 種'],
        EL_2: ['2-enemy', '敵減 2 種'],
        EL_1: ['ONLY (1-enemy)', 'オンリー'],
        EL_0: ['No-enemy', '敵無'],
        C04: ['F', '深さ'],
        title: ['Ideal Walk Search', '理想歩数検索'],
        titleTip: ['Searches ranked by the ideal walk. Click a result to see its route floor by floor; click a floor to show it on the map.',
                   '理想歩数で順位を付けた検索です。結果をクリックするとフロアごとのルートを表示し、フロアをクリックするとマップに表示します。'],
        searchTip: ['Fastest Map: entrance to the boss floor (top 50). With Sp.Floor (ElistOfs) or ONLY Monster, Fastest Floor: up to the floor before the special floor (all hits).',
                    '最短地図：入口からボスフロアまで（上位 50 件）。特殊フロア (ElistOfs) かオンリーMを指定すると最短フロア：特殊フロアの 1 つ手前のフロアまで（全件）。'],
        ctTip: ['. Routes as D / 5D / 9D; all hits, sorted by the ideal walk. Ultimate Search conditions above also apply.',
                '。ルートは D / 5D / 9D の通り。全件を理想歩数の短い順に表示し、上の Ultimate Search の条件も適用されます。'],
        done: ['Done: {0} ({1} s, {2})', '完了：{0}（{1} 秒、{2}）'],
        workers: ['{0} workers', '{0} ワーカー'],
        worker: ['{0} worker', '{0} ワーカー'],
        mainThread: ['main thread', 'メインスレッド'],
        ranking: ['Ranking: {0} seeds walked, {1} of {2} maps checked', 'ランキング：Seed {0} 個を歩行済み、地図 {2} 個中 {1} 個を確認'],
        error: ['Error: {0}', 'エラー：{0}'],
        steps: ['Steps', '歩数'],
        hit: ['Hit', '該当'],
        showRoute: ['Show the route', 'ルートを表示'],
        route: ['Route:', 'ルート：'],
        routeWorking: ['Route: working…', 'ルート：計算中…'],
        routeNone: ['Route: not found.', 'ルート：見つかりません。'],
        routeError: ['Route error:', 'ルートエラー：'],
        routes: ['(routes {0})', '（ルート {0}）'],
        unreachable: ['unreachable', '到達不可'],
    };
    let lang = 0;
    const word = k => TEXT[k] ? TEXT[k][lang] : k;
    const fill = (k, ...a) => word(k).replace(/\{(\d)\}/g, (_, i) => a[i]);
    const wordAttr = k => TEXT[k] ? ` data-text="${k}"` : '';
    const tipAttr = (...keys) => ` data-tip-text="${keys.join(' ')}" data-tip="${keys.map(word).join('')}"`;

    function searchRuntime(self) {
        const tkg = TKG_GEN();
        const walk = createIdealWalk(16, tkg);
        const tileWalk = createIdealWalk(1, tkg);
        let cancelled = false;

        function genFloor(seed, floor1) {
            tkg.generate(seed, floor1);
            const ctx = tkg.context, hex = ctx.field_0.mapseed, envName = tkg.getEnvironment(hex);
            const st = tkg.calculateStairsCoords(hex, envName);
            return Object.assign({ context: ctx }, walk.floorModel({
                grid: tkg.grid, width: tkg.width, height: tkg.height, bitfield: tkg.bitfield, env: tkg.envIndices[envName],
                up: st.up, down: st.down, upTile: ctx.upStairs, downTile: ctx.downStairs,
                chests: tkg.calculateChestCoords(hex, floor1, envName), chestTiles: ctx.field_0._chestCoords || [],
            }));
        }

        let walkFloor = null;
        function costRow(fd, i, exact, j, row) {
            if (fd.points[i]) {
                if (exact) {
                    if (walkFloor !== fd) { walk.setFloor(fd.info); walkFloor = fd; }
                    walk.gridFrom(fd.points, i, fd.stairs, j).forEach((d, k) => { if (d !== undefined) row[k] = d; });
                } else {
                    const cols = fd.points.flatMap((p, k) => p ? [k] : []);
                    tileWalk.setFloorTiles(fd.info);
                    const valid = fd.points.map((p, k) => (k === i && k === 0 && fd.upFront) || p || { x: 0, y: 0 });
                    const d = tileWalk.shortest(valid, i, cols);
                    for (const k of cols) row[k] = k === i ? 0 : Math.max(0, d[k] - walk.lbSlack(i, k));
                }
            }
            if (row[j] === undefined) row[j] = Infinity;
        }

        let cacheSeed = -1, floorCache = [];
        function floorEntry(seed, f) {
            if (seed !== cacheSeed) { cacheSeed = seed; floorCache = []; }
            return floorCache[f] || (floorCache[f] = { rows: {}, fd: genFloor(seed, f + 1) });
        }
        function cost(seed, f, i, j, exact) {
            const e = floorEntry(seed, f), key = (exact ? 'x' : 'l') + i;
            const row = e.rows[key] || (e.rows[key] = []);
            if (row[j] === undefined) costRow(e.fd, i, exact, j, row);
            return row[j];
        }
        const tilesOf = (seed, f) => floorEntry(seed, f).fd.tiles;
        const floorOf = (seed, index1) => floorEntry(seed, index1 - 1).fd;

        function idealPointWalkCost(eng, f, sx, sy, gx, gy) {
            if (sx === gx && sy === gy) return 0;
            const tiles = tilesOf(eng.seed, f);
            const at = (x, y) => tiles.findIndex(t => t && t.x === x && t.y === y);
            const i = at(sx, sy), j = at(gx, gy);
            if (i < 0 || j < 0) throw new Error(`no stairs / chest at (${sx},${sy}) or (${gx},${gy}) on B${f + 1}F`);
            const c = cost(eng.seed, f, i, j, true);
            return c === Infinity ? null : c;
        }
        const C = DQ9AT_CORE({ tkg, floor: floorOf, calcPointWalkCost: idealPointWalkCost, isOpenTile: walk.isOpenTile });

        function fastestHit(eng, job, seed, r) {
            const conds = job.conds;
            if (!C.checkUltimateCondsMatch(eng, seed, r.key, conds, job.searchFilterLoc)) return null;
            if (job.mode === 'map' && eng.boss === 12 && parseInt(conds.boss) !== 12) return null;
            if (!C.checkOnlyMonPossible(eng, conds)) return null;
            eng.loadFloors();
            if (!C.chestCondsMatch(eng, conds)) return null;
            const er = C.checkElistAndD(eng, conds, job.onlyMonStr);
            if (!er.match) return null;
            let limit = eng.floorCount;
            if (job.mode === 'floor' && er.jumpToFloor !== -1) limit = Math.min(er.jumpToFloor, limit);
            return { limit };
        }

        function fastestCost(seed, limit, bound, known = []) {
            const lb = [], per = [];
            let rest = 0;
            for (let f = 0; f < limit; f++) { lb.push(known[f] ?? cost(seed, f, 0, 1, false)); rest += lb[f]; }
            if (rest > bound) return { cost: null, per };
            let sum = 0;
            for (let f = 0; f < limit; f++) {
                const c = known[f] ?? cost(seed, f, 0, 1, true);
                per[f] = c;
                sum += c;
                rest -= lb[f];
                if (c === Infinity || sum + rest > bound) return { cost: null, per };
            }
            return { cost: sum, per };
        }

        const plain = html => String(html || '').replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
        const hitText = html => [0, 1].map(L => C.dispText(plain(html), L));
        const mapMeta = eng => ({ name: [eng.mapName, eng.mapNameJP], type: C.ENV_NAMES[eng.env],
                                  boss: [eng.bossName, eng.bossNameJP], fc: eng.floorCount });
        function itemRows(eng, job, seed, r) {
            const conds = job.conds, p = job.params;
            const basicReq = C.ITEM_BASIC_REQS[p.checker];
            if (basicReq && !basicReq(eng, p, conds)) return null;
            if (!C.checkUltimateCondsMatch(eng, seed, r.key, conds, job.searchFilterLoc)) return null;
            eng.loadFloors();
            if (!C.chestCondsMatch(eng, conds)) return null;
            const hr = C.DUNGEON_CHECKERS[p.checker](eng, p);
            if (!hr || !hr.isHit) return null;
            const rows = hr.multi
                ? hr.multi.map(row => ({ floor: row.floor, astar: row.astar, astarText: row.astarText, hit: hitText(row.displayHtml),
                                         isB10: !!row.isB10, isJfireB10: !!row.isJfireB10, isX3: !!row.isX3 }))
                : [{ floor: hr.jumpFloor || 0, astar: hr.astar, astarText: hr.astarText, hit: hitText(hr.displayHtml), isX3: !!hr.astarX3 }];
            return rows.map(row => Object.assign(row, { cost: row.astar == null ? Infinity : row.astar }));
        }

        async function runJob(job) {
            if (job.kind === 'fastest') job.onlyMonStr = C.buildOnlyMonExpectedStr(job.conds);
            const topN = job.topN;
            const ranks = job.ranks.map((rank, ri) => ({ rank, ri, rStr: C.hex2(rank), key: C.resolveRankKey(C.hex2(rank), rank) }));
            let processed = 0, hits = 0, lastPost = Date.now();
            const top = [];
            const bound = () => Math.min(job.bound, top.length >= topN ? top[top.length - 1].cost : Infinity);
            const insert = item => {
                let i = top.length;
                while (i > 0 && (top[i - 1].cost > item.cost || (top[i - 1].cost === item.cost && top[i - 1].ord > item.ord))) i--;
                top.splice(i, 0, item);
                if (top.length > topN) top.pop();
            };

            for (let seed = job.startSeed; seed <= job.endSeed && !cancelled; seed++) {
                for (const r of ranks) {
                    processed++;
                    const eng = new C.TreasureMap(seed, r.rank);
                    C.resetLocationCache();
                    const base = { seed, rank: r.rank, rStr: r.rStr, ord: r.ri * 0x10000 + seed };
                    if (job.kind === 'fastest') {
                        const hit = fastestHit(eng, job, seed, r);
                        if (!hit) continue;
                        hits++;
                        const meta = mapMeta(eng);
                        if (job.lowerBounds) {
                            const lbs = [];
                            for (let f = 0; f < hit.limit; f++) lbs.push(cost(seed, f, 0, 1, false));
                            insert(Object.assign(base, meta, { cost: lbs.reduce((a, c) => a + c, 0), lbs }));
                            continue;
                        }
                        const res = fastestCost(seed, hit.limit, bound());
                        if (res.cost === null) continue;
                        insert(Object.assign(base, meta, { cost: res.cost, per: res.per }));
                    } else {
                        const rows = itemRows(eng, job, seed, r);
                        if (!rows) continue;
                        hits++;
                        const meta = mapMeta(eng);
                        rows.forEach((row, k) => insert(Object.assign({}, base, row, meta, { ord: base.ord * 4 + k })));
                    }
                }
                if (Date.now() - lastPost > 200) {
                    lastPost = Date.now();
                    self.postMessage({ type: 'progress', gen: job.gen, processed, hits });
                    await new Promise(res => setTimeout(res, 0));
                }
            }
            self.postMessage({ type: 'done', gen: job.gen, processed, hits, items: top });
        }

        let captured = [];
        const CR = DQ9AT_CORE({ tkg, floor: floorOf, calcPointWalkCost: idealPointWalkCost, isOpenTile: walk.isOpenTile, onRoute: w => captured.push(w) });
        function routeOf(job, item) {
            let legs;
            if (job.kind === 'fastest') {
                legs = item.per.map((_, f) => ({ f, from: 'up', to: 'down' }));
            } else {
                const eng = new CR.TreasureMap(item.seed, item.rank);
                eng.loadFloors();
                captured = [];
                CR.DUNGEON_CHECKERS[job.params.checker](eng, job.params);
                const routes = captured.filter(r => r);
                const same = routes.filter(r => Math.abs(r.cost - item.cost) < 1e-9);
                const pick = same.find(r => r.legs.length && r.legs[r.legs.length - 1].f === item.floor) || same[0];
                if (!pick) return null;
                const key = (f, t) => {
                    const i = tilesOf(item.seed, f).findIndex(q => q && q.x === t[0] && q.y === t[1]);
                    return i === 0 ? 'up' : i === 1 ? 'down' : 'c' + (i - 2);
                };
                legs = pick.legs.map(l => ({ f: l.f, from: key(l.f, l.from), to: key(l.f, l.to) }));
            }
            const index = k => k === 'up' ? 0 : k === 'down' ? 1 : 2 + Number(k.slice(1));
            const visits = [];
            for (const l of legs) {
                const last = visits[visits.length - 1];
                const c = cost(item.seed, l.f, index(l.from), index(l.to), true);
                if (last && last.f === l.f) { last.legs.push([l.from, l.to]); last.cost += c; }
                else visits.push({ f: l.f, legs: [[l.from, l.to]], cost: c });
            }
            return { visits, cost: visits.reduce((a, v) => a + v.cost, 0) };
        }

        self.onmessage = e => {
            if (e.data.type === 'cancel') cancelled = true;
            else if (e.data.type === 'run') {
                cancelled = false;
                runJob(e.data.job).catch(err => self.postMessage({ type: 'error', gen: e.data.job.gen, message: String(err && err.stack || err) }));
            }
            else if (e.data.type === 'exact') {
                const { gen, seed, limit, bound, known } = e.data;
                try { self.postMessage({ type: 'exact', gen, res: fastestCost(seed, limit, bound, known) }); }
                catch (err) { self.postMessage({ type: 'error', gen, message: String(err && err.stack || err) }); }
            }
            else if (e.data.type === 'route') {
                let route = null, error = null;
                try { route = routeOf(e.data.job, e.data.item); } catch (err) { error = String(err && err.stack || err); }
                self.postMessage({ type: 'route', id: e.data.id, route, error });
            }
        };
    }

    function tkgGeneratorSource() {
        const script = [...document.scripts].find(s => !s.src && s.textContent.includes('function FUN_02090444('));
        const text = script ? script.textContent : '';
        const cut = text.indexOf('function drawOverlapCanvas(');
        if (cut < 0) throw new Error("TKG generator not found in index.html");
        return `function TKG_GEN() {\n${text.slice(0, cut)}\nreturn {
    generate: (seed, floor1) => FUN_02090444(seed, floor1),
    get grid() { return mapGrid; }, get width() { return mapWidth; }, get height() { return mapHeight; },
    get bitfield() { return bitfieldGrid; }, get context() { return mapContext; },
    getEnvironment, envIndices, calculateStairsCoords, calculateChestCoords, LCG,
    tileMap, TILE_WALL, TILE_DIVIDER,
};\n}\n`;
    }

    let runtimeSource = null;
    function getRuntimeSource() {
        if (!runtimeSource) {
            runtimeSource = [DQ9AT_CORE.toString(), createIdealWalk.toString(), tkgGeneratorSource(),
                             `(${searchRuntime.toString()})(self);`].join('\n;\n');
        }
        return runtimeSource;
    }

    function startRuntime(onMessage) {
        const src = getRuntimeSource();
        try {
            const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
            const w = new Worker(url);
            w.onmessage = e => onMessage(e.data);
            w.onerror = e => { e.preventDefault(); onMessage({ type: 'error', message: e.message || 'Worker error' }); };
            return { post: m => w.postMessage(m), worker: true };
        } catch (err) {
            console.warn('Web Workers unavailable; searching on the main thread.', err);
            const fake = { postMessage: m => setTimeout(() => onMessage(m), 0), onmessage: null };
            new Function('self', src)(fake);
            return { post: m => fake.onmessage({ data: m }), worker: false };
        }
    }

    function workerCount() {
        const q = parseInt(new URLSearchParams(location.search).get('workers'), 10);
        return Math.max(1, Math.min(q >= 1 ? q : navigator.hardwareConcurrency || 4, 256));
    }

    let pool = null, runGen = 0;
    const FREES = ['done', 'exact', 'error'];
    function getPool() {
        if (pool) return pool;
        pool = { rts: [], idle: [], run: null };
        const onMessage = (i, m) => {
            if (FREES.includes(m.type) && !pool.idle.includes(i)) pool.idle.push(i);
            if (pool.run) pool.run(i, m);
        };
        for (let i = 0, n = workerCount(); i < n; i++) {
            const rt = startRuntime(m => onMessage(i, m));
            pool.rts.push(rt);
            pool.idle.push(i);
            if (!rt.worker) break;
        }
        console.info(`Search pool: ${pool.rts.length} ${pool.rts[0].worker ? 'Web Workers' : 'main thread'} (override with ?workers=N)`);
        return pool;
    }

    const CHUNKS_PER_WORKER = 12, CHUNK_MIN = 16, CHUNK_MAX = 1024;
    function runJob(job, onProgress) {
        const p = getPool(), gen = ++runGen;
        const span = job.endSeed - job.startSeed + 1, total = span * job.ranks.length;
        const size = Math.max(CHUNK_MIN, Math.min(CHUNK_MAX, Math.ceil(span / (p.rts.length * CHUNKS_PER_WORKER))));
        const queue = [];
        for (let a = job.startSeed; a <= job.endSeed; a += size) queue.push([a, Math.min(job.endSeed, a + size - 1)]);
        const busy = new Map();
        let top = [], processed = 0, hits = 0, stopped = false, resolve, reject;
        const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
        const bound = () => top.length >= job.topN ? top[job.topN - 1].cost : Infinity;
        const report = () => {
            let hot = 0, h = 0;
            for (const b of busy.values()) { hot += b.processed; h += b.hits; }
            onProgress({ processed: processed + hot, hits: hits + h }, total);
        };
        const finish = () => { p.run = null; resolve({ items: top, processed, hits, workers: p.rts[0].worker ? p.rts.length : 0 }); };
        const dispatch = () => {
            while (!stopped && queue.length && p.idle.length) {
                const i = p.idle.shift(), [a, b] = queue.shift();
                busy.set(i, { processed: 0, hits: 0 });
                p.rts[i].post({ type: 'run', job: Object.assign({}, job, { startSeed: a, endSeed: b, gen, bound: bound() }) });
            }
            if (!busy.size && (stopped || !queue.length)) finish();
        };
        p.run = (i, m) => {
            if (m.gen !== undefined && m.gen !== gen) { if (FREES.includes(m.type)) dispatch(); return; }
            if (m.type === 'error') {
                stopped = true;
                busy.forEach((_, j) => p.rts[j].post({ type: 'cancel' }));
                p.run = null;
                reject(new Error(m.message));
                return;
            }
            if (!busy.has(i)) return;
            if (m.type === 'progress') { busy.set(i, m); report(); return; }
            if (m.type !== 'done') return;
            busy.delete(i);
            processed += m.processed;
            hits += m.hits;
            top = top.concat(m.items).sort(byCost).slice(0, job.topN);
            report();
            dispatch();
        };
        dispatch();
        return { promise, cancel: () => { stopped = true; busy.forEach((_, j) => p.rts[j].post({ type: 'cancel' })); } };
    }

    const byCost = (x, y) => x.cost - y.cost || x.ord - y.ord;
    const TIE = 1e-9;
    function runFastestMap(job, onProgress) {
        let stopped = false, stage = runJob(Object.assign({}, job, { lowerBounds: true, topN: Infinity }), onProgress);
        const promise = stage.promise.then(first => new Promise((resolve, reject) => {
            const p = getPool(), gen = ++runGen, cands = first.items, busy = new Map(), walked = new Map();
            let next = 0, top = [];
            const bound = () => (top.length >= job.topN ? top[job.topN - 1].cost : Infinity) + TIE;
            const known = c => walked.get(c.seed) || [];
            const add = (c, per, cost) => { top = top.concat([Object.assign({}, c, { cost, per: per.slice(0, c.lbs.length), lbs: undefined })]).sort(byCost).slice(0, job.topN); };
            const done = () => stopped || next >= cands.length || cands[next].cost > bound();
            const dispatch = () => {
                while (!done() && p.idle.length) {
                    const c = cands[next++], k = known(c), sum = c.lbs.reduce((a, lb, f) => a + (k[f] ?? lb), 0);
                    if (sum === Infinity || sum > bound()) continue;
                    if (c.lbs.every((_, f) => k[f] !== undefined)) { add(c, k, sum); continue; }
                    const i = p.idle.shift();
                    busy.set(i, c);
                    p.rts[i].post({ type: 'exact', gen, seed: c.seed, limit: c.lbs.length, bound: bound(), known: k });
                }
                if (!busy.size && done()) { p.run = null; resolve({ items: top, hits: first.hits, workers: first.workers }); }
            };
            p.run = (i, m) => {
                if (m.gen !== undefined && m.gen !== gen) { if (FREES.includes(m.type)) dispatch(); return; }
                if (m.type === 'error') { stopped = true; p.run = null; reject(new Error(m.message)); return; }
                if (m.type !== 'exact' || !busy.has(i)) return;
                const c = busy.get(i), k = known(c).slice();
                busy.delete(i);
                m.res.per.forEach((v, f) => { if (v !== undefined && v !== null) k[f] = v; });
                walked.set(c.seed, k);
                if (m.res.cost !== null) add(c, m.res.per, m.res.cost);
                const nums = [walked.size, next, cands.length];
                onProgress({ processed: 1, hits: first.hits, text: () => fill('ranking', ...nums) }, 1);
                dispatch();
            };
            stage = { cancel: () => { stopped = true; } };
            dispatch();
        }));
        return { promise, cancel: () => stage.cancel() };
    }

    let core = null;
    function getCore() { return core || (core = DQ9AT_CORE()); }
    const val = id => document.getElementById(id).value.trim();
    const checked = id => document.getElementById(id).checked;

    const COND_IDS = {
        prefix: 'srchPrefix', suffix: 'srchSuffix', locale: 'srchLocale', lv: 'srchLv', location: 'srchLocation',
        bq: 'srchBq', env: 'srchEnv', monster: 'srchMonster', depth: 'srchDepth',
        boss: 'srchBoss', seedMin: 'srchSeedMin', seedMax: 'srchSeedMax', elist: 'srchElist', onlyMon: 'srchOnlyMon',
    };
    function getConds() {
        const C = getCore(), conds = {};
        for (const [k, id] of Object.entries(COND_IDS)) conds[k] = val(id);
        conds.reqBox = {};
        for (let r = 1; r <= 10; r++) conds.reqBox[r] = parseInt(val('srchBox' + C.CHEST_RANK[r])) || 0;
        conds.hasBoxCond = Object.values(conds.reqBox).some(v => v > 0);
        return conds;
    }

    function baseJob(conds, filterRanks) {
        const C = getCore();
        const loc = C.parseLocationCode(conds.location), bq = C.parseBaseQuality(conds.bq);
        if (Number.isNaN(loc) || Number.isNaN(bq)) { setStatus(() => word('B07')); return null; }
        let startSeed = conds.seedMin ? parseInt(conds.seedMin, 16) : 0;
        let endSeed = conds.seedMax ? parseInt(conds.seedMax, 16) : 0xFFFF;
        if (isNaN(startSeed) || startSeed < 0) startSeed = 0;
        if (isNaN(endSeed) || endSeed > 0xFFFF) endSeed = 0xFFFF;
        if (startSeed > endSeed) [startSeed, endSeed] = [endSeed, startSeed];
        const searchFilterLoc = checked('srchFilterLoc');
        if (searchFilterLoc) endSeed = Math.min(endSeed, C.LOCATION_SEED_MAX);
        if (startSeed > endSeed) { alert(word('A08')); return null; }
        const locationCap = (C.hasConditionValue(conds.location) || C.hasConditionValue(conds.bq)) ? C.LOCATION_SEED_MAX : 0xFFFF;
        endSeed = Math.min(endSeed, locationCap);
        let ranks = checked('srchAllRanks') ? C.MAP_RANK.slice() : [parseInt(val('srchRank'), 16)];
        ranks = filterRanks(ranks, conds);
        if (!ranks.length) { setStatus(() => word('B08')); return null; }
        return { conds, ranks, startSeed, endSeed, searchFilterLoc };
    }

    function fastestJob() {
        const C = getCore(), conds = getConds();
        if (conds.onlyMon && conds.elist && !C.isCombinedElistMonsterSearch(conds)) { alert(word('A11')); return null; }
        if (conds.elist === 'MULTI_SPECIAL') { alert(word('A13')); return null; }
        const mode = (conds.elist || conds.onlyMon) ? 'floor' : 'map';
        if (mode === 'map' && !(conds.depth || conds.lv || conds.elist || conds.onlyMon || conds.location || conds.boss)) { alert(word('A14')); return null; }
        const job = baseJob(conds, C.sharedRankFilter);
        if (!job) return null;
        return Object.assign(job, { kind: 'fastest', mode, topN: mode === 'floor' ? Infinity : 50 });
    }

    const qlSec = () => ({ D: null, '5D': 0, '9D': 4 })[val('srchQlMode')];
    const itemGroup = () => { const o = document.getElementById('srchItem').selectedOptions[0]; return o ? o.parentElement.dataset.group : ''; };
    function itemJob(checker, filterRanks, params, preset) {
        const job = baseJob(getConds(), filterRanks);
        if (!job) return null;
        return Object.assign(job, { kind: 'item', params: Object.assign({ checker }, params), topN: Infinity, preset: preset || {} });
    }
    function quickloadTarget() {
        const C = getCore(), targetItem = val('srchItem'), isB9F = itemGroup() === 'ogS';
        if (itemGroup() === 'og5') { alert(word('A03')); return null; }
        const checkItems = C.expandItemGroup(targetItem);
        const isThree = C.b3fThreeItems.includes(targetItem);
        return { targetItem, isB9F, checkItems, reqCount: isB9F ? 2 : isThree ? 3 : 2, targetFloors: isB9F ? [8] : isThree ? [2] : [2, 3] };
    }
    function qlJob() {
        const C = getCore(), t = quickloadTarget();
        if (!t) return null;
        const chestRanks = C.getChestRanksForItems(t.checkItems);
        const filter = (ranks, conds) => C.filterMapRanksBySMRAndChest(ranks, conds, [chestRanks], t.isB9F ? 2 : 0);
        const preset = { b9Rows: t.isB9F, x3Count: t.reqCount + 1 };
        if (val('srchQlMode') === 'D') {
            return itemJob('quickload', filter, { targetFloors: t.targetFloors, checkItems: t.checkItems, reqCount: t.reqCount, isB9F: t.isB9F,
                                                  chestRanks, wantAstar: true, checkB10: t.isB9F }, preset);
        }
        return itemJob('quickload9', filter, { targetFloors: t.targetFloors, checkItems: t.checkItems, reqCount: t.reqCount, isB9F: t.isB9F,
                                               chestRanks, qlSec: qlSec(), wantAstar: true, checkB10: t.isB9F }, preset);
    }
    function comboJob() {
        const C = getCore(), targetItem = val('srchItem'), sec = qlSec();
        if (targetItem === 'Sainted soma') {
            return itemJob('jfire', ranks => ranks.filter(rank => C.row4(C.D_C, 8, rank, C.NO_ROW)[1] >= 9),
                           { qlSec: sec, wantAstar: true }, { jfire: true });
        }
        let wpTargets, strictMatTargets, broadMatTargets = [], isMillionaire = false, isMonsterBox = false, minSec = 0, maxSec = 0;
        if (targetItem === 'Millionaire') {
            isMillionaire = true;
            wpTargets = C.ITEMS_MILLIONAIRE;
            strictMatTargets = ['Gold bar', 'Orichalcum'];
            broadMatTargets = C.ITEMS_MILLIONAIRE_BOX3.concat(['Gold bar', 'Orichalcum']);
        } else if (itemGroup() === 'og5') {
            isMonsterBox = true;
            wpTargets = [targetItem];
            strictMatTargets = [targetItem];
            if (targetItem === "Pandora's box") { minSec = 25; maxSec = 35; } else { minSec = 20; maxSec = 30; }
        } else if (targetItem === 'Dangerous bustier') { wpTargets = ['Dangerous bustier']; strictMatTargets = ['Aggressence']; }
        else if (targetItem === 'Fuddle bow') { wpTargets = ['Fuddle bow']; strictMatTargets = ['Mirrorstone']; }
        else if (targetItem === 'Slime shield') { wpTargets = ['Slime shield']; strictMatTargets = ['Iron ore']; }
        else if (targetItem === "Sorcerer's stone") { wpTargets = ["Sorcerer's stone"]; strictMatTargets = ['670G']; }
        else { alert(word('A05')); return null; }
        const allMatTargets = isMillionaire ? broadMatTargets : strictMatTargets;
        return itemJob('tk', (ranks, conds) => C.filterMapRanksBySMRAndChest(ranks, conds, [C.getChestRanksForItems(wpTargets), C.getChestRanksForItems(allMatTargets)], 0),
                       { targetItem, wpTargets, strictMatTargets, broadMatTargets, isMillionaire, isMonsterBox, minSec, maxSec, qlSec: sec, wantAstar: true });
    }
    function thirdJob() {
        const C = getCore(), targetValue = val('srchItem');
        if (!['Ethereal stone', 'Lucida shard', 'Sainted soma', "Hephaestus' flame", 'Millionaire'].includes(targetValue)) { alert(word('A05')); return null; }
        const isS3 = targetValue === 'Sainted soma';
        const checkItems = isS3 ? ["Sage's elixir", 'Sainted soma'] : targetValue === 'Millionaire' ? C.ITEMS_MILLIONAIRE_BOX3 : [targetValue];
        const targetFloors = isS3 ? [12, 13] : [2, 3];
        const chestRanks = isS3 ? [10] : C.getChestRanksForItems(checkItems);
        return itemJob('third', (ranks, conds) => C.filterMapRanksBySMRAndChest(ranks, conds, [chestRanks], isS3 ? 3 : 0),
                       { targetFloors, checkItems, isS3, chestRanks, wantAstar: true });
    }

    function shapeItems(items, preset) {
        let arr = items;
        if (preset.b9Rows) arr = arr.filter(it => !it.isB10).concat(arr.filter(it => it.isB10).slice(0, 5));
        if (preset.jfire) arr = arr.filter(it => !it.isJfireB10).concat(arr.filter(it => it.isJfireB10).slice(0, 5));
        arr.sort((x, y) => x.cost - y.cost || x.ord - y.ord);
        if (preset.x3Count !== undefined) {
            const tail = arr.filter(it => it.isX3);
            if (tail.length) arr = arr.filter(it => !it.isX3).concat([{ header: 'x' + preset.x3Count }], tail);
        }
        return arr;
    }

    let statusText = null;
    function setStatus(text) { statusText = text; document.getElementById("srchStatus").textContent = text(); }

    function buildPanel() {
        const C = getCore();
        const style = document.createElement("style");
        style.textContent = `
            .srch-panel { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; max-width: 100%; box-sizing: border-box; }
            .srch-panel .srch-row { display: flex; gap: 8px 12px; align-items: center; flex-wrap: wrap; }
            .srch-panel .srch-row > span { display: inline-flex; gap: 6px; align-items: center; }
            .srch-panel select, .srch-panel button { background: #1e1e1e; border: 1px solid #555; color: #fff; padding: 6px 8px; font-family: monospace; font-size: 16px; max-width: 100%; }
            .srch-panel button { cursor: pointer; }
            .srch-panel .srch-title { align-self: stretch; }
            .srch-panel .srch-row > span.lang-row { margin-left: auto; gap: 4px; }
            .srch-panel .lang-sw { background: #224; color: #888; border-color: #444; border-radius: 4px; font-weight: bold; transition: all .15s; }
            .srch-panel .lang-sw:hover { border-color: #00A2E8; color: #ccc; }
            .srch-panel .lang-sw[aria-pressed=true] { background: #00A2E8; color: #fff; border-color: #00A2E8; }
            .srch-panel input.srch-hex { width: 70px; text-transform: uppercase; }
            .srch-panel .srch-note { color: #999; }
            .srch-panel .srch-head { color: #fff; font-weight: bold; }
            .srch-panel input[type=checkbox] { width: auto; margin: 0; }
            .srch-panel .srch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); align-items: end; gap: 6px 10px; width: 100%; }
            .srch-panel .srch-cell { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            .srch-panel .srch-cell > label { color: #aaa; text-align: left; justify-self: start; }
            .srch-panel .srch-cell select, .srch-panel .srch-cell input { width: 100%; box-sizing: border-box; min-width: 0; }
            .srch-panel .srch-boxes { display: flex; flex-wrap: wrap; gap: 4px 8px; }
            .srch-panel .srch-boxes label { display: inline-flex; gap: 3px; align-items: center; }
            .srch-panel .srch-boxes input.srch-box { width: 40px; padding: 4px; box-sizing: border-box; }

            .srch-table { border-collapse: collapse; }
            .srch-table th, .srch-table td { border: 1px solid #555; padding: 4px 8px; text-align: right; }
            .srch-table td.srch-left { text-align: left; }
            .srch-table tr.srch-pick { cursor: pointer; }
            .srch-table tr.srch-pick:hover { background: #3a3a3a; }
            .srch-table .srch-floors { color: #999; text-align: left; }
            .srch-table tr.srch-route td { background: #252525; line-height: 2; }
            .srch-table .srch-stop { display: inline-block; border: 1px solid #555; padding: 0 6px; margin: 2px 2px; cursor: pointer; white-space: nowrap; }
            .srch-table .srch-stop:hover { background: #3a3a3a; }
            .srch-table .srch-stop.on { background: #6a206a; color: #fff; }
        `;
        document.body.appendChild(style);

        const opts = list => list.map(([v, t]) => `<option value="${v}"${wordAttr(t)}>${word(t)}</option>`).join('');
        const named = (obj, i1, i2) => Object.keys(obj).map(k => [k, `${obj[k][i1]} ${obj[k][i2]}`]);
        const sel = (id, list) => `<select id="${id}"><option value="">------</option>${opts(list)}</select>`;
        const label = (k, id) => `<label for="${id}"${wordAttr(k)}>${word(k)}</label>`;
        const field = (k, id, html) => `<span>${label(k, id)}${html}</span>`;
        const cell = (k, id, html) => `<div class="srch-cell">${label(k, id)}${html}</div>`;
        const button = (id, k) => `<button id="${id}" data-label="${k}">${word(k)}</button>`;
        const num = (id, min, max) => `<input type="number" id="${id}" min="${min}" max="${max}">`;

        const onlyMon = [], seen = new Set(['0B5', '01B', '0B9']);
        const monOpt = id => [C.MONSTER_DB[id].en, `${C.MONSTER_DB[id].en} ${C.MONSTER_DB[id].jp}`];
        ['0B5', '01B', '0B9'].forEach(id => onlyMon.push(monOpt(id)));
        [1, 2, 3, 4, 5].forEach(env => C.ONLY_MONSTERS[env].forEach(id => { if (id && !seen.has(id)) { seen.add(id); onlyMon.push(monOpt(id)); } }));

        const rankOpts = C.MAP_RANK.map(r => [C.hex2(r), C.hex2(r)]);
        const boxes = [];
        for (let r = 10; r >= 1; r--) boxes.push(`<label>${C.CHEST_RANK[r]} <input type="number" class="srch-box" id="srchBox${C.CHEST_RANK[r]}" min="0" max="40"></label>`);
        const items = Object.entries(ITEM_GROUPS).map(([g, list]) =>
            `<optgroup label="" data-group="${g}">${list.map(it => `<option value="${it}">${it}</option>`).join('')}</optgroup>`).join('');

        const panel = document.createElement("div");
        panel.className = "panel srch-panel";
        panel.innerHTML = `
            <div class="srch-row srch-title"><b${wordAttr('title')}>${word('title')}</b><span class="tip" tabindex="0"${tipAttr('titleTip')}>ⓘ</span>
                <span class="lang-row">${LANGS.map(([, name], L) => `<button type="button" class="lang-sw" data-lang="${L}">${name}</button>`).join('')}</span></div>
            <div class="srch-row">
                <span><input type="checkbox" id="srchAllRanks" checked>${label('F01', 'srchAllRanks')}</span>
                ${field('Rank', 'srchRank', `<select id="srchRank">${opts(rankOpts)}</select>`)}
                <span><input type="checkbox" id="srchFilterLoc">${label('F02', 'srchFilterLoc')}</span>
            </div>
            <div class="srch-head">Ultimate Search</div>
            <div class="srch-grid">
                ${cell('G03', 'srchPrefix', sel('srchPrefix', named(C.PREFIX_NAMES, 0, 1)))}
                ${cell('G04', 'srchSuffix', sel('srchSuffix', named(C.SUFFIX_NAMES, 0, 1)))}
                ${cell('G05', 'srchLocale', sel('srchLocale', named(C.LOCALE_NAMES, 0, 1)))}
                ${cell('C02', 'srchEnv', sel('srchEnv', named(C.ENV_NAMES, 0, 1)))}
                ${cell('Lv', 'srchLv', num('srchLv', 1, 99))}
                ${cell('C03', 'srchMonster', num('srchMonster', 1, 9))}
                ${cell('G10', 'srchDepth', num('srchDepth', 2, 16))}
                ${cell('G06', 'srchLocation', '<input type="text" class="srch-hex" id="srchLocation" maxlength="2" placeholder="96">')}
                ${cell('GBQ', 'srchBq', num('srchBq', 2, 248))}
                ${cell('BOSS', 'srchBoss', sel('srchBoss', named(C.BOSS_NAMES, 0, 2)))}
                ${cell('G12', 'srchElist', sel('srchElist', ELIST_OPTIONS))}
                ${cell('G13', 'srchOnlyMon', sel('srchOnlyMon', onlyMon))}
            </div>
            <div class="srch-boxes">${boxes.join('')}</div>
            <div class="srch-row">
                <span>${label('G14', 'srchSeedMin')}
                <input type="text" class="srch-hex" id="srchSeedMin" maxlength="4" placeholder="0000"> -
                <input type="text" class="srch-hex" id="srchSeedMax" maxlength="4" placeholder="FFFF"></span>
                ${button('srchGo', 'Search')}<span class="tip" tabindex="0"${tipAttr('searchTip')}>ⓘ</span>
            </div>
            <div class="srch-head"><span${wordAttr('H00')}>${word('H00')}</span> <span class="tip" tabindex="0"${tipAttr('G16', 'ctTip')}>ⓘ</span></div>
            <div class="srch-row">
                <select id="srchQlMode"><option value="D">D</option><option value="5D">5D</option><option value="9D">9D</option></select>
                <select id="srchItem">${items}</select>
                ${button('srchQL', 'H01')}
                ${button('srchCombo', 'H02')}
                ${button('srch3rd', 'H03')}
            </div>
            <div class="srch-note" id="srchStatus"></div>
            <table class="srch-table" id="srchResults"></table>
        `;
        document.querySelector(".dist-panel").after(panel);

        const hexCheck = (id, min, max, msg) => document.getElementById(id).addEventListener("change", e => {
            const v = e.target.value.trim();
            if (v && (!/^[0-9a-fA-F]+$/.test(v) || parseInt(v, 16) < min || parseInt(v, 16) > max)) { alert(word(msg)); e.target.value = ''; }
        });
        hexCheck("srchLocation", 0x01, 0x96, 'A09');
        hexCheck("srchSeedMin", 0, 0xFFFF, 'A10');
        hexCheck("srchSeedMax", 0, 0xFFFF, 'A10');

        let running = null;
        const bind = (btnId, makeJob) => {
            const btn = document.getElementById(btnId);
            btn.addEventListener("click", () => {
                if (running) { if (running.btn === btn) running.cancel(); return; }
                const job = makeJob();
                if (!job) return;
                document.getElementById("srchResults").innerHTML = "";
                btn.textContent = "STOP";
                const t0 = Date.now();
                running = (job.kind === 'fastest' && job.topN < Infinity ? runFastestMap : runJob)(job,
                    (p, total) => setStatus(() => p.text ? p.text() : `${Math.floor(p.processed / total * 100)}% — ${p.hits} ${word('B03')}`));
                running.btn = btn;
                running.promise.then(res => {
                    const items = job.kind === 'item' ? shapeItems(res.items, job.preset) : res.items;
                    const secs = ((Date.now() - t0) / 1000).toFixed(1);
                    const n = res.workers;
                    setStatus(() => fill('done', `${res.hits} ${word('B03')}`, secs, n ? fill(n > 1 ? 'workers' : 'worker', n) : word('mainThread')));
                    shown = { job, items };
                    if (job.kind === 'item') renderItemResults(items); else renderFastestResults(items);
                }).catch(err => setStatus(() => fill('error', err.message)))
                  .finally(() => { running = null; btn.textContent = word(btn.dataset.label); });
            });
        };
        bind("srchGo", fastestJob);
        bind("srchQL", qlJob);
        bind("srchCombo", comboJob);
        bind("srch3rd", thirdJob);

        function setLang(L) {
            lang = L;
            try { localStorage.setItem(LANG_KEY, String(L)); } catch (e) {}
            panel.querySelectorAll(".lang-sw").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.lang) === L)));
            panel.querySelectorAll("[data-text]").forEach(el => { el.textContent = word(el.dataset.text); });
            panel.querySelectorAll("button[data-label]").forEach(b => { if (!running || running.btn !== b) b.textContent = word(b.dataset.label); });
            panel.querySelectorAll("[data-tip-text]").forEach(el => { el.dataset.tip = el.dataset.tipText.split(' ').map(word).join(''); });
            panel.querySelectorAll("#srchResults tr.srch-pick").forEach(tr => { tr.title = word('showRoute'); });
            panel.querySelectorAll("#srchItem option").forEach(o => { o.textContent = C.itemName(o.value, L); });
            if (shown) panel.querySelectorAll("#srchResults [data-t]").forEach(el => {
                el.textContent = cellText(shown.items[Number(el.closest('tr').dataset.i)], el.dataset.t);
            });
            if (statusText) setStatus(statusText);
            document.documentElement.dataset.lang = LANGS[L][0];
            document.dispatchEvent(new Event("langchange"));
        }
        panel.querySelectorAll(".lang-sw").forEach(b => b.addEventListener("click", () => setLang(Number(b.dataset.lang))));
        let saved = 0;
        try { saved = Number(localStorage.getItem(LANG_KEY)) || 0; } catch (e) {}
        setLang(LANGS[saved] ? saved : 0);

        document.getElementById("srchResults").addEventListener("click", e => {
            if (e.target.closest(".tip")) return;
            const stop = e.target.closest(".srch-stop");
            if (stop) { showStop(stop); return; }
            const tr = e.target.closest("tr.srch-pick");
            if (tr) toggleRoute(tr);
        });
    }

    const cellText = (it, key) => key === 'hit'
        ? it.hit[lang] + (it.astarText !== undefined ? ' ' + fill('routes', it.astarText) : '')
        : key === 'cost' ? fmt(it.cost) : it[key][lang];
    const textCell = (it, key, cls) => `<td class="${cls}" data-t="${key}">${cellText(it, key)}</td>`;

    let shown = null, routeRt = null, routeSeq = 0;
    const routeWaiting = new Map();
    function requestRoute(job, item) {
        if (!routeRt) {
            routeRt = startRuntime(m => {
                const cb = m.type === 'route' && routeWaiting.get(m.id);
                if (cb) { routeWaiting.delete(m.id); cb(m); }
            });
        }
        return new Promise((resolve, reject) => {
            const id = ++routeSeq;
            routeWaiting.set(id, m => m.error ? reject(new Error(m.error)) : resolve(m.route));
            routeRt.post({ type: 'route', id, job, item });
        });
    }

    const stopName = k => k === 'up' ? 'U' : k === 'down' ? 'D' : String(Number(k.slice(1)) + 1);
    function toggleRoute(tr) {
        const next = tr.nextElementSibling;
        if (next && next.classList.contains('srch-route')) { next.remove(); return; }
        const item = shown && shown.items[Number(tr.dataset.i)];
        if (!item) return;
        const row = document.createElement('tr');
        row.className = 'srch-route';
        row.innerHTML = `<td colspan="${tr.children.length}" class="srch-left"><span${wordAttr('routeWorking')}>${word('routeWorking')}</span></td>`;
        tr.after(row);
        const cell = row.firstElementChild, seedHex = tr.dataset.seed;
        requestRoute(shown.job, item).then(route => {
            if (!route) { cell.innerHTML = `<span${wordAttr('routeNone')}>${word('routeNone')}</span>`; return; }
            cell.innerHTML = `<span${wordAttr('route')}>${word('route')}</span> ` + route.visits.map(v => {
                const stops = [v.legs[0][0]].concat(v.legs.map(l => l[1])).map(stopName).join('→');
                return `<span class="srch-stop" data-seed="${seedHex}" data-floor="${v.f + 1}" data-legs='${JSON.stringify(v.legs)}'>` +
                       `B${v.f + 1}F ${stops} ${v.cost.toFixed(2)}</span>`;
            }).join(' ') + ` <span class="srch-note">= ${route.cost.toFixed(3)}</span>`;
            const stopsEls = cell.querySelectorAll('.srch-stop');
            if (stopsEls.length) showStop(stopsEls[stopsEls.length - 1]);
        }).catch(err => { cell.innerHTML = `<span${wordAttr('routeError')}>${word('routeError')}</span> `; cell.append(err.message); });
    }
    function showStop(el) {
        document.querySelectorAll('.srch-stop.on').forEach(s => s.classList.remove('on'));
        el.classList.add('on');
        window.DQ9Distance.showRoute(el.dataset.seed, Number(el.dataset.floor), JSON.parse(el.dataset.legs));
        const map = document.querySelector('.app.stacked .app-map.unpinned');
        if (map) map.scrollIntoView({ behavior: 'smooth' });
    }

    const hex4 = s => s.toString(16).toUpperCase().padStart(4, '0');
    const fmt = c => c === Infinity ? word('unreachable') : c.toFixed(3);

    function renderFastestResults(items) {
        const head = `<tr><th>#</th><th>Seed</th><th>Rank</th><th class="srch-left"${wordAttr('C01')}>${word('C01')}</th><th class="srch-left"${wordAttr('C02')}>${word('C02')}</th><th class="srch-left">Boss</th><th${wordAttr('C04')}>${word('C04')}</th><th${wordAttr('steps')}>${word('steps')}</th></tr>`;
        const rows = items.map((it, i) => {
            const per = it.per.map((c, f) => `B${f + 1}F ${c.toFixed(2)}`).join(' / ');
            return `<tr class="srch-pick" data-i="${i}" data-seed="${hex4(it.seed)}" title="${word('showRoute')}">` +
                   `<td>${i + 1}</td><td>${hex4(it.seed)}</td><td>${it.rStr}</td>${textCell(it, 'name', 'srch-left')}` +
                   `${textCell(it, 'type', 'srch-left')}${textCell(it, 'boss', 'srch-left')}<td>${it.fc}</td>` +
                   `<td><b data-t="cost">${cellText(it, 'cost')}</b><span class="tip" tabindex="0" data-tip="${per}">ⓘ</span></td></tr>`;
        }).join("");
        document.getElementById("srchResults").innerHTML = items.length ? head + rows : "";
    }

    function renderItemResults(items) {
        const head = `<tr><th>#</th><th>Seed</th><th>Rank</th><th class="srch-left"${wordAttr('C01')}>${word('C01')}</th><th${wordAttr('C04')}>${word('C04')}</th><th${wordAttr('steps')}>${word('steps')}</th><th class="srch-left"${wordAttr('hit')}>${word('hit')}</th></tr>`;
        let n = 0;
        const rows = items.map((it, i) => {
            if (it.header) return `<tr><td colspan="7" class="srch-left"><b>${it.header}</b></td></tr>`;
            return `<tr class="srch-pick" data-i="${i}" data-seed="${hex4(it.seed)}" title="${word('showRoute')}">` +
                   `<td>${++n}</td><td>${hex4(it.seed)}</td><td>${it.rStr}</td>${textCell(it, 'name', 'srch-left')}<td>${it.fc}</td>` +
                   `<td><b data-t="cost">${cellText(it, 'cost')}</b></td>${textCell(it, 'hit', 'srch-floors')}</tr>`;
        }).join("");
        document.getElementById("srchResults").innerHTML = items.length ? head + rows : "";
    }

    buildPanel();
})();

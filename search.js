(function () {
    const ELIST_OPTIONS = [
        ['MULTI_SPECIAL', 'Multi-Special-Floor'], ['SIZE_15', '15×15'], ['PARTIAL_NONE', 'Partially No-enemy'],
        ['4', '4-enemy'], ['3', '3-enemy'], ['2', '2-enemy'], ['ONLY', 'ONLY (1-enemy)'], ['NONE', 'No-enemy'],
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
    const MSG = {
        A03: 'Sorry! Quickload search is not available for chest monsters.',
        A05: 'Sorry! Searching for this item is currently unavailable.',
        A08: 'No valid maps in this Seed range when filtering by location.',
        A09: 'Invalid Location. Valid range: 01–96 (hex), digits 0–9 and A–F only.',
        A10: 'Invalid Seed. Valid range: 0000–FFFF (hex), digits 0–9 and A–F only.',
        A11: '"Only Monster" cannot be paired with ONLY (1-enemy) / No-enemy / 15x15 / Multi-special together.',
        A13: 'Fastest Map Search does not support this option.',
        A14: 'Fastest Map Search requires at least one of: Depth, Lv, Sp.Floor (ElistOfs), ONLY Monster, Location, or Boss.',
        B07: 'Conditions conflict. All searches skipped.',
        B08: 'Unable to match this Rank. Skipped.',
    };

    function searchRuntime(self) {
        const tkg = TKG_GEN();
        const walk = createIdealWalk(16, tkg);
        const tileWalk = createIdealWalk(1, tkg);
        const offsets = [...new Set(tkg.modifiers.concat(Object.values(tkg.exceptions)).map(m => m.x))];
        let cancelled = false;

        function genFloor(seed, floor1) {
            tkg.generate(seed, floor1);
            const ctx = tkg.context, hex = ctx.field_0.mapseed;
            const envName = tkg.getEnvironment(hex);
            const st = tkg.calculateStairsCoords(hex, envName);
            const chestTiles = (ctx.field_0 && ctx.field_0._chestCoords) || [];
            const pt = (c, tile) => {
                if (!c || !tile) return null;
                const x = walk.exactCoord(c.x, tile.x, offsets), y = walk.exactCoord(c.z, tile.y, offsets);
                return x === null || y === null ? null : { x, y };
            };
            return {
                points: [pt(st.up, ctx.upStairs), pt(st.down, ctx.downStairs)]
                    .concat(tkg.calculateChestCoords(hex, floor1, envName).map((c, i) => pt(c, chestTiles[i]))),
                tiles: [ctx.upStairs, ctx.downStairs].concat(chestTiles),
                context: ctx,
                info: { grid: tkg.grid, width: tkg.width, height: tkg.height, bitfield: tkg.bitfield, env: tkg.envIndices[envName] },
            };
        }

        const LB_SLACK = 2 * (0.5 + (Math.SQRT2 - 1) * 0.5) / 16;
        function costRow(fd, i, exact) {
            const row = fd.points.map(() => Infinity);
            if (fd.points[i]) {
                const cols = fd.points.flatMap((p, j) => p ? [j] : []);
                if (exact) {
                    walk.setFloor(fd.info);
                    const d = walk.gridFrom(fd.points, i, [0, 1]);
                    for (const j of cols) row[j] = d[j];
                } else {
                    tileWalk.setFloorTiles(fd.info);
                    const valid = fd.points.map(p => p || { x: 0, y: 0 });
                    const d = tileWalk.shortest(valid, i, cols);
                    for (const j of cols) row[j] = j === i ? 0 : Math.max(0, d[j] - LB_SLACK);
                }
            }
            return row;
        }

        let cacheSeed = -1, floorCache = [];
        function floorEntry(seed, f) {
            if (seed !== cacheSeed) { cacheSeed = seed; floorCache = []; }
            return floorCache[f] || (floorCache[f] = { rows: {}, fd: genFloor(seed, f + 1) });
        }
        function cost(seed, f, i, j, exact) {
            const e = floorEntry(seed, f), key = (exact ? 'x' : 'l') + i;
            if (!e.rows[key]) e.rows[key] = costRow(e.fd, i, exact);
            return e.rows[key][j];
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
        const C = DQ9AT_CORE({ tkg, floor: floorOf, calcPointWalkCost: idealPointWalkCost });

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

        function fastestCost(seed, limit, bound) {
            const lb = [];
            let rest = 0;
            for (let f = 0; f < limit; f++) { lb.push(cost(seed, f, 0, 1, false)); rest += lb[f]; }
            if (rest > bound) return null;
            const per = [];
            let sum = 0;
            for (let f = 0; f < limit; f++) {
                const c = cost(seed, f, 0, 1, true);
                if (c === Infinity) return null;
                per.push(c);
                sum += c;
                rest -= lb[f];
                if (sum + rest > bound) return null;
            }
            return { cost: sum, per };
        }

        const plain = html => String(html || '').replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
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
                ? hr.multi.map(row => ({ floor: row.floor, astar: row.astar, astarText: row.astarText, hit: plain(row.displayHtml),
                                         isB10: !!row.isB10, isJfireB10: !!row.isJfireB10, isX3: !!row.isX3 }))
                : [{ floor: hr.jumpFloor || 0, astar: hr.astar, astarText: hr.astarText, hit: plain(hr.displayHtml), isX3: !!hr.astarX3 }];
            return rows.map(row => Object.assign(row, { cost: row.astar == null ? Infinity : row.astar }));
        }

        async function runJob(job) {
            if (job.kind === 'fastest') job.onlyMonStr = C.buildOnlyMonExpectedStr(job.conds);
            const topN = job.topN;
            const ranks = job.ranks.map((rank, ri) => ({ rank, ri, rStr: C.hex2(rank), key: C.resolveRankKey(C.hex2(rank), rank) }));
            const total = (job.endSeed - job.startSeed + 1) * ranks.length;
            let processed = 0, hits = 0, lastPost = Date.now();
            const top = [];
            const bound = () => (top.length >= topN ? top[top.length - 1].cost : Infinity);
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
                        const res = fastestCost(seed, hit.limit, bound());
                        if (!res) continue;
                        insert(Object.assign(base, { name: eng.mapName, boss: eng.bossName, fc: eng.floorCount,
                                                     cost: res.cost, per: res.per }));
                    } else {
                        const rows = itemRows(eng, job, seed, r);
                        if (!rows) continue;
                        hits++;
                        rows.forEach((row, k) => insert(Object.assign({}, base, row, { ord: base.ord * 4 + k,
                            name: eng.mapName, boss: eng.bossName, fc: eng.floorCount })));
                    }
                }
                if (Date.now() - lastPost > 200) {
                    lastPost = Date.now();
                    self.postMessage({ type: 'progress', processed, total, hits });
                    await new Promise(res => setTimeout(res, 0));
                }
            }
            self.postMessage({ type: 'done', processed, total, hits, items: top, cancelled });
        }

        let captured = [];
        const CR = DQ9AT_CORE({ tkg, floor: floorOf, calcPointWalkCost: idealPointWalkCost, onRoute: w => captured.push(w) });
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
            else if (e.data.type === 'run') runJob(e.data.job).catch(err => self.postMessage({ type: 'error', message: String(err && err.stack || err) }));
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
    getEnvironment, envIndices, calculateStairsCoords, calculateChestCoords, modifiers, exceptions, LCG,
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
            return { post: m => w.postMessage(m), stop: () => w.terminate() };
        } catch (err) {
            const fake = { postMessage: m => setTimeout(() => onMessage(m), 0), onmessage: null };
            new Function('self', src)(fake);
            return { post: m => fake.onmessage({ data: m }), stop: () => fake.onmessage({ data: { type: 'cancel' } }) };
        }
    }

    function runJob(job, onProgress) {
        const nWorkers = Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 2) - 1));
        const span = job.endSeed - job.startSeed + 1;
        const chunks = [];
        for (let i = 0; i < nWorkers; i++) {
            const a = job.startSeed + Math.floor(span * i / nWorkers), b = job.startSeed + Math.floor(span * (i + 1) / nWorkers) - 1;
            if (a <= b) chunks.push([a, b]);
        }
        const status = chunks.map(() => ({ processed: 0, hits: 0 }));
        const runtimes = [];
        const promise = new Promise((resolve, reject) => {
            const results = [];
            let done = 0;
            chunks.forEach(([a, b], i) => {
                const rt = startRuntime(m => {
                    if (m.type === 'error') { runtimes.forEach(r => r.stop()); reject(new Error(m.message)); return; }
                    status[i] = m;
                    onProgress(status.reduce((s, x) => ({ processed: s.processed + x.processed, hits: s.hits + x.hits }), { processed: 0, hits: 0 }),
                               span * job.ranks.length);
                    if (m.type !== 'done') return;
                    results.push(...m.items);
                    rt.stop();
                    if (++done < chunks.length) return;
                    results.sort((x, y) => x.cost - y.cost || x.ord - y.ord);
                    resolve({ items: results.slice(0, job.topN), processed: status.reduce((s, x) => s + x.processed, 0),
                              hits: status.reduce((s, x) => s + x.hits, 0) });
                });
                runtimes.push(rt);
                rt.post({ type: 'run', job: Object.assign({}, job, { startSeed: a, endSeed: b }) });
            });
        });
        return { promise, cancel: () => runtimes.forEach(r => r.post({ type: 'cancel' })) };
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
        if (Number.isNaN(loc) || Number.isNaN(bq)) { setStatus(MSG.B07); return null; }
        let startSeed = conds.seedMin ? parseInt(conds.seedMin, 16) : 0;
        let endSeed = conds.seedMax ? parseInt(conds.seedMax, 16) : 0xFFFF;
        if (isNaN(startSeed) || startSeed < 0) startSeed = 0;
        if (isNaN(endSeed) || endSeed > 0xFFFF) endSeed = 0xFFFF;
        if (startSeed > endSeed) [startSeed, endSeed] = [endSeed, startSeed];
        const searchFilterLoc = checked('srchFilterLoc');
        if (searchFilterLoc) endSeed = Math.min(endSeed, C.LOCATION_SEED_MAX);
        if (startSeed > endSeed) { alert(MSG.A08); return null; }
        const locationCap = (C.hasConditionValue(conds.location) || C.hasConditionValue(conds.bq)) ? C.LOCATION_SEED_MAX : 0xFFFF;
        endSeed = Math.min(endSeed, locationCap);
        let ranks = checked('srchAllRanks') ? C.MAP_RANK.slice() : [parseInt(val('srchRank'), 16)];
        ranks = filterRanks(ranks, conds);
        if (!ranks.length) { setStatus(MSG.B08); return null; }
        return { conds, ranks, startSeed, endSeed, searchFilterLoc };
    }

    function fastestJob() {
        const C = getCore(), conds = getConds();
        if (conds.onlyMon && conds.elist && !C.isCombinedElistMonsterSearch(conds)) { alert(MSG.A11); return null; }
        if (conds.elist === 'MULTI_SPECIAL') { alert(MSG.A13); return null; }
        const mode = (conds.elist || conds.onlyMon) ? 'floor' : 'map';
        if (mode === 'map' && !(conds.depth || conds.lv || conds.elist || conds.onlyMon || conds.location || conds.boss)) { alert(MSG.A14); return null; }
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
        if (itemGroup() === 'og5') { alert(MSG.A03); return null; }
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
        else { alert(MSG.A05); return null; }
        const allMatTargets = isMillionaire ? broadMatTargets : strictMatTargets;
        return itemJob('tk', (ranks, conds) => C.filterMapRanksBySMRAndChest(ranks, conds, [C.getChestRanksForItems(wpTargets), C.getChestRanksForItems(allMatTargets)], 0),
                       { targetItem, wpTargets, strictMatTargets, broadMatTargets, isMillionaire, isMonsterBox, minSec, maxSec, qlSec: sec, wantAstar: true });
    }
    function thirdJob() {
        const C = getCore(), targetValue = val('srchItem');
        if (!['Ethereal stone', 'Lucida shard', 'Sainted soma', "Hephaestus' flame", 'Millionaire'].includes(targetValue)) { alert(MSG.A05); return null; }
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

    function setStatus(text) { document.getElementById("srchStatus").textContent = text; }

    function buildPanel() {
        const C = getCore();
        const style = document.createElement("style");
        style.textContent = `
            .srch-panel { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; max-width: 100%; box-sizing: border-box; }
            .srch-panel .srch-row { display: flex; gap: 8px 12px; align-items: center; flex-wrap: wrap; }
            .srch-panel .srch-row > span { display: inline-flex; gap: 6px; align-items: center; }
            .srch-panel select, .srch-panel button { background: #1e1e1e; border: 1px solid #555; color: #fff; padding: 6px 8px; font-family: monospace; font-size: 16px; max-width: 100%; }
            .srch-panel button { cursor: pointer; }
            .srch-panel input.srch-hex { width: 70px; text-transform: uppercase; }
            .srch-panel .srch-note { color: #999; font-size: 12px; }
            .srch-panel .srch-head { color: #fff; font-weight: bold; }
            .srch-panel input[type=checkbox] { width: auto; margin: 0; }
            .srch-panel .srch-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; gap: 6px 10px; width: 100%; }
            .srch-panel .srch-cell { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            .srch-panel .srch-cell > label { color: #aaa; font-size: 13px; text-align: left; justify-self: start; }
            .srch-panel .srch-cell select, .srch-panel .srch-cell input { width: 100%; box-sizing: border-box; min-width: 0; }
            .srch-panel .srch-boxes { display: flex; flex-wrap: wrap; gap: 4px 8px; }
            .srch-panel .srch-boxes label { display: inline-flex; gap: 3px; align-items: center; }
            .srch-panel .srch-boxes input.srch-box { width: 40px; padding: 4px; box-sizing: border-box; }

            .srch-table { border-collapse: collapse; }
            .srch-table th, .srch-table td { border: 1px solid #555; padding: 4px 8px; text-align: right; }
            .srch-table td.srch-left { text-align: left; }
            .srch-table tr.srch-pick { cursor: pointer; }
            .srch-table tr.srch-pick:hover { background: #3a3a3a; }
            .srch-table .srch-floors { color: #999; font-size: 12px; text-align: left; }
            .srch-table tr.srch-route td { background: #252525; line-height: 2; }
            .srch-table .srch-stop { display: inline-block; border: 1px solid #555; padding: 0 6px; margin: 2px 2px; cursor: pointer; white-space: nowrap; }
            .srch-table .srch-stop:hover { background: #3a3a3a; }
            .srch-table .srch-stop.on { background: #6a206a; color: #fff; }
        `;
        document.head.appendChild(style);

        const opts = list => list.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
        const named = (obj, i1, i2) => Object.keys(obj).map(k => [k, `${obj[k][i1]} ${obj[k][i2]}`]);
        const sel = (id, list) => `<select id="${id}"><option value="">------</option>${opts(list)}</select>`;
        const field = (label, id, html) => `<span><label for="${id}">${label}</label>${html}</span>`;
        const cell = (label, id, html) => `<div class="srch-cell"><label for="${id}">${label}</label>${html}</div>`;
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
            <div class="srch-row"><b>Ideal Walk Search</b><span class="tip" tabindex="0" data-tip="Searches ranked by the ideal walk. Click a result to see its route floor by floor; click a floor to show it on the map.">ⓘ</span></div>
            <div class="srch-row">
                <span><input type="checkbox" id="srchAllRanks" checked><label for="srchAllRanks">Search all Ranks</label></span>
                ${field('Rank', 'srchRank', `<select id="srchRank">${opts(rankOpts)}</select>`)}
                <span><input type="checkbox" id="srchFilterLoc"><label for="srchFilterLoc">Valid Locations</label></span>
            </div>
            <div class="srch-head">Ultimate Search</div>
            <div class="srch-grid">
                ${cell('Prefix', 'srchPrefix', sel('srchPrefix', named(C.PREFIX_NAMES, 0, 1)))}
                ${cell('Suffix', 'srchSuffix', sel('srchSuffix', named(C.SUFFIX_NAMES, 0, 1)))}
                ${cell('Locale', 'srchLocale', sel('srchLocale', named(C.LOCALE_NAMES, 0, 1)))}
                ${cell('Type', 'srchEnv', sel('srchEnv', named(C.ENV_NAMES, 0, 1)))}
                ${cell('Lv', 'srchLv', num('srchLv', 1, 99))}
                ${cell('SMR', 'srchMonster', num('srchMonster', 1, 9))}
                ${cell('Depth', 'srchDepth', num('srchDepth', 2, 16))}
                ${cell('Location', 'srchLocation', '<input type="text" class="srch-hex" id="srchLocation" maxlength="2" placeholder="96">')}
                ${cell('Base Quality', 'srchBq', num('srchBq', 2, 248))}
                ${cell('BOSS', 'srchBoss', sel('srchBoss', named(C.BOSS_NAMES, 0, 2)))}
                ${cell('Sp.Floor (ElistOfs)', 'srchElist', sel('srchElist', ELIST_OPTIONS))}
                ${cell('ONLY Monster', 'srchOnlyMon', sel('srchOnlyMon', onlyMon))}
            </div>
            <div class="srch-boxes">${boxes.join('')}</div>
            <div class="srch-row">
                <span><label for="srchSeedMin">Seed Range (Hex)</label>
                <input type="text" class="srch-hex" id="srchSeedMin" maxlength="4" placeholder="0000"> -
                <input type="text" class="srch-hex" id="srchSeedMax" maxlength="4" placeholder="FFFF"></span>
                <button id="srchGo" data-label="Search">Search</button><span class="tip" tabindex="0" data-tip="Fastest Map: entrance to the boss floor (top 50). With Sp.Floor (ElistOfs) or ONLY Monster, Fastest Floor: up to the floor before the special floor (all hits).">ⓘ</span>
            </div>
            <div class="srch-head">Chest Timer Search <span class="tip" tabindex="0" data-tip="B3/B4/B9 Solo･Party / Combo / 3rd Chest (B13:S3). Routes as D / 5D / 9D; all hits, sorted by the ideal walk. Ultimate Search conditions above also apply.">ⓘ</span></div>
            <div class="srch-row">
                <select id="srchQlMode"><option value="D">D</option><option value="5D">5D</option><option value="9D">9D</option></select>
                <select id="srchItem">${items}</select>
                <button id="srchQL" data-label="QL">QL</button>
                <button id="srchCombo" data-label="Combo">Combo</button>
                <button id="srch3rd" data-label="3rd">3rd</button>
            </div>
            <div class="srch-note" id="srchStatus"></div>
            <table class="srch-table" id="srchResults"></table>
        `;
        document.querySelector(".dist-panel").after(panel);

        const hexCheck = (id, min, max, msg) => document.getElementById(id).addEventListener("change", e => {
            const v = e.target.value.trim();
            if (v && (!/^[0-9a-fA-F]+$/.test(v) || parseInt(v, 16) < min || parseInt(v, 16) > max)) { alert(msg); e.target.value = ''; }
        });
        hexCheck("srchLocation", 0x01, 0x96, MSG.A09);
        hexCheck("srchSeedMin", 0, 0xFFFF, MSG.A10);
        hexCheck("srchSeedMax", 0, 0xFFFF, MSG.A10);

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
                running = runJob(job, (p, total) => setStatus(`${Math.floor(p.processed / total * 100)}% — ${p.hits} Found`));
                running.btn = btn;
                running.promise.then(res => {
                    const items = job.kind === 'item' ? shapeItems(res.items, job.preset) : res.items;
                    setStatus(`Done: ${res.hits} Found (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
                    shown = { job, items };
                    if (job.kind === 'item') renderItemResults(items); else renderFastestResults(items);
                }).catch(err => setStatus("Error: " + err.message))
                  .finally(() => { running = null; btn.textContent = btn.dataset.label; });
            });
        };
        bind("srchGo", fastestJob);
        bind("srchQL", qlJob);
        bind("srchCombo", comboJob);
        bind("srch3rd", thirdJob);

        document.getElementById("srchResults").addEventListener("click", e => {
            const stop = e.target.closest(".srch-stop");
            if (stop) { showStop(stop); return; }
            const tr = e.target.closest("tr.srch-pick");
            if (tr) toggleRoute(tr);
        });
    }

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
        row.innerHTML = `<td colspan="${tr.children.length}" class="srch-left">Route: working…</td>`;
        tr.after(row);
        const cell = row.firstElementChild, seedHex = tr.dataset.seed;
        requestRoute(shown.job, item).then(route => {
            if (!route) { cell.textContent = 'Route: not found.'; return; }
            cell.innerHTML = 'Route: ' + route.visits.map(v => {
                const stops = [v.legs[0][0]].concat(v.legs.map(l => l[1])).map(stopName).join('→');
                return `<span class="srch-stop" data-seed="${seedHex}" data-floor="${v.f + 1}" data-legs='${JSON.stringify(v.legs)}'>` +
                       `B${v.f + 1}F ${stops} ${v.cost.toFixed(2)}</span>`;
            }).join(' ') + ` <span class="srch-note">= ${route.cost.toFixed(3)}</span>`;
            const stopsEls = cell.querySelectorAll('.srch-stop');
            if (stopsEls.length) showStop(stopsEls[stopsEls.length - 1]);
        }).catch(err => { cell.textContent = 'Route error: ' + err.message; });
    }
    function showStop(el) {
        document.querySelectorAll('.srch-stop.on').forEach(s => s.classList.remove('on'));
        el.classList.add('on');
        window.DQ9Distance.showRoute(el.dataset.seed, Number(el.dataset.floor), JSON.parse(el.dataset.legs));
        const map = document.querySelector('.app.stacked .app-map.unpinned');
        if (map) map.scrollIntoView({ behavior: 'smooth' });
    }

    const hex4 = s => s.toString(16).toUpperCase().padStart(4, '0');
    const fmt = c => c === Infinity ? 'unreachable' : c.toFixed(3);

    function renderFastestResults(items) {
        const head = `<tr><th>#</th><th>Seed</th><th>Rank</th><th class="srch-left">Map</th><th class="srch-left">Boss</th><th>Floors</th><th>Ideal Walk</th><th class="srch-left">Per floor</th></tr>`;
        const rows = items.map((it, i) => {
            const per = it.per.map((c, f) => `B${f + 1}F ${c.toFixed(2)}`).join('  ');
            return `<tr class="srch-pick" data-i="${i}" data-seed="${hex4(it.seed)}" title="Show the route">` +
                   `<td>${i + 1}</td><td>${hex4(it.seed)}</td><td>${it.rStr}</td><td class="srch-left">${it.name}</td>` +
                   `<td class="srch-left">${it.boss}</td><td>${it.fc}</td><td><b>${fmt(it.cost)}</b></td><td class="srch-floors">${per}</td></tr>`;
        }).join("");
        document.getElementById("srchResults").innerHTML = items.length ? head + rows : "";
    }

    function renderItemResults(items) {
        const head = `<tr><th>#</th><th>Seed</th><th>Rank</th><th class="srch-left">Map</th><th>Floors</th><th>Ideal Walk</th><th class="srch-left">Hit</th></tr>`;
        let n = 0;
        const rows = items.map((it, i) => {
            if (it.header) return `<tr><td colspan="7" class="srch-left"><b>${it.header}</b></td></tr>`;
            const routes = it.astarText !== undefined ? ` (routes ${it.astarText})` : '';
            return `<tr class="srch-pick" data-i="${i}" data-seed="${hex4(it.seed)}" title="Show the route">` +
                   `<td>${++n}</td><td>${hex4(it.seed)}</td><td>${it.rStr}</td><td class="srch-left">${it.name}</td><td>${it.fc}</td>` +
                   `<td><b>${fmt(it.cost)}</b></td><td class="srch-floors">${it.hit}${routes}</td></tr>`;
        }).join("");
        document.getElementById("srchResults").innerHTML = items.length ? head + rows : "";
    }

    buildPanel();
})();

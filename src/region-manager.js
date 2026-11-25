// Nucleus End - region streaming: each region loads on approach, unloads when far
export function createRegionManager(scene, ctx) {
  const defs = [
    { id: 'south', path: './regions/south.js', shouldLoad: p => p.z > -20, shouldUnload: p => p.z < -170 },
    { id: 'steppe', path: './regions/steppe.js', shouldLoad: p => p.z < 195 && p.z > -335, shouldUnload: p => p.z > 305 || p.z < -435 },
    { id: 'north', path: './regions/north.js', shouldLoad: p => p.z < -110, shouldUnload: p => p.z > 35 }
  ];
  const states = defs.map(d => ({ def: d, status: 'unloaded', mod: null }));
  let loading = 0;
  function setLoading(n) { loading = n; if (ctx.onLoading) ctx.onLoading(loading); }
  async function load(st) {
    st.status = 'loading'; setLoading(loading + 1);
    try {
      const m = await import(st.def.path);
      st.mod = await m.build(scene, ctx);
      st.status = 'loaded';
    } catch (err) {
      console.error('[region] load failed:', st.def.id, err);
      st.status = 'unloaded';
    }
    setLoading(loading - 1);
  }
  function unload(st) {
    if (st.mod) {
      try { if (st.mod.dispose) st.mod.dispose(); } catch (e) {}
      if (st.mod.group) scene.remove(st.mod.group);
    }
    st.mod = null; st.status = 'unloaded';
  }
  return {
    update(playerPos, dt) {
      for (const st of states) {
        if (st.status === 'unloaded' && st.def.shouldLoad(playerPos)) load(st);
        else if (st.status === 'loaded' && st.def.shouldUnload(playerPos)) unload(st);
        else if (st.status === 'loaded' && st.mod && st.mod.update) st.mod.update(dt, ctx);
      }
    },
    loadedIds() { return states.filter(s => s.status === 'loaded').map(s => s.def.id); },
    statusOf(id) { const s = states.find(x => x.def.id === id); return s ? s.status : 'unknown'; }
  };
}

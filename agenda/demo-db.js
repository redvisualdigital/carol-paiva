/* Agenda da Carol Paiva (sem nuvem por enquanto): faz o papel do Firebase, mas guarda tudo no próprio aparelho (localStorage).
   Na primeira abertura entra com os serviços de exemplo e alguns horários de exemplo.
   Na versão oficial, este arquivo sai e entra o Firebase (login + banco na nuvem), igual ao da Essence Glam. */
(function(){
  const KEY = "carolpaiva.agenda.v1";
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  const dia = n => { const d = new Date(); d.setDate(d.getDate()+n); return ymd(d); };

  const CUID = "• Nas primeiras 24h, não molhe os cílios.\n• Não use rímel nem demaquilante oleoso.\n• Penteie com a escovinha todo dia.\n• Durma de barriga pra cima sempre que puder.";
  const sv = (id, nome, preco, duracao, retornoDias) => ({id, nome, profId: "carol", preco, duracao, retornoDias, cuidados: CUID});
  function seed(){
    const cfg = {
      estudio: "Carol Paiva · Lash Designer",
      profissionais: [{id: "carol", nome: "Carol Paiva", area: "Cílios e sobrancelhas", cor: "#8A715E"}],
      servicos: [
        sv("s-vb", "Volume brasileiro", 150, 120, 20),
        sv("s-vi", "Volume inglês", 180, 150, 20),
        sv("s-fox", "Fox Eyes", 190, 150, 20),
        sv("s-man", "Manutenção de cílios", 95, 90, 20),
        sv("s-ds", "Design de sobrancelhas", 40, 40, 20),
        sv("s-bl", "Brow Lamination", 120, 60, 45)
      ],
      reservaPct: 0, reservaHora: "23:59",
      semProxima: "^$nenhum", proxDe: 7, proxAte: 15,
      domicilioServicos: "^$sem-domiciliar",
      taxas: {"Cartão de débito": {pct: 0, proxDiaUtil: false}, "Cartão de crédito": {pct: 0, proxDiaUtil: false}, "Link de pagamento (crédito)": {pct: 0, proxDiaUtil: false}}
    };
    return { config: {geral: cfg}, clientes: {}, agendamentos: {}, caixa: {}, acompanhamentos: {}, reservas: {}, pedidos: {} };
  }
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY)); } catch(e){}
  if (!store || !store.config) store = seed();
  ["config","clientes","agendamentos","caixa","acompanhamentos","reservas","pedidos"].forEach(c => store[c] = store[c] || {});
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch(e){} };
  save();

  const subs = []; let n = 0;
  const notify = () => { save(); setTimeout(() => subs.forEach(f => f()), 0); };
  const clone = d => JSON.parse(JSON.stringify(d === undefined ? null : d));
  const novoId = () => Date.now().toString(36) + (++n).toString(36) + Math.random().toString(36).slice(2, 6);
  function docRef(c, id){ return { id,
    set: async d => { store[c][id] = clone(d); notify(); },
    update: async d => { store[c][id] = {...store[c][id], ...clone(d)}; notify(); },
    delete: async () => { delete store[c][id]; notify(); },
    get: async () => ({exists: !!store[c][id], data: () => store[c][id]}),
    onSnapshot: cb => { const f = () => cb({exists: !!store[c][id], data: () => store[c][id]}); subs.push(f); f(); return () => {}; } }; }
  function q(c, filt){ return {
    doc: id => docRef(c, id || novoId()), orderBy: () => q(c, filt), limit: () => q(c, filt),
    where: (k, op, v) => q(c, d => d[k] === v),
    get: async () => ({docs: Object.entries(store[c]).map(([i, d]) => ({id: i, data: () => d}))}),
    onSnapshot: cb => { const f = () => cb({docs: Object.entries(store[c]).filter(([i, d]) => !filt || filt(d)).map(([i, d]) => ({id: i, data: () => d}))}); subs.push(f); f(); return () => {}; } }; }
  const db = { collection: c => q(c), doc: p => { const [c, i] = p.split("/"); return docRef(c, i); }, settings(){}, enablePersistence: async () => {},
    batch(){ const ops = []; return {set: (r, d) => ops.push(() => r.set(d)), commit: async () => { for (const o of ops) await o(); }}; } };
  const auth = { setPersistence: async () => {}, onAuthStateChanged: cb => setTimeout(() => cb({email: "demonstração"}), 0), signOut: async () => {},
    signInWithEmailAndPassword: async () => {}, sendPasswordResetEmail: async () => {} };
  window.firebase = { initializeApp(){}, auth: Object.assign(() => auth, {Auth: {Persistence: {LOCAL: 1}}}), firestore: () => db };
  window.__DEMO = true;
  window.__demoReset = () => { try { localStorage.removeItem(KEY); } catch(e){} location.reload(); };
})();

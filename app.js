(function () {
  "use strict";

  // Códigos oficiais do TSE para as Eleições 2026 (fonte: /oficial/comum/config/ele-c.json).
  // 1º turno: Federal 6257 (Presidente) e Estadual 6259 (Governador/Senador).
  // 2º turno (25/10/2026): trocar para 6258 e 6260.
  var BASE = "https://resultados.tse.jus.br/oficial";
  var CICLO = "ele2026";
  var CARGOS = {
    presidente: { eleicao: "6257", cargo: "0001", nome: "Presidente", abrangencias: ["br"].concat(ufs(), ["zz"]) },
    governador: { eleicao: "6259", cargo: "0003", nome: "Governador", abrangencias: ufs() },
    senador: { eleicao: "6259", cargo: "0005", nome: "Senador", abrangencias: ufs() }
  };
  var INTERVALO_MS = 30000;

  var NOMES_UF = {
    br: "Brasil", zz: "Exterior",
    ac: "Acre", al: "Alagoas", ap: "Amapá", am: "Amazonas", ba: "Bahia", ce: "Ceará",
    df: "Distrito Federal", es: "Espírito Santo", go: "Goiás", ma: "Maranhão",
    mt: "Mato Grosso", ms: "Mato Grosso do Sul", mg: "Minas Gerais", pa: "Pará",
    pb: "Paraíba", pr: "Paraná", pe: "Pernambuco", pi: "Piauí", rj: "Rio de Janeiro",
    rn: "Rio Grande do Norte", rs: "Rio Grande do Sul", ro: "Rondônia", rr: "Roraima",
    sc: "Santa Catarina", sp: "São Paulo", se: "Sergipe", to: "Tocantins"
  };

  function ufs() {
    return ["ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms", "mg", "pa",
      "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc", "sp", "se", "to"];
  }

  var $ = function (id) { return document.getElementById(id); };
  var estado = { cargo: "presidente", uf: "br", timer: null, contador: null, proxima: 0, req: 0 };

  // ---------- utilitários ----------

  // O TSE envia números como texto, com vírgula decimal ("48,43").
  function num(v) {
    if (v === undefined || v === null || v === "") return NaN;
    return parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  }
  var fmtInt = new Intl.NumberFormat("pt-BR");
  var fmtPct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function inteiro(v) { var n = num(v); return isNaN(n) ? "–" : fmtInt.format(n); }
  function pct(v) { var n = num(v); return isNaN(n) ? "–" : fmtPct.format(n) + "%"; }

  function el(tag, attrs, filhos) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) { if (f) e.appendChild(f); });
    return e;
  }

  function url(cfg, uf) {
    return BASE + "/" + CICLO + "/" + cfg.eleicao + "/dados-simplificados/" + uf + "/" +
      uf + "-c" + cfg.cargo + "-e" + cfg.eleicao.padStart(6, "0") + "-r.json";
  }

  function urlFoto(cfg, uf, sqcand) {
    return BASE + "/" + CICLO + "/" + cfg.eleicao + "/fotos/" + uf + "/" + sqcand + ".jpeg";
  }

  // ---------- estado / rota ----------

  function lerRota() {
    var partes = location.hash.replace(/^#\/?/, "").split("/");
    var cargo = CARGOS[partes[0]] ? partes[0] : "presidente";
    var uf = (partes[1] || "").toLowerCase();
    if (CARGOS[cargo].abrangencias.indexOf(uf) === -1) uf = CARGOS[cargo].abrangencias[0];
    estado.cargo = cargo;
    estado.uf = uf;
  }

  function gravarRota() {
    var h = "#" + estado.cargo + "/" + estado.uf;
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  function montarControles() {
    document.querySelectorAll(".cargos button").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.dataset.cargo === estado.cargo));
    });
    var sel = $("uf");
    sel.textContent = "";
    CARGOS[estado.cargo].abrangencias.forEach(function (uf) {
      var o = el("option", { value: uf, text: NOMES_UF[uf] + (uf === "br" || uf === "zz" ? "" : " (" + uf.toUpperCase() + ")") });
      if (uf === estado.uf) o.selected = true;
      sel.appendChild(o);
    });
  }

  // ---------- busca ----------

  function carregar() {
    var cfg = CARGOS[estado.cargo];
    var uf = estado.uf;
    var id = ++estado.req;
    agendar();
    fetch(url(cfg, uf))
      .then(function (r) {
        if (r.status === 404 || r.status === 403) return null;
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (dados) {
        if (id !== estado.req) return; // usuário trocou de cargo/UF no meio da requisição
        if (!dados || !Array.isArray(dados.cand)) return semDados();
        render(cfg, uf, dados);
      })
      .catch(function (err) {
        if (id !== estado.req) return;
        erro(err);
      });
  }

  function agendar() {
    clearTimeout(estado.timer);
    estado.proxima = Date.now() + INTERVALO_MS;
    estado.timer = setTimeout(carregar, INTERVALO_MS);
    tick();
  }

  function tick() {
    var s = Math.max(0, Math.round((estado.proxima - Date.now()) / 1000));
    $("relogio").textContent = "Próxima atualização em " + s + "s";
  }

  // ---------- renderização ----------

  function aviso(linhas) {
    var a = $("aviso");
    a.textContent = "";
    linhas.forEach(function (t) { a.appendChild(el("p", { text: t })); });
    a.hidden = false;
  }

  function semDados() {
    $("resumo").hidden = true;
    $("candidatos").textContent = "";
    aviso([
      "Os resultados de " + CARGOS[estado.cargo].nome + " – " + NOMES_UF[estado.uf] + " ainda não foram divulgados pelo TSE.",
      "A votação termina às 17h (horário de Brasília) e a divulgação começa logo depois. Esta página tenta de novo automaticamente."
    ]);
  }

  function erro(err) {
    // Mantém o último resultado na tela e só avisa da falha.
    aviso(["Não foi possível falar com o servidor do TSE agora (" + (err && err.message || "erro de rede") + "). Tentaremos de novo em instantes."]);
  }

  function render(cfg, uf, d) {
    $("aviso").hidden = true;
    $("resumo").hidden = false;

    var pst = num(d.pst);
    $("pst").textContent = pct(d.pst);
    $("pst-barra").style.width = (isNaN(pst) ? 0 : Math.min(100, pst)) + "%";

    var status = $("status");
    var final = d.tf === "s" || d.tf === "S";
    var definido = /^[se]$/i.test(d.md || "");
    status.textContent = final ? "Totalização final" : definido ? "Matematicamente definido" : "";
    status.className = "selo" + (final || definido ? " final" : "");

    var quando = [d.dt || d.dg, d.ht || d.hg].filter(Boolean).join(" às ");
    $("atualizado").textContent = (quando ? "Dados do TSE de " + quando + " · " : "") +
      inteiro(d.st) + " de " + inteiro(d.s) + " seções";

    $("n-e").textContent = inteiro(d.e);
    setNumero("n-c", d.c, d.pc);
    setNumero("n-a", d.a, d.pa);
    setNumero("n-vv", d.vv, d.pvv);
    setNumero("n-vb", d.vb, d.pvb);
    setNumero("n-vn", d.tvn !== undefined ? d.tvn : d.vn, d.ptvn !== undefined ? d.ptvn : d.pvn);

    var lista = d.cand.slice().sort(function (a, b) {
      return (num(b.vap) || 0) - (num(a.vap) || 0) || (num(a.seq) || 0) - (num(b.seq) || 0);
    });
    var maior = Math.max.apply(null, lista.map(function (c) { return num(c.pvap) || 0; }).concat([1]));

    var ol = $("candidatos");
    ol.textContent = "";
    lista.forEach(function (c) { ol.appendChild(itemCandidato(cfg, uf, c, maior)); });
  }

  function setNumero(id, abs, rel) {
    var dd = $(id);
    dd.textContent = inteiro(abs) + " ";
    if (rel !== undefined) dd.appendChild(el("small", { text: pct(rel) }));
  }

  function itemCandidato(cfg, uf, c, maior) {
    var situacao = (c.st || "").toLowerCase();
    var eleito = c.e === "s" || c.e === "S" || situacao === "eleito";
    var segundo = situacao.indexOf("2º turno") !== -1 || situacao.indexOf("2o turno") !== -1;
    var nome = c.nm || c.nmu || ("Candidato " + c.n);
    var invalido = c.dvt && !/^v[aá]lido/i.test(c.dvt);

    var foto = el("div", { class: "foto", "aria-hidden": "true" });
    foto.textContent = nome.trim().charAt(0);
    if (c.sqcand) {
      var img = new Image();
      img.alt = "";
      img.loading = "lazy";
      img.onload = function () { foto.textContent = ""; foto.appendChild(img); };
      img.src = urlFoto(cfg, uf === "zz" ? "br" : uf, c.sqcand);
    }

    var titulo = el("strong", { text: nome + " (" + c.n + ")" });
    if (eleito) titulo.appendChild(el("span", { class: "tag eleito", text: "Eleito" }));
    else if (segundo) titulo.appendChild(el("span", { class: "tag turno2", text: "2º turno" }));

    var detalhe = c.cc || c.sgp || "";
    if (invalido) detalhe = (detalhe ? detalhe + " · " : "") + "Votos " + c.dvt.toLowerCase();

    var largura = Math.max(0, Math.min(100, (num(c.pvap) || 0) / maior * 100));
    var barra = el("div", { class: "barra" }, [el("div")]);
    barra.firstChild.style.width = largura + "%";

    return el("li", { class: eleito ? "eleito" : segundo ? "turno2" : "" }, [
      foto,
      el("div", { class: "nome" }, [titulo, detalhe ? el("small", { text: detalhe }) : null]),
      el("div", { class: "pct" }, [el("strong", { text: pct(c.pvap) }), el("small", { text: inteiro(c.vap) + " votos" })]),
      barra
    ]);
  }

  // ---------- eventos ----------

  function trocar() {
    gravarRota();
    montarControles();
    $("resumo").hidden = true;
    $("aviso").hidden = true;
    $("candidatos").textContent = "";
    carregar();
  }

  document.querySelectorAll(".cargos button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.cargo === estado.cargo) return;
      estado.cargo = b.dataset.cargo;
      if (CARGOS[estado.cargo].abrangencias.indexOf(estado.uf) === -1) {
        estado.uf = CARGOS[estado.cargo].abrangencias[0];
      }
      trocar();
    });
  });
  $("uf").addEventListener("change", function (e) { estado.uf = e.target.value; trocar(); });
  $("atualizar").addEventListener("click", carregar);
  window.addEventListener("hashchange", function () { lerRota(); trocar(); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && Date.now() > estado.proxima) carregar();
  });

  lerRota();
  gravarRota();
  montarControles();
  carregar();
  estado.contador = setInterval(tick, 1000);
})();

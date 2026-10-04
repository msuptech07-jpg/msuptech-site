(function () {
  "use strict";

  // Códigos oficiais do TSE para as Eleições 2026 (fonte: /oficial/comum/config/ele-c.json).
  // 1º turno: Federal 6257 (Presidente) e Estadual 6259 (Governador/Senador).
  // 2º turno (25/10/2026): trocar para 6258 e 6260.
  var BASE = "https://resultados.tse.jus.br/oficial";
  var CICLO = "ele2026";
  var UFS = ["ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms", "mg", "pa",
    "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc", "sp", "se", "to"];
  var CARGOS = {
    presidente: { eleicao: "6257", cargo: "0001", nome: "Presidente", abrangencias: ["br"].concat(UFS, ["zz"]) },
    governador: { eleicao: "6259", cargo: "0003", nome: "Governador", abrangencias: UFS },
    senador: { eleicao: "6259", cargo: "0005", nome: "Senador", abrangencias: UFS, vagas: 2 }
  };
  var INTERVALO_MS = 15000;
  var INTERVALO_PANORAMA_MS = 30000;
  var SIMULTANEAS = 6; // requisições paralelas no Panorama, para não sobrecarregar o TSE

  var NOMES_UF = {
    br: "Brasil", zz: "Exterior",
    ac: "Acre", al: "Alagoas", ap: "Amapá", am: "Amazonas", ba: "Bahia", ce: "Ceará",
    df: "Distrito Federal", es: "Espírito Santo", go: "Goiás", ma: "Maranhão",
    mt: "Mato Grosso", ms: "Mato Grosso do Sul", mg: "Minas Gerais", pa: "Pará",
    pb: "Paraíba", pr: "Paraná", pe: "Pernambuco", pi: "Piauí", rj: "Rio de Janeiro",
    rn: "Rio Grande do Norte", rs: "Rio Grande do Sul", ro: "Rondônia", rr: "Roraima",
    sc: "Santa Catarina", sp: "São Paulo", se: "Sergipe", to: "Tocantins"
  };

  var PESQUISAS = window.PESQUISAS || {};
  var $ = function (id) { return document.getElementById(id); };
  var estado = { view: "presidente", uf: "br", timer: null, proxima: 0, req: 0 };

  // ---------- utilitários ----------

  // O TSE envia números como texto, com vírgula decimal ("48,43").
  function num(v) {
    if (v === undefined || v === null || v === "") return NaN;
    if (typeof v === "number") return v;
    return parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  }
  var fmtInt = new Intl.NumberFormat("pt-BR");
  var fmtPct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtPct1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  function inteiro(v) { var n = num(v); return isNaN(n) ? "–" : fmtInt.format(n); }
  function pct(v) { var n = num(v); return isNaN(n) ? "–" : fmtPct.format(n) + "%"; }
  function pct1(v) { return v === null || v === undefined || isNaN(v) ? "–" : fmtPct1.format(v) + "%"; }

  function el(tag, attrs, filhos) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) {
      if (f === null || f === undefined || f === false) return;
      e.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return e;
  }

  function semAcento(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  }

  // Em 2026 o TSE publica o resultado completo em dados/<uf>/<uf>-cCCCC-eEEEEEE-u.json.
  // O formato "dados-simplificados" (-r.json) de 2022/2024 fica como alternativa.
  function url(cfg, uf, tipo) {
    var arq = uf + "-c" + cfg.cargo + "-e" + cfg.eleicao.padStart(6, "0");
    return BASE + "/" + CICLO + "/" + cfg.eleicao +
      (tipo === "r" ? "/dados-simplificados/" + uf + "/" + arq + "-r.json" : "/dados/" + uf + "/" + arq + "-u.json");
  }

  function urlFoto(cfg, uf, sqcand) {
    return BASE + "/" + CICLO + "/" + cfg.eleicao + "/fotos/" + uf + "/" + sqcand + ".jpeg";
  }

  // Converte o arquivo completo de 2026 (seções em "s", eleitorado em "e", votos em "v",
  // candidatos dentro de carg > agr > par) para o mesmo formato plano usado no resto da página.
  function normalizar(d) {
    if (!d) return null;
    if (Array.isArray(d.cand)) return d;
    if (!Array.isArray(d.carg) || !d.carg[0]) return null;
    var s = d.s || {}, e = d.e || {}, v = d.v || {};
    var cand = [];
    (d.carg[0].agr || []).forEach(function (a) {
      (a.par || []).forEach(function (p) {
        (p.cand || []).forEach(function (c) {
          var x = Object.assign({}, c);
          x.nm = c.nmu || c.nm;      // nome de urna
          x.nmc = c.nm;              // nome completo
          x.cc = p.sg + (a.tp === "c" && a.nm ? " · " + a.nm : "");
          cand.push(x);
        });
      });
    });
    return {
      dg: d.dg, hg: d.hg, dt: d.dt, ht: d.ht, tf: d.tf, md: d.md,
      s: s.ts, st: s.st, pst: s.pst,
      e: e.te, c: e.c, pc: e.pc, a: e.a, pa: e.pa,
      // "pvv" do TSE é válidos sobre válidos (100%). Recalcula sobre o total de votos (válidos +
      // brancos + nulos), a mesma base de pvb e ptvn; no Senado cada eleitor dá 2 votos.
      vv: v.vv, pvv: totalVotos(v) > 0 ? String(num(v.vv) / totalVotos(v) * 100).replace(".", ",") : v.pvv,
      vb: v.vb, pvb: v.pvb, tvn: v.tvn, ptvn: v.ptvn,
      cand: cand
    };
  }

  function totalVotos(v) {
    return (num(v.vv) || 0) + (num(v.vb) || 0) + (num(v.tvn) || 0);
  }

  // Resolve com os dados, ou null se o TSE ainda não publicou o arquivo.
  // "no-cache" faz o navegador revalidar no servidor em vez de reaproveitar a cópia local.
  function baixar(endereco) {
    return fetch(endereco, { cache: "no-cache" }).then(function (r) {
      if (r.status === 404 || r.status === 403) return null;
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function buscar(cfg, uf) {
    return baixar(url(cfg, uf, "u")).then(function (d) {
      return d ? d : baixar(url(cfg, uf, "r"));
    }).then(normalizar);
  }

  // ---------- leitura do resultado ----------

  function nomeDe(c) { return c.nm || c.nmu || ("Candidato " + c.n); }
  function ehValido(c) { return !c.dvt || /^v[aá]lido/i.test(c.dvt); }
  function situacaoDe(c) { return semAcento(c.st).trim(); }
  function ehEleito(c) {
    var s = situacaoDe(c);
    return c.e === "s" || c.e === "S" || s === "ELEITO" || s.indexOf("ELEITO POR") === 0;
  }
  function ehSegundoTurno(c) {
    var s = situacaoDe(c);
    return s.indexOf("2º TURNO") !== -1 || s.indexOf("2O TURNO") !== -1 || s.indexOf("SEGUNDO TURNO") !== -1;
  }
  function porVotos(a, b) {
    return (num(b.vap) || 0) - (num(a.vap) || 0) || (num(a.seq) || 0) - (num(b.seq) || 0);
  }

  // Diz, de forma direta, quem está ganhando e o que acontece se a apuração terminar agora.
  function analisar(cfg, d) {
    var lista = d.cand.slice().sort(porVotos);
    var validos = lista.filter(ehValido);
    var eleitos = validos.filter(ehEleito);
    var turno2 = validos.filter(ehSegundoTurno);
    var votos = validos.reduce(function (s, c) { return s + (num(c.vap) || 0); }, 0);
    var r = { lista: lista, validos: validos, pst: num(d.pst), oficial: false, tipo: "parcial", titulo: "", texto: "", destaque: [] };
    var a = validos[0], b = validos[1], c = validos[2];
    var vagas = cfg.vagas || 1;

    function rotulo(x) { return nomeDe(x) + " (" + pct(x.pvap) + ")"; }
    function difVotos(x, y) { return fmtInt.format(Math.abs((num(x.vap) || 0) - (num(y.vap) || 0))); }

    if (eleitos.length) {
      r.oficial = true; r.tipo = "eleito"; r.destaque = eleitos;
      r.titulo = (eleitos.length > 1 ? "Eleitos: " : "Eleito: ") + eleitos.map(nomeDe).join(" e ");
      r.texto = "Resultado definido pelo TSE com " + pct(d.pst) + " das seções totalizadas.";
    } else if (turno2.length >= 2) {
      r.oficial = true; r.tipo = "turno2"; r.destaque = turno2.slice(0, 2);
      r.titulo = "2º turno: " + nomeDe(turno2[0]) + " x " + nomeDe(turno2[1]);
      r.texto = "Definido pelo TSE. A nova votação será em 25 de outubro de 2026.";
    } else if (!a || votos === 0) {
      r.tipo = "aguardando";
      r.titulo = "Aguardando os primeiros números";
      r.texto = "O TSE já publicou o arquivo, mas ainda não há votos totalizados.";
    } else if (vagas > 1) {
      var frente = validos.slice(0, vagas);
      r.destaque = frente;
      r.titulo = "Na frente: " + frente.map(nomeDe).join(" e ");
      r.texto = "Se a apuração terminasse agora, seriam eleitos " + frente.map(rotulo).join(" e ") + ".";
      var proximo = validos[vagas];
      if (proximo) r.texto += " " + nomeDe(proximo) + " está " + difVotos(frente[vagas - 1], proximo) + " votos atrás da última vaga.";
    } else if (num(a.pvap) > 50) {
      r.destaque = [a];
      r.titulo = nomeDe(a) + " lidera com " + pct(a.pvap) + " dos votos válidos";
      r.texto = "Se a apuração terminasse agora, " + nomeDe(a) + " venceria no 1º turno (é preciso mais de 50% dos votos válidos).";
      if (b) r.texto += " Vantagem sobre " + nomeDe(b) + ": " + difVotos(a, b) + " votos.";
    } else {
      r.destaque = b ? [a, b] : [a];
      r.titulo = nomeDe(a) + " lidera com " + pct(a.pvap) + " dos votos válidos";
      r.texto = "Ninguém passa de 50% dos votos válidos. Se a apuração terminasse agora, haveria 2º turno entre " +
        rotulo(a) + (b ? " e " + rotulo(b) : "") + ".";
      if (b) r.texto += " Diferença entre os dois: " + difVotos(a, b) + " votos.";
      if (b && c) r.texto += " " + nomeDe(c) + " está " + difVotos(b, c) + " votos atrás da vaga no 2º turno.";
    }
    return r;
  }

  // ---------- rota ----------

  function lerRota() {
    var partes = location.hash.replace(/^#\/?/, "").split("/");
    var view = partes[0] === "panorama" || CARGOS[partes[0]] ? partes[0] : "presidente";
    estado.view = view;
    if (view === "panorama") return;
    var uf = (partes[1] || "").toLowerCase();
    if (CARGOS[view].abrangencias.indexOf(uf) === -1) {
      uf = CARGOS[view].abrangencias.indexOf(estado.uf) !== -1 ? estado.uf : CARGOS[view].abrangencias[0];
    }
    estado.uf = uf;
  }

  function gravarRota() {
    var h = estado.view === "panorama" ? "#panorama" : "#" + estado.view + "/" + estado.uf;
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  function montarControles() {
    document.querySelectorAll(".cargos button").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.dataset.cargo === estado.view));
    });
    var panorama = estado.view === "panorama";
    $("panorama").hidden = !panorama;
    $("disputa").hidden = panorama;
    $("uf").hidden = panorama;
    $("uf-label").hidden = panorama;
    if (panorama) return;
    var sel = $("uf");
    sel.textContent = "";
    CARGOS[estado.view].abrangencias.forEach(function (uf) {
      var o = el("option", { value: uf, text: NOMES_UF[uf] + (uf === "br" || uf === "zz" ? "" : " (" + uf.toUpperCase() + ")") });
      if (uf === estado.uf) o.selected = true;
      sel.appendChild(o);
    });
  }

  // ---------- ciclo de atualização ----------

  function carregar() {
    var id = ++estado.req;
    agendar();
    if (estado.view === "panorama") return carregarPanorama(id);
    var cfg = CARGOS[estado.view];
    var uf = estado.uf;
    buscar(cfg, uf)
      .then(function (d) {
        if (id !== estado.req) return; // trocou de cargo/UF no meio da requisição
        if (!d) return semDados(cfg, uf);
        $("aviso").hidden = true;
        renderDisputa(cfg, uf, d);
      })
      .catch(function (err) {
        if (id !== estado.req) return;
        erro(err);
      });
  }

  function agendar() {
    clearTimeout(estado.timer);
    var intervalo = estado.view === "panorama" ? INTERVALO_PANORAMA_MS : INTERVALO_MS;
    estado.proxima = Date.now() + intervalo;
    estado.timer = setTimeout(carregar, intervalo);
    tick();
  }

  function tick() {
    var s = Math.max(0, Math.round((estado.proxima - Date.now()) / 1000));
    var intervalo = (estado.view === "panorama" ? INTERVALO_PANORAMA_MS : INTERVALO_MS) / 1000;
    $("relogio").textContent = "Atualiza a cada " + intervalo + "s · próxima em " + s + "s";
  }

  function aviso(linhas) {
    var a = $("aviso");
    a.textContent = "";
    linhas.forEach(function (t) { a.appendChild(el("p", { text: t })); });
    a.hidden = false;
  }

  function semDados(cfg, uf) {
    $("destaque").hidden = true;
    $("resumo").hidden = true;
    $("candidatos").textContent = "";
    aviso([
      "O TSE ainda não publicou os resultados de " + cfg.nome + " – " + NOMES_UF[uf] + ".",
      "A votação terminou às 17h (horário de Brasília) e a divulgação começa em seguida. Esta página tenta de novo sozinha."
    ]);
    renderPesquisas(cfg, uf, null);
  }

  function erro(err) {
    // Mantém o último resultado na tela e só avisa da falha.
    aviso(["Não foi possível falar com o servidor do TSE agora (" + (err && err.message || "erro de rede") + "). Tentando de novo em instantes."]);
  }

  // ---------- disputa (um cargo, uma UF) ----------

  function renderDisputa(cfg, uf, d) {
    var an = analisar(cfg, d);
    renderDestaque($("destaque"), cfg, uf, d, an);
    renderResumo(d);

    var maior = Math.max.apply(null, an.lista.map(function (c) { return num(c.pvap) || 0; }).concat([1]));
    var ol = $("candidatos");
    ol.textContent = "";
    an.lista.forEach(function (c, i) { ol.appendChild(itemCandidato(cfg, uf, c, maior, an, i)); });

    renderPesquisas(cfg, uf, d);
  }

  function renderDestaque(box, cfg, uf, d, an) {
    box.textContent = "";
    box.hidden = false;
    box.className = "destaque " + an.tipo + (box.id === "pan-presidente" ? " destaque-compacto" : "");
    var selo = an.oficial
      ? el("span", { class: "selo-fonte oficial", text: "Oficial TSE" })
      : el("span", { class: "selo-fonte", text: an.tipo === "aguardando" ? "Aguardando" : "Parcial · " + pct(d.pst) + " apurado" });
    box.appendChild(el("div", { class: "destaque-topo" }, [
      el("span", { class: "rotulo", text: cfg.nome + " · " + NOMES_UF[uf] }), selo
    ]));
    box.appendChild(el("p", { class: "manchete", text: an.titulo }));
    box.appendChild(el("p", { class: "explica", text: an.texto }));
  }

  function renderResumo(d) {
    $("resumo").hidden = false;
    var pst = num(d.pst);
    $("pst").textContent = pct(d.pst);
    $("pst-barra").style.width = (isNaN(pst) ? 0 : Math.min(100, pst)) + "%";

    var status = $("status");
    var final = /^s$/i.test(d.tf || "");
    var definido = /^[se]$/i.test(d.md || "");
    status.textContent = final ? "Totalização final" : definido ? "Matematicamente definido" : "";
    status.className = "selo" + (final || definido ? " final" : "");

    var quando = [d.dt || d.dg, d.ht || d.hg].filter(Boolean).join(" às ");
    $("atualizado").textContent = (quando ? "Arquivo do TSE de " + quando + " (horário de Brasília) · " : "") +
      inteiro(d.st) + " de " + inteiro(d.s) + " seções";

    $("n-e").textContent = inteiro(d.e);
    setNumero("n-c", d.c, d.pc);
    setNumero("n-a", d.a, d.pa);
    setNumero("n-vv", d.vv, d.pvv);
    setNumero("n-vb", d.vb, d.pvb);
    setNumero("n-vn", d.tvn !== undefined ? d.tvn : d.vn, d.ptvn !== undefined ? d.ptvn : d.pvn);
  }

  function setNumero(id, abs, rel) {
    var dd = $(id);
    dd.textContent = inteiro(abs) + " ";
    if (rel !== undefined) dd.appendChild(el("small", { text: pct(rel) }));
  }

  function itemCandidato(cfg, uf, c, maior, an, pos) {
    var eleito = ehEleito(c);
    var segundo = ehSegundoTurno(c);
    var naFrente = !an.oficial && an.tipo === "parcial" && an.destaque.indexOf(c) !== -1;
    var nome = nomeDe(c);

    var foto = el("div", { class: "foto", "aria-hidden": "true" });
    foto.textContent = nome.trim().charAt(0);
    if (c.sqcand) {
      var img = new Image();
      img.alt = "";
      img.onload = function () { foto.textContent = ""; foto.appendChild(img); };
      img.src = urlFoto(cfg, uf === "zz" ? "br" : uf, c.sqcand);
    }

    var titulo = el("strong", null, [(pos + 1) + "º · " + nome + " (" + c.n + ")"]);
    if (eleito) titulo.appendChild(el("span", { class: "tag eleito", text: "Eleito" }));
    else if (segundo) titulo.appendChild(el("span", { class: "tag turno2", text: "2º turno" }));
    else if (naFrente) titulo.appendChild(el("span", { class: "tag frente", text: cfg.vagas ? "Dentro das vagas" : an.destaque.length > 1 ? "Iria ao 2º turno" : "Venceria agora" }));

    var detalhe = c.cc || c.sgp || "";
    if (!ehValido(c)) detalhe = (detalhe ? detalhe + " · " : "") + "Votos " + String(c.dvt).toLowerCase();

    var largura = Math.max(0, Math.min(100, (num(c.pvap) || 0) / maior * 100));
    var barra = el("div", { class: "barra" }, [el("div")]);
    barra.firstChild.style.width = largura + "%";

    return el("li", { class: eleito ? "eleito" : segundo ? "turno2" : naFrente ? "frente" : "" }, [
      foto,
      el("div", { class: "nome" }, [titulo, detalhe ? el("small", { text: detalhe }) : null]),
      el("div", { class: "pct" }, [el("strong", { text: pct(c.pvap) }), el("small", { text: inteiro(c.vap) + " votos" })]),
      barra
    ]);
  }

  // ---------- pesquisas x apuração ----------

  // Procura primeiro pelo nome de urna; só se não achar, tenta o nome completo.
  function casar(candPesquisa, lista) {
    if (!lista) return null;
    function bate(texto) {
      var palavras = semAcento(texto).split(/[^A-Z0-9]+/);
      return candPesquisa.chaves.some(function (chave) {
        return chave.every(function (p) { return palavras.indexOf(p) !== -1; });
      });
    }
    for (var i = 0; i < lista.length; i++) if (bate(nomeDe(lista[i]))) return lista[i];
    for (var k = 0; k < lista.length; k++) if (lista[k].nmc && bate(lista[k].nmc)) return lista[k];
    return null;
  }


  function media(cand, institutos) {
    var vals = institutos.map(function (i) { return cand.v[i.id]; }).filter(function (v) { return typeof v === "number"; });
    if (!vals.length) return null;
    return vals.reduce(function (s, v) { return s + v; }, 0) / vals.length;
  }

  function renderPesquisas(cfg, uf, d) {
    var box = $("pesquisas");
    var p = PESQUISAS[estado.view + "/" + uf];
    box.textContent = "";
    if (!p) { box.hidden = true; return; }
    box.hidden = false;

    var varios = p.institutos.length > 1;
    box.appendChild(el("h2", { text: "Pesquisas de véspera x apuração" }));
    box.appendChild(el("p", { class: "mudo", text: "Intenção de voto em % dos votos válidos no 1º turno, divulgada em 3/10/2026. " +
      (varios ? "A média é simples, sem pesos, calculada por esta página. " : "") +
      "A coluna Apuração é o resultado do TSE agora." + (p.nota ? " " + p.nota : "") }));

    var thead = el("tr", null, [el("th", { text: "Candidato" }), el("th", { class: "num destaque-col", text: "Apuração" })]
      .concat(varios ? [el("th", { class: "num", text: "Média" })] : [])
      .concat(p.institutos.map(function (i) { return el("th", { class: "num", text: i.nome }); })));
    var tbody = el("tbody");
    p.candidatos.forEach(function (c) {
      var real = d ? casar(c, d.cand) : null;
      var m = media(c, p.institutos);
      var tr = el("tr", null, [
        el("td", null, [c.nome + " ", el("small", { text: c.partido })]),
        el("td", { class: "num destaque-col", text: real ? pct(real.pvap) : "–" })
      ].concat(varios ? [el("td", { class: "num", text: pct1(m) })] : [])
        .concat(p.institutos.map(function (i) { return el("td", { class: "num", text: pct1(c.v[i.id]) }); })));
      tbody.appendChild(tr);
    });
    box.appendChild(el("div", { class: "tabela-rolagem" }, [el("table", { class: "tabela" }, [el("thead", null, [thead]), tbody])]));

    if (p.segundoTurno) {
      var st = p.segundoTurno;
      box.appendChild(el("h3", { text: st.titulo }));
      box.appendChild(el("ul", { class: "lista" }, st.linhas.map(function (l) {
        return el("li", null, [el("strong", { text: l.instituto + ": " }), l.texto + " ", el("small", { text: "(" + l.base + ")" })]);
      })));
      if (st.nota) box.appendChild(el("p", { class: "mudo", text: st.nota }));
    }

    box.appendChild(el("h3", { text: "Ficha das pesquisas" }));
    box.appendChild(el("ul", { class: "lista fichas" }, p.institutos.map(function (i) {
      var fontes = el("span");
      i.fontes.forEach(function (f, k) {
        if (k) fontes.appendChild(document.createTextNode(", "));
        fontes.appendChild(el("a", { href: f.url, rel: "noopener", target: "_blank", text: f.nome }));
      });
      return el("li", null, [
        el("strong", { text: i.nome }),
        " · campo " + i.campo + " · " + i.amostra + " entrevistas · margem " + i.margem +
          " · registro TSE " + i.registro + (i.contratante ? " · contratada por " + i.contratante : "") + " · fonte: ",
        fontes, " ",
        el("span", { class: "conferido c" + i.conferido, text: i.conferido > 1 ? "conferido em " + i.conferido + " fontes" : "1 fonte" })
      ]);
    })));
  }

  // ---------- panorama ----------

  function emLotes(tarefas, n) {
    var resultados = new Array(tarefas.length), prox = 0;
    function trabalhador() {
      if (prox >= tarefas.length) return Promise.resolve();
      var i = prox++;
      return tarefas[i]().then(function (r) { resultados[i] = r; }, function () { resultados[i] = undefined; }).then(trabalhador);
    }
    var ws = [];
    for (var k = 0; k < Math.min(n, tarefas.length); k++) ws.push(trabalhador());
    return Promise.all(ws).then(function () { return resultados; });
  }

  function carregarPanorama(id) {
    var tarefas = [function () { return buscar(CARGOS.presidente, "br"); }];
    UFS.forEach(function (uf) { tarefas.push(function () { return buscar(CARGOS.governador, uf); }); });
    UFS.forEach(function (uf) { tarefas.push(function () { return buscar(CARGOS.senador, uf); }); });
    emLotes(tarefas, SIMULTANEAS).then(function (res) {
      if (id !== estado.req) return;
      var falhas = res.filter(function (r) { return r === undefined; }).length;
      if (falhas === res.length) erro(new Error("sem resposta"));
      else $("aviso").hidden = true;

      var pres = res[0];
      var box = $("pan-presidente");
      if (pres) renderDestaque(box, CARGOS.presidente, "br", pres, analisar(CARGOS.presidente, pres));
      else { box.className = "destaque destaque-compacto aguardando"; box.textContent = ""; box.appendChild(el("p", { class: "mudo", text: "Resultados ainda não publicados pelo TSE." })); }

      tabelaPanorama($("pan-gov"), $("pan-gov-resumo"), CARGOS.governador, res.slice(1, 1 + UFS.length));
      tabelaPanorama($("pan-sen"), $("pan-sen-resumo"), CARGOS.senador, res.slice(1 + UFS.length));
    });
  }

  function tabelaPanorama(tabela, resumo, cfg, dados) {
    var cont = { eleito: 0, turno2: 0, parcial: 0, aguardando: 0 };
    var cab = el("tr", null, [
      el("th", { text: "UF / situação" }), el("th", { class: "num", text: "Apurado" }),
      el("th", { text: "Mais votados" })
    ]);
    var corpo = el("tbody");
    UFS.forEach(function (uf, i) {
      var d = dados[i];
      var an = d ? analisar(cfg, d) : null;
      var tipo = an ? an.tipo : "aguardando";
      cont[tipo]++;
      var rotulos = {
        eleito: cfg.vagas ? "Eleitos" : "Eleito",
        turno2: "2º turno",
        parcial: cfg.vagas ? "Parcial" : an && an.destaque.length === 1 ? "Parcial: vence no 1º" : "Parcial: 2º turno",
        aguardando: "Aguardando"
      };
      var v = an ? an.validos.slice(0, cfg.vagas ? 3 : 2) : [];
      var lideres = v.length && an.tipo !== "aguardando"
        ? el("ol", { class: "lideres" }, v.map(function (c) {
            return el("li", null, [nomeDe(c) + " ", el("span", { class: "mudo-inline", text: pct(c.pvap) })]);
          }))
        : "–";
      var tr = el("tr", { "data-uf": uf, tabindex: "0", title: "Ver detalhes de " + NOMES_UF[uf] }, [
        el("td", null, [el("strong", { text: uf.toUpperCase() }), el("br"), el("span", { class: "tag " + tipo, text: rotulos[tipo] })]),
        el("td", { class: "num", text: d ? pct(d.pst) : "–" }),
        el("td", null, [lideres])
      ]);
      var ir = function () { location.hash = "#" + (cfg.vagas ? "senador" : "governador") + "/" + uf; };
      tr.addEventListener("click", ir);
      tr.addEventListener("keydown", function (e) { if (e.key === "Enter") ir(); });
      corpo.appendChild(tr);
    });
    tabela.textContent = "";
    tabela.appendChild(el("thead", null, [cab]));
    tabela.appendChild(corpo);

    var partes = [];
    if (cont.eleito) partes.push(cont.eleito + (cfg.vagas ? " com eleitos definidos" : cont.eleito > 1 ? " eleitos no 1º turno" : " eleito no 1º turno"));
    if (cont.turno2) partes.push(cont.turno2 + " com 2º turno confirmado");
    if (cont.parcial) partes.push(cont.parcial + " em apuração");
    if (cont.aguardando) partes.push(cont.aguardando + " aguardando dados");
    resumo.textContent = "27 estados: " + partes.join(" · ") + ". Toque em um estado para ver todos os candidatos.";
  }

  // ---------- eventos ----------

  function trocar() {
    gravarRota();
    montarControles();
    $("destaque").hidden = true;
    $("resumo").hidden = true;
    $("aviso").hidden = true;
    $("pesquisas").hidden = true;
    $("candidatos").textContent = "";
    carregar();
  }

  document.querySelectorAll(".cargos button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.cargo === estado.view) return;
      estado.view = b.dataset.cargo;
      if (CARGOS[estado.view] && CARGOS[estado.view].abrangencias.indexOf(estado.uf) === -1) {
        estado.uf = CARGOS[estado.view].abrangencias[0];
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
  setInterval(tick, 1000);
})();

// Pesquisas de véspera (divulgadas em 03/10/2026), conferidas na imprensa.
// Números em % dos VOTOS VÁLIDOS no 1º turno, exatamente como divulgados.
// null = o instituto não divulgou o número desse candidato separadamente.
// "conferido" diz em quantas fontes independentes o número foi checado.
window.PESQUISAS = {
  "presidente/br": {
    institutos: [
      {
        id: "datafolha", nome: "Datafolha", campo: "3/out", amostra: "4.006", margem: "±2 p.p.",
        registro: "BR-01708/2026", contratante: "TV Globo e Folha de S.Paulo", conferido: 2,
        fontes: [
          { nome: "Terra", url: "https://www.terra.com.br/noticias/eleicoes/pesquisas/pesquisa-datafolha-para-presidente-lula-tem-45-em-votos-validos-no-1-turno-flavio-42,597a96c5fe46c0463655d63f0034f9cb2uirzcsq.html" },
          { nome: "Wikipédia", url: "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Brazilian_presidential_election" }
        ]
      },
      {
        id: "quaest", nome: "Quaest", campo: "2 e 3/out", amostra: "3.702", margem: "±2 p.p.",
        registro: "BR-02197/2026", contratante: "TV Globo e O Globo", conferido: 2,
        fontes: [
          { nome: "Exame", url: "https://exame.com/brasil/pesquisa-quaest-para-presidente-lula-tem-46-e-flavio-45-dos-votos-validos-no-1o-turno/" },
          { nome: "Wikipédia", url: "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Brazilian_presidential_election" }
        ]
      },
      {
        id: "atlas", nome: "AtlasIntel", campo: "27/set a 2/out", amostra: "4.945", margem: "±1 p.p.",
        registro: "BR-00999/2026", contratante: "", conferido: 2,
        fontes: [
          { nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/eleicoes/2026/pesquisa-eleitoral-2026/atlasintel-presidente-outubro-2026/" },
          { nome: "Wikipédia", url: "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Brazilian_presidential_election" }
        ]
      }
    ],
    candidatos: [
      { nome: "Lula", partido: "PT", chaves: [["LULA"]], v: { datafolha: 45, quaest: 46, atlas: 47 } },
      { nome: "Flávio Bolsonaro", partido: "PL", chaves: [["FLAVIO", "BOLSONARO"], ["FLAVIO"]], v: { datafolha: 42, quaest: 45, atlas: 44.1 } },
      { nome: "Renan Santos", partido: "Missão", chaves: [["RENAN"]], v: { datafolha: 3, quaest: 3, atlas: 4.6 } },
      { nome: "Ronaldo Caiado", partido: "PSD", chaves: [["CAIADO"]], v: { datafolha: 4, quaest: 3, atlas: 1.4 } },
      { nome: "Augusto Cury", partido: "Avante", chaves: [["CURY"]], v: { datafolha: 3, quaest: 3, atlas: 2.1 } },
      { nome: "Romeu Zema", partido: "Novo", chaves: [["ZEMA"]], v: { datafolha: 1, quaest: 0, atlas: null } }
    ],
    segundoTurno: {
      titulo: "Simulações de 2º turno: Lula x Flávio Bolsonaro",
      linhas: [
        { instituto: "Datafolha", base: "votos totais", texto: "Lula 47% x Flávio 46% (branco/nulo/nenhum 6%, não sabe 2%)" },
        { instituto: "Quaest", base: "votos totais", texto: "Flávio 44% x Lula 42% (branco/nulo/não vai votar 13%, indecisos 1%)" },
        { instituto: "AtlasIntel", base: "votos válidos", texto: "Lula 50,1% x Flávio 49,9%" }
      ],
      nota: "Todas dentro da margem de erro: empate técnico."
    }
  },

  "governador/sp": {
    institutos: [
      {
        id: "datafolha", nome: "Datafolha", campo: "2 e 3/out", amostra: "2.520", margem: "±2 p.p. (±3 nos válidos)",
        registro: "SP-09337/2026", contratante: "TV Globo e Folha de S.Paulo", conferido: 2,
        fontes: [
          { nome: "Diário do Grande ABC", url: "https://www.dgabc.com.br/Noticia/4350623/datafolha-tarcisio-tem-60-dos-validos-em-sp-haddad-35-" },
          { nome: "ac24horas", url: "https://ac24horas.com/2026/10/03/datafolha-sp-tarcisio-tem-60-dos-votos-validos-no-1o-turno-haddad-35/" }
        ]
      }
    ],
    candidatos: [
      { nome: "Tarcísio de Freitas", partido: "Republicanos", chaves: [["TARCISIO"]], v: { datafolha: 60 } },
      { nome: "Fernando Haddad", partido: "PT", chaves: [["HADDAD"]], v: { datafolha: 35 } },
      { nome: "Vera Lúcia", partido: "PSTU", chaves: [["VERA"]], v: { datafolha: 2 } },
      { nome: "Carlos Machado", partido: "PCB", chaves: [["MACHADO"]], v: { datafolha: 2 } },
      { nome: "Vivian Mendes", partido: "UP", chaves: [["VIVIAN"]], v: { datafolha: 1 } },
      { nome: "Izadora Dias", partido: "PCO", chaves: [["IZADORA"]], v: { datafolha: 1 } }
    ]
  },

  "governador/rj": {
    nota: "Cenário com Garotinho na urna (os institutos também testaram um cenário sem ele).",
    institutos: [
      {
        id: "datafolha", nome: "Datafolha", campo: "2 e 3/out", amostra: "2.010", margem: "±2 p.p.",
        registro: "RJ-01334/2026", contratante: "", conferido: 1,
        fontes: [{ nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/eleicoes/2026/pesquisa-eleitoral-2026/datafolha-governador-senador-rio-de-janeiro-outubro-2026-2/" }]
      },
      {
        id: "quaest", nome: "Quaest", campo: "2 e 3/out", amostra: "3.204", margem: "±2 p.p.",
        registro: "RJ-03032/2026", contratante: "", conferido: 1,
        fontes: [{ nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/eleicoes/2026/pesquisa-eleitoral-2026/quaest-governador-senador-rio-de-janeiro-outubro-2026/" }]
      },
      {
        id: "atlas", nome: "AtlasIntel", campo: "27/set a 2/out", amostra: "2.244", margem: "±2 p.p.",
        registro: "RJ-02601/2026", contratante: "", conferido: 1,
        fontes: [{ nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/eleicoes/2026/pesquisa-eleitoral-2026/atlasintel-governador-senador-rio-de-janeiro-outubro-2026/" }]
      }
    ],
    candidatos: [
      { nome: "Eduardo Paes", partido: "PSD", chaves: [["PAES"]], v: { datafolha: 46, quaest: 49, atlas: 48.6 } },
      { nome: "Douglas Ruas", partido: "PL", chaves: [["RUAS"]], v: { datafolha: 38, quaest: 40, atlas: 39.8 } },
      { nome: "Garotinho", partido: "Republicanos", chaves: [["GAROTINHO"]], v: { datafolha: 7, quaest: 6, atlas: 6.4 } },
      { nome: "William Siri", partido: "PSOL", chaves: [["SIRI"]], v: { datafolha: 4, quaest: 3, atlas: 1.8 } },
      { nome: "Coronel Busnello", partido: "Missão", chaves: [["BUSNELLO"]], v: { datafolha: 2, quaest: 1, atlas: 2.2 } },
      { nome: "André Marinho", partido: "Novo", chaves: [["MARINHO"]], v: { datafolha: 1, quaest: 1, atlas: null } }
    ]
  },

  "governador/mg": {
    institutos: [
      {
        id: "datafolha", nome: "Datafolha", campo: "2 e 3/out", amostra: "2.010", margem: "±2 p.p.",
        registro: "MG-06705/2026", contratante: "", conferido: 1,
        fontes: [{ nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/eleicoes/2026/pesquisa-eleitoral-2026/datafolha-governador-senador-minas-gerais-outubro-2026/" }]
      }
    ],
    candidatos: [
      { nome: "Cleitinho", partido: "Republicanos", chaves: [["CLEITINHO"]], v: { datafolha: 53 } },
      { nome: "Patrus Ananias", partido: "PT", chaves: [["PATRUS"]], v: { datafolha: 21 } },
      { nome: "Alexandre Kalil", partido: "PDT", chaves: [["KALIL"]], v: { datafolha: 9 } },
      { nome: "Mateus Simões", partido: "PSD", chaves: [["MATEUS"]], v: { datafolha: 4 } },
      { nome: "Flávio Roscoe", partido: "PL", chaves: [["ROSCOE"]], v: { datafolha: 4 } },
      { nome: "Gabriel", partido: "MDB", chaves: [["GABRIEL"]], v: { datafolha: 3 } },
      { nome: "Ben Mendes", partido: "Missão", chaves: [["BEN", "MENDES"]], v: { datafolha: 2 } }
    ]
  },

  "senador/rj": {
    nota: "No Senado cada eleitor vota em 2 nomes; percentuais consolidados pelo instituto.",
    institutos: [
      {
        id: "datafolha", nome: "Datafolha", campo: "2 e 3/out", amostra: "2.010", margem: "±2 p.p.",
        registro: "RJ-01334/2026", contratante: "", conferido: 1,
        fontes: [{ nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/eleicoes/2026/pesquisa-eleitoral-2026/datafolha-governador-senador-rio-de-janeiro-outubro-2026-2/" }]
      }
    ],
    candidatos: [
      { nome: "Benedita da Silva", partido: "PT", chaves: [["BENEDITA"]], v: { datafolha: 26 } },
      { nome: "Carlos Jordy", partido: "PL", chaves: [["JORDY"]], v: { datafolha: 19 } },
      { nome: "Carlos Portinho", partido: "PL", chaves: [["PORTINHO"]], v: { datafolha: 18 } },
      { nome: "Pedro Paulo", partido: "PSD", chaves: [["PEDRO", "PAULO"]], v: { datafolha: 13 } },
      { nome: "Monica Benicio", partido: "PSOL", chaves: [["BENICIO"]], v: { datafolha: 9 } },
      { nome: "Marcelo Crivella", partido: "Republicanos", chaves: [["CRIVELLA"]], v: { datafolha: 6 } }
    ]
  },

  "senador/mg": {
    nota: "No Senado cada eleitor vota em 2 nomes; percentuais consolidados pelo instituto.",
    institutos: [
      {
        id: "datafolha", nome: "Datafolha", campo: "2 e 3/out", amostra: "2.010", margem: "±2 p.p.",
        registro: "MG-06705/2026", contratante: "", conferido: 1,
        fontes: [{ nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/eleicoes/2026/pesquisa-eleitoral-2026/datafolha-governador-senador-minas-gerais-outubro-2026/" }]
      }
    ],
    candidatos: [
      { nome: "Marília Campos", partido: "PT", chaves: [["MARILIA"]], v: { datafolha: 21 } },
      { nome: "Carlos Viana", partido: "PSD", chaves: [["VIANA"]], v: { datafolha: 19 } },
      { nome: "Domingos Sávio", partido: "PL", chaves: [["DOMINGOS"]], v: { datafolha: 17 } },
      { nome: "Aécio Neves", partido: "PSDB", chaves: [["AECIO"]], v: { datafolha: 13 } },
      { nome: "Marcelo Aro", partido: "PP", chaves: [["MARCELO", "ARO"]], v: { datafolha: 9 } },
      { nome: "Áurea Carolina", partido: "PSOL", chaves: [["AUREA"]], v: { datafolha: 9 } }
    ]
  }
};

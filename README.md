# Apuração Eleições 2026

Página estática que acompanha ao vivo a apuração das Eleições 2026 (1º turno, 04/10/2026) com os dados oficiais do TSE: **Presidente** (Brasil, cada UF e Exterior), **Governador** e **Senador** (por UF).

- Lê direto os arquivos públicos de resultado do TSE: `https://resultados.tse.jus.br/oficial/ele2026/<eleição>/dados/<uf>/<uf>-c<cargo>-e<eleição>-u.json`, formato usado em 2026. Se esse arquivo não existir, tenta o antigo `dados-simplificados/…-r.json`. O TSE libera CORS, então não precisa de servidor.
- Atualiza sozinha a cada 15 segundos (30 s no Panorama).
- **Quem está ganhando:** destaque no topo de cada disputa. Diz quem lidera e o que acontece se a apuração terminar agora: vitória no 1º turno (mais de 50% dos válidos), 2º turno entre os dois primeiros ou, no Senado, os 2 eleitos. Mostra também a diferença em votos. Quando o TSE marca o eleito ou o 2º turno, o selo muda de "Parcial" para "Oficial TSE".
- **Panorama:** Presidente e os 27 estados (Governador e Senado) numa tela só.
- **Pesquisas de véspera x apuração** (`pesquisas.js`): Datafolha, Quaest e AtlasIntel para Presidente; Datafolha para Governador de SP; Datafolha, Quaest e AtlasIntel para Governador do RJ; Datafolha para Governador de MG e Senado de RJ e MG. Cada pesquisa traz campo, amostra, margem, registro no TSE, link da fonte e em quantas fontes independentes foi conferida.
- Links diretos por hash: `#panorama`, `#presidente/br`, `#governador/sp`, `#senador/mg`.

## Rodar

Basta abrir `index.html` no navegador ou publicar a pasta em qualquer hospedagem estática (GitHub Pages, Netlify etc.).

## 2º turno (25/10/2026)

Em `app.js`, troque os códigos de eleição em `CARGOS`: `6257` → `6258` (Presidente) e `6259` → `6260` (Governador). O Senador não tem 2º turno.

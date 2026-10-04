# Apuração Eleições 2026

Página estática que acompanha ao vivo a apuração das Eleições 2026 (1º turno, 04/10/2026) com os dados oficiais do TSE: **Presidente** (Brasil, cada UF e Exterior), **Governador** e **Senador** (por UF).

- Lê direto os arquivos públicos `dados-simplificados` de `https://resultados.tse.jus.br/oficial/ele2026/…` (o TSE libera CORS, então não precisa de servidor).
- Atualiza sozinha a cada 30 segundos e mostra as seções totalizadas, o comparecimento, os brancos e nulos, além dos candidatos ordenados por votos, com selo de "Eleito" ou "2º turno".
- Links diretos por hash: `#presidente/br`, `#governador/sp`, `#senador/mg`.

## Rodar

Basta abrir `index.html` no navegador ou publicar a pasta em qualquer hospedagem estática (GitHub Pages, Netlify etc.).

## 2º turno (25/10/2026)

Em `app.js`, troque os códigos de eleição em `CARGOS`: `6257` → `6258` (Presidente) e `6259` → `6260` (Governador). O Senador não tem 2º turno.

# Still Connect — POC

Plataforma B2B de negociação, pagamento e logística de aço com micro-leilão reverso, escrow e prova criptográfica de entrega.

> **Frase-guia:** *"A Still Connect parece simples porque o sistema faz o trabalho pesado."*

---

## O que tem aqui

- **`EVOLUCAO_STILLCONNECT.md`** — plano estratégico completo (tese, MVP, roadmap, arquitetura, modelo de negócio, GTM, defensabilidade, métricas, riscos, próximos 90 dias).
- **`poc/frontend/`** — POC funcional, client-side, com 10 telas + tour de 60 segundos.

## Telas da POC

1. Home (pitch + tour)
2. Painel do Comprador
3. Criar demanda (preço-alvo confidencial)
4. Detalhe da demanda + seleção de participantes
5. **Sala de leilão ao vivo** (produto + frete em paralelo, soft close, lances do investidor + bots)
6. Marketplace anônimo (visão Fornecedor)
7. Contrato + FSM visual
8. Escrow + Trava Fiscal NF×escrow
9. Logística + janela 72h + split automático
10. Dashboard Admin + Business Heartbeat + audit log

## Rodar localmente

```bash
cd poc/frontend
npm install
npm run dev
```

## Build de produção

```bash
cd poc/frontend
npm run build
npm run preview
```

## Deploy

GitHub Actions deploya automaticamente em GitHub Pages a cada push na `main`. Ver `.github/workflows/deploy.yml`.

URL pública (após primeiro deploy): `https://<user>.github.io/stillconnect-poc/`

## Stack

- Vite + React + TypeScript + Tailwind
- React Router (BrowserRouter com basename para Pages)
- Mock-mode 100% client-side: `localStorage` + Web Crypto API (AES-256-GCM)
- Tour guiado com programmatic clicks via `data-tour` attributes
- Lucide React para ícones

## Conceitos da Bíblia Técnica implementados

- FSM rigorosa do contrato (`CONTRATO_GERADO → ACEITO → ATIVO → ENTREGUE → CONCLUIDO`)
- Trava Fiscal com tolerância R$ 1,00 (NF×escrow)
- Token de carga via SHA-256
- Audit log append-only
- Soft close de leilão (overtime)
- Anonimização da demanda no marketplace
- Server-time UTC (frontend converte)
- Money em centavos / decimal — float é proibido

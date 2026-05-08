# Steel Connect — POC

Plataforma B2B de negociação, pagamento e logística de aço com micro-leilão reverso, escrow e prova criptográfica de entrega.

> **Frase-guia:** *"A Steel Connect parece simples porque o sistema faz o trabalho pesado."*

---

## O que tem aqui

- **`EVOLUCAO_STEELCONNECT.md`** — plano estratégico completo (tese, MVP, roadmap, arquitetura, modelo de negócio, GTM, defensabilidade, métricas, riscos, próximos 90 dias).
- **`MVP_ENGENHARIA.md`** — engenharia MVP (inclui **3 repositórios GitHub**: web / api / infra).
- **`poc/frontend/`** — POC funcional, client-side, com telas principais + tour de ~60 segundos.

## Marca e deploy (GitHub Pages)

O nome da plataforma é **Steel Connect**. O caminho `base` do Vite na build (`poc/frontend/vite.config.ts`) deve coincidir com o **nome do repositório** no GitHub Pages (ex.: `/stillconnect-poc/`). Ao renomear o repositório, atualize esse `base` para o novo slug.

## Telas da POC

1. Home (pitch + tour)
2. Painel do Comprador
3. Criar demanda (preço-alvo confidencial + modo leilão ou RFQ)
4. Detalhe da demanda + seleção de participantes
5. **Sala de leilão ao vivo** (produto + frete em paralelo, soft close, lances do investidor + bots)
6. **Revisão de ofertas (RFQ)** — comprador aceita/recusa propostas (mesmo pós-contrato que o leilão)
7. **Envio de oferta** — fornecedor convidado (marketplace → formulário)
8. Marketplace anônimo (visão Fornecedor)
9. Contrato + FSM visual
10. Escrow + Trava Fiscal NF×escrow
11. Logística + janela 72h + split automático
12. Dashboard Admin + Business Heartbeat + audit log

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

URL pública (exemplo): `https://<user>.github.io/stillconnect-poc/` — depende do slug do repo no GitHub.

## Stack

- Vite + React + TypeScript + Tailwind
- React Router (BrowserRouter com basename para Pages)
- Mock-mode 100% client-side: `localStorage` + Web Crypto API (AES-256-GCM)
- Tour guiado com programmatic clicks via `data-tour` attributes
- Lucide React para ícones

## Conceitos da Bíblia Técnica implementados

- **Micro-leilão reverso** é o modo **canônico** da especificação (competição em tempo real, duas pistas produto + frete).
- **Coleta de ofertas (RFQ)** é um **modo alternativo de POC**: oferta fechada com produto + frete + transportadora entre as já selecionadas; ao aceitar, o mesmo fluxo **Contrato → Escrow → Logística** é reutilizado sem duplicar FSM.
- FSM rigorosa do contrato (`CONTRATO_GERADO → ACEITO → ATIVO → ENTREGUE → CONCLUIDO`)
- Trava Fiscal com tolerância R$ 1,00 (NF×escrow)
- Token de carga via SHA-256
- Audit log append-only
- Soft close de leilão (overtime)
- Anonimização da demanda no marketplace
- Server-time UTC (frontend converte)
- Money em centavos / decimal — float é proibido

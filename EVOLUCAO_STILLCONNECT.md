# Still Connect — Plano de Evolução Estratégica

> **Documento de trabalho** baseado no One-Pager (Jornada UX) e na Bíblia Técnica oficial. Objetivo: traduzir uma tese forte em um produto financiável, defensável e auditável — sem perder a frase-guia: *"A Still Connect parece simples porque o sistema faz o trabalho pesado."*

---

## Sumário

1. [O que é Still Connect (em uma frase)](#1-resumo)
2. [A Tese — por que isso existe](#2-tese)
3. [Hipóteses críticas a validar](#3-hipoteses)
4. [MVP — o menor produto que prova a tese](#4-mvp)
5. [Roadmap em Ondas](#5-roadmap)
6. [Arquitetura técnica não-negociável](#6-arquitetura)
7. [Modelo de Negócio e unit economics](#7-modelo-de-negocio)
8. [Go-to-Market](#8-gtm)
9. [Defensabilidade — os 5 fossos](#9-defensabilidade)
10. [Métricas](#10-metricas)
11. [Riscos, mitigação e governança](#11-riscos)
12. [Próximos 90 dias](#12-proximos-90-dias)
13. [Apêndice — escopo proposto da POC](#13-poc)

---

## 1. Resumo

> **Still Connect é uma infraestrutura de mercado B2B financeiro-industrial** que conecta compradores, fornecedores e transportadoras de aço através de **micro-leilão reverso com escrow** — entregando ao usuário uma experiência simples de "estou negociando", enquanto o sistema garante FSM rigorosa de contrato, trava fiscal NF×escrow e prova criptográfica de entrega.

**Não é um marketplace tradicional.** É infraestrutura de mercado: o sistema é a fonte única da verdade sobre estado, dinheiro e prova.

---

## 2. Tese

### Onde está o "oceano azul"

O mercado brasileiro de aço movimenta dezenas de bilhões de reais ao ano e ainda transaciona em três modos arcaicos: telefone/WhatsApp para cotação, planilha para fechar, transferência bancária para pagar. Existem três falhas estruturais:

1. **Negociação opaca** — o comprador liga em 5-7 fornecedores. Cada um sabe o nome dos outros, e ninguém sabe o preço-alvo. Resultado: spread alto e rent-seeking.
2. **Risco financeiro descalibrado** — pré-pagamento sem garantia de entrega ou pós-pagamento sem garantia de recebimento. Quem segura o caixa, tem o poder. Quem não tem, sofre.
3. **Logística terceira** — frete cotado fora do contrato, sem prova auditável de entrega. Disputa vira "ele falou, ela falou".

A Still Connect não compete com marketplace de aço — **ela é a infraestrutura financeira e logística que torna o mercado de aço competitivo**.

### Posicionamento (uma frase para o pitch)

> **"Somos a Stripe + Loggi do mercado de commodities industriais — começando pelo aço. O comprador sente que está negociando; o sistema garante que o dinheiro, o mercado e o risco estão sob controle."**

### Princípios não-negociáveis (extraídos da Bíblia Técnica)

| Princípio | Implicação prática |
|---|---|
| Todo fluxo é event-driven | Event Sourcing em BIDS, PAYMENTS_EVENTS, AUDIT_LOGS, CONTRACT_EVENTS |
| Todo dinheiro é stateful | FSM financeira: PGTO_PENDENTE → ANALISE → ESCROW → LIBERADO/ESTORNADO |
| Todo usuário é potencialmente malicioso | Idempotência obrigatória em qualquer endpoint financeiro |
| Todo erro é esperado | DoD: nada está pronto se não tem rollback e não foi testado em caos |
| O servidor é a única autoridade de tempo | Soft close de leilão controlado server-side, UTC interno, fuso só no client |
| A realidade física comprovada prevalece sobre intenções digitais | Prova de entrega assinada criptograficamente vence ações digitais (com tolerância 6h) |

---

## 3. Hipóteses

Antes de queimar capital, validar 5 hipóteses em ordem:

### H1 — Demanda
**Compradores de aço (siderúrgicas-clientes, distribuidores, construtoras) topam pagar take rate sobre GMV em troca de competição justa + escrow.**
- *Como validar:* 20 entrevistas com responsáveis de compras em empresas que compram >R$ 1M/mês de aço.
- *Sinal positivo:* >50% sinaliza disposição em pagar 0,5-1,5% sobre GMV se o spread cair >2%.

### H2 — Oferta
**Fornecedores (siderúrgicas e distribuidores grandes) entram na plataforma se o pipeline de demandas qualificadas justificar.**
- *Como validar:* 10 entrevistas com diretores comerciais de produtores/distribuidores.
- *Sinal positivo:* concordam em entrar se a Still trouxer ≥10 demandas/mês qualificadas e exclusividade ≥30 dias na primeira onda.

### H3 — Logística
**Transportadoras de carga industrial topam leilão de frete em vez de tabela.**
- *Como validar:* parceria piloto com 3-5 transportadoras regionais.
- *Sinal positivo:* aceitam leilão de frete se o app oferece prova de entrega e pagamento garantido em D+2 do split.

### H4 — Banco
**Existe banco/IP parceiro que opera escrow em centavos com webhooks confiáveis e split automático.**
- *Como validar:* due diligence em ≥3 bancos parceiros (Stark, BMP, ACQ, etc.).
- *Sinal positivo:* contrato de parceria com SLA de webhook <5min e custo de operação <0,3% do volume.

### H5 — Compliance
**KYB/KYC dos atores Tier-1 é tractable em <72h e fica robusto contra fraude pessoal jurídica.**
- *Como validar:* 5 onboardings de teste com fornecedores reais.
- *Sinal positivo:* validação automática + revisão humana em ≤72h em >90% dos casos.

> **Se H1+H2 caírem, o produto não tem mercado.** Validar primeiro, codar depois.

---

## 4. MVP

### Princípio
O MVP **não é a plataforma toda**. É o **menor recorte que prova as 5 hipóteses** num corredor único.

### Recorte do corredor MVP

- **1 produto:** vergalhão CA-50 (commodity mais comum, especificação simples, alta liquidez).
- **1 região:** São Paulo capital + região metropolitana (Grande SP).
- **1 banco parceiro:** o que aceitar primeiro com SLA de webhook <5min.
- **5 compradores design-partners:** construtoras médias com compras recorrentes.
- **3 fornecedores (mix:** 1 produtor + 2 distribuidores).
- **3 transportadoras** com cobertura regional.

### O que o MVP entrega ponta a ponta

1. Cadastro/KYB (manual com revisão humana — automatizar é Wave 2)
2. Criação de demanda anonimizada
3. Match de fornecedores e transportadoras
4. Seleção pelo comprador
5. **Micro-leilão reverso ao vivo** (produto + frete em paralelo) — *o highlight visual do produto*
6. Contrato gerado automaticamente
7. **Escrow + Trava Fiscal NF×Escrow** (com tolerância R$ 1)
8. Logística com prova criptográfica (app mobile básico)
9. Janela de 72h
10. Conclusão automática + split + atualização de score

### O que NÃO está no MVP (corte cirúrgico)

- I18N / múltiplas moedas (server já em UTC e currency_code, mas frontend só PT-BR/BRL)
- Disputa formal (existe estado mas mediação é manual via admin sem UI dedicada)
- Score gamificado (existe campo numérico, sem dashboard de gamificação)
- App mobile nativo (PWA mobile-first é suficiente)
- Auto-onboarding self-serve (todo cliente passa por CSM dedicado)
- Multi-produto (só vergalhão; outros aços ficam para Wave 2)

### Critério de sucesso do MVP

| KPI | Meta |
|---|---|
| GMV transacionado em escrow | ≥ R$ 5M em 90 dias |
| Spread médio reduzido | ≥ 2 p.p. vs cotação telefônica |
| Disputas abertas | < 5% dos contratos |
| Tempo cadastro → primeira compra | < 14 dias |
| NPS comprador | ≥ 50 |

---

## 5. Roadmap

### Wave 1 — Foundation (M1–M3)
- Implementação do MVP (escopo acima)
- 5 design partners (compradores) + 3 fornecedores + 3 transportadoras
- Banco parceiro escolhido e integrado em sandbox
- KYB manual com SLA de 72h

### Wave 2 — Expansion (M4–M6)
- Multi-produto: chapas, tubos, perfis, fios
- Multi-região: capitais do Sul/Sudeste
- KYB automatizado (Serasa/Bigboost/Idwall)
- Score & selos visíveis (visual de "fornecedor confiável")
- App mobile dedicado pra transportadora (Flutter ou RN — escolher pela equipe)

### Wave 3 — Intelligence (M7–M12)
- Engine de recomendação: dado o histórico, sugere fornecedor + frete provável
- Detecção de anomalia: alertas de queda de GMV / conversão / cadastro (Business Heartbeat)
- Marketplace público de demandas (com paywall pro fornecedor entrar)
- Dashboard B2B SaaS pra grandes compradores (multi-usuário, RBAC, aprovação)

### Wave 4 — Network (M13–M24)
- Crédito embedded: antecipação para fornecedor + financiamento para comprador
- Inteligência de preço: índice Still de preço de aço (a la Trading Economics)
- Expansão LATAM: México (acero), Argentina, Colômbia
- Adjacências: cimento, vidro plano, ferragens

---

## 6. Arquitetura

### Componentes obrigatórios (não-negociáveis)

```
┌─────────────────────────────────────────────────────────────────┐
│                      STILL CONNECT                               │
└─────────────────────────────────────────────────────────────────┘

  Web (Comprador / Fornecedor)        Mobile (Transportadora)
       PWA Next.js                       PWA / Flutter
            │                                  │
            └─────────────┬────────────────────┘
                          │
                    ┌─────▼──────┐
                    │  API GW    │  (auth, rate limit, idempotency keys)
                    └─────┬──────┘
                          │
        ┌─────────────────┼─────────────────────┬──────────────────┐
        ▼                 ▼                     ▼                  ▼
  ┌────────────┐  ┌────────────────┐  ┌──────────────────┐  ┌──────────┐
  │ Demand     │  │ Auction        │  │ Contract FSM     │  │ Audit    │
  │ Service    │  │ Engine         │  │ Service          │  │ Service  │
  └─────┬──────┘  └────────┬───────┘  └─────────┬────────┘  └────┬─────┘
        │                  │                    │                │
        └──────────────────┴────────────────────┴────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
         ┌────────────┐   ┌────────────┐   ┌────────────┐
         │ Payments   │   │ Logistics  │   │ Notification│
         │ + Escrow   │   │ + Proof    │   │ Service     │
         └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
               │                │                │
               ▼                ▼                ▼
         ┌──────────┐    ┌──────────────┐  ┌──────────┐
         │ Banco    │    │ App offline  │  │ WhatsApp │
         │ Parceiro │    │ first        │  │ + Email  │
         └──────────┘    └──────────────┘  └──────────┘

  Storage:
    PostgreSQL (write-side, FSM state)
    Kafka/Redpanda (event sourcing: BIDS, PAYMENTS, CONTRACT, AUDIT)
    Redis (auction realtime + idempotency cache)
    S3 (NF XMLs, fotos de prova, documentos KYB)
    Data Lake (eventos anonimizados pra ML/BI)

  Cross-cutting:
    OpenTelemetry (todos os spans com tenant + actor)
    Append-only audit (não há DELETE)
    Idempotency-Key obrigatório em endpoints financeiros
```

### Decisões técnicas críticas

| Tema | Decisão | Por quê |
|---|---|---|
| Linguagem backend | Go ou Java/Kotlin | Performance + maturidade financial-grade |
| FSM | Biblioteca dedicada (XState ou Stateless) | Não rolar à mão; transições inválidas = bug |
| Money | `int` em centavos OU `decimal(19,4)` | **Float é proibido** (Bíblia Técnica) |
| Realtime | WebSocket com Redis pub/sub | Soft close do leilão exige <100ms latência |
| Idempotência | `Idempotency-Key` header em qualquer endpoint financeiro | Cliente sempre pode reenviar; backend decide se efetiva |
| Tempo | Servidor em UTC, frontend faz conversão | Horário de verão não pode terminar leilão na hora errada |
| I18N | `currency_code` no DB + `t('key')` em todo texto UI | Custa US$ 0 hoje; salva milhões em 2 anos |

### A FSM do Contrato (literal da Bíblia)

```
[*] → CONTRATO_GERADO
CONTRATO_GERADO → CONTRATO_ACEITO   (aceite)
CONTRATO_GERADO → CONTRATO_CANCELADO  (timeout / desistência)

CONTRATO_ACEITO → CONTRATO_ATIVO_PAGAMENTO_CONFIRMADO  (escrow + NF ok)
CONTRATO_ACEITO → CONTRATO_CANCELADO  (falha pagamento)

CONTRATO_ATIVO_PAGAMENTO_CONFIRMADO → CONTRATO_ENTREGUE_AGUARDANDO_JANELA  (prova de entrega)

CONTRATO_ENTREGUE_AGUARDANDO_JANELA → CONTRATO_EM_DISPUTA  (comprador abre)
CONTRATO_ENTREGUE_AGUARDANDO_JANELA → CONTRATO_CONCLUIDO   (timeout 72h)

CONTRATO_EM_DISPUTA → CONTRATO_RESOLVIDO_PROCEDENTE   (favor comprador)
CONTRATO_EM_DISPUTA → CONTRATO_RESOLVIDO_IMPROCEDENTE (favor fornecedor)

CONTRATO_RESOLVIDO_PROCEDENTE   → CONTRATO_CANCELADO  (estorno)
CONTRATO_RESOLVIDO_IMPROCEDENTE → CONTRATO_CONCLUIDO  (split libera)

CONTRATO_CONCLUIDO → [*]
CONTRATO_CANCELADO → [*]
```

> **Regra crítica:** estados `RESOLVIDO_*` são transitórios e obrigatoriamente levam, na mesma transação, a `CONCLUIDO` ou `CANCELADO`. Não existe estado neutro pós-disputa.

### A Trava Fiscal (NF × Escrow)

```
Upload XML → leitura <vNF> → comparar com valor em escrow

Δ ≤ R$ 1,00:
  → aprovação automática
  → status PGTO_EM_ESCROW
  → libera logística (token de carga)

Δ > R$ 1,00:
  → status PGTO_EM_ANALISE_DIVERGENCIA
  → comprador decide em até 48h:
      • aceita waiver (paga complementar OU desconta no split)
      • rejeita → reemissão da NF
      • timeout 48h → reemissão obrigatória
```

---

## 7. Modelo de Negócio

### Estrutura de receita (4 camadas)

| Camada | Valor estimado | Quando cobrar |
|---|---|---|
| **Setup / Onboarding** | R$ 5–25k por empresa | KYB, treinamento, integração |
| **Take rate sobre GMV** | 0,5–1,5% | Sobre cada contrato concluído |
| **Take rate sobre frete** | 1,5–3% | Leilão de frete (margem mais alta) |
| **Float financeiro (escrow)** | ~CDI menos custo banco | Yield sobre o saldo médio retido |
| **Receita futura (Wave 4):** | | |
| Crédito embedded | spread 1,5–4% sobre R$ adiantado | Opcional ao fornecedor |
| Inteligência de preço | R$ 5–50k/mês por relatório | SaaS B2B (Wave 4) |

### Unit economics-alvo (ano 2)

- Take rate combinado: 0,7% sobre GMV + 2,5% sobre frete + float ≈ **1,1% efetivo sobre GMV**
- Margem bruta: > 70%
- LTV/CAC: > 5x (B2B com volume recorrente)
- Payback: < 9 meses
- Net Revenue Retention: > 130% (cliente que entra, gasta mais ano após ano)

### Por que essa estrutura funciona

- **Setup** garante skin-in-the-game; cliente que pagou 15k não trata como experimento.
- **Take rate** alinha o incentivo: Still ganha quando o mercado funciona.
- **Float** é receita "de graça" — dinheiro fica retido durante 5-15 dias entre escrow e split.
- **Crédito embedded (Wave 4)** é o que multiplica receita por 5x sobre take rate puro.

---

## 8. GTM

### ICP (Ideal Customer Profile) — comprador

- Empresa B2B comprando ≥ R$ 1M/mês de aço (vergalhão CA-50 inicialmente)
- Tem time de compras dedicado (≥ 1 comprador formal)
- Já compra de ≥ 3 fornecedores diferentes
- Tem CFO/Diretor financeiro engajado em redução de spread
- Setores prioritários: construtoras médias, fábricas de pré-moldado, indústria leve

### ICP — fornecedor

- Distribuidor regional com ≥ R$ 5M/mês em vendas
- OU produtor de aço com excedente de capacidade
- Time comercial digital-friendly (≥ 1 pessoa que sabe usar plataforma)
- Margem de manobra de 3–8 p.p. sobre cotação telefônica

### ICP — transportadora

- Frota dedicada de carga industrial (cavalo + carreta cegonha ou prancha)
- Cobertura regional (Grande SP no MVP)
- App de motorista funcional (ou disposição em adotar)

### Canais de aquisição

1. **Outbound direto** — SDR ligando pra Diretor de Compras de top-100 construtoras de SP.
2. **Parcerias com associações** — Sinduscon, ABCEM (centros de embaladores de aço).
3. **Eventos** — Construtech, Feicon, Expomafe.
4. **Co-marketing com banco parceiro** — banco vende como "produto financeiro avançado".
5. **Conteúdo técnico** — calculadora de spread, dashboard de preço de aço (lead magnet).

### Estratégia Land & Expand

- **Land:** uma única demanda piloto, um único produto (vergalhão CA-50), em corredor de 2 cidades.
- **Expand:** depois de 5 contratos concluídos com sucesso → liberar mais produtos, mais regiões, segundo banco parceiro como redundância.
- **Multiplicar:** cada cliente pago vira case + sustenta SDR pro próximo trimestre.

---

## 9. Defensabilidade

### Os 5 fossos a construir (em ordem)

1. **Fosso de Compliance** *(curto prazo)* — primeiros a ter selo BACEN (se virar IP) e certificação ISO 27001 + SOC 2 Type II. Barreira regulatória brutal pra entrante.
2. **Fosso de Banco Parceiro** *(curto prazo)* — contrato de exclusividade ou multi-banco redundante. Sem escrow real, não tem produto. Concorrente novo precisa repetir essa negociação.
3. **Fosso de Network Effect** *(médio prazo)* — comprador entra pelos fornecedores; fornecedor entra pelos compradores. Duas-pontas. Quanto mais densidade, maior é o fosso. Liquidez é destino, não meio.
4. **Fosso de Dados Proprietários** *(médio-longo prazo)* — cada leilão treina o modelo de preço. Em 2 anos, Still tem o melhor índice de preço de aço do Brasil — vira dado vendável.
5. **Fosso de Marca** *(longo prazo)* — virar a "categoria": *"Vamos passar pelo Still Connect, é mais limpo"*. Quem cria categoria define as regras.

---

## 10. Métricas

### North Star Metric

> **GMV transacionado em escrow no mês.**

Reflete simultaneamente: confiança do mercado, adoção pelos atores, receita potencial (take rate é função disso) e densidade da rede.

### KPIs operacionais

| Categoria | Métrica | Meta Wave 1 |
|---|---|---|
| Aquisição | Compradores cadastrados/mês | ≥ 5 |
| Aquisição | Fornecedores ativos/mês | ≥ 3 |
| Adoção | Demandas/comprador/mês | ≥ 4 |
| Mercado | Match rate (demanda → leilão) | ≥ 70% |
| Mercado | Spread reduzido (vs telefônica) | ≥ 2 p.p. |
| Operacional | Disputa rate | < 5% |
| Operacional | SLA de webhook bancário | < 5 min |
| Financeiro | Take rate efetivo sobre GMV | ≥ 0,8% |
| Financeiro | NRR (Net Revenue Retention) | ≥ 110% |
| Confiança | NPS comprador | ≥ 50 |

### Business Heartbeat (alertas em tempo real)

Conforme a Bíblia Técnica:
- **Queda de GMV:** "volume últimas 2h está 40% abaixo da média 4 últimas terças" → alerta crítico
- **Conversão de leilão:** "taxa de lances/leilão caiu drasticamente" → possível bug WebSocket
- **Cadastro:** "zero novos cadastros em 3h" → possível erro form CNPJ

---

## 11. Riscos

### Matriz de riscos

| Risco | Prob | Impacto | Mitigação |
|---|---|---|---|
| Banco parceiro não fecha contrato com SLA | Média | Crítico | Negociar com ≥3 bancos em paralelo desde o dia zero. |
| Fraude PJ no KYB (laranja com CNPJ ativo) | Alta | Alto | KYB com Serasa/Bigboost + revisão humana + score de risco + cooldown de saque. |
| Disputa por adulteração de NF (vNF false) | Média | Alto | Trava fiscal automatizada + assinatura digital A1 + audit log + rejeição com timeout. |
| Concorrente big tech entra (Mercado Livre, etc) | Baixa | Crítico | Velocidade + verticalização total + relacionamento Tier-1 + ser opção M&A. |
| Falha do sistema durante leilão ao vivo | Média | Crítico | Replicação Redis + Kafka + soft close em fallback + replay de event log. |
| Inadimplência massiva pós-piloto | Baixa | Alto | Pagamento 100% antecipado em escrow elimina inadimplência por desenho. |
| Lock-in regulatório (BACEN) demora | Média | Médio | Operar como facilitador de pagamento sob banco parceiro até virar IP próprio. |
| Disputa que vira processo judicial | Média | Alto | Foro arbitral + audit log imutável + provas criptográficas como evidência. |

### Compliance & Governança (extraída da Bíblia)

- **Logs imutáveis** em todas as operações (append-only)
- **Kill Switch** apenas para SUPER_ADMIN com justificativa, ticket SLA 24h, log crítico
- **God Mode** com gravação em vídeo da sessão administrativa
- **RBAC completo** desde dia zero
- **Idempotência** em qualquer endpoint financeiro

### Definição de "Pronto" (DoD)

Nada é pronto se:
1. Não gera log
2. Não trata exceção
3. Não possui rollback
4. Não é auditável
5. Não foi testado em cenário de caos

---

## 12. Próximos 90 Dias

### Mês 1 — Validação e fundação
- [ ] Entrevistar 20 compradores (H1) + 10 fornecedores (H2)
- [ ] Due diligence com ≥3 bancos parceiros (H4)
- [ ] Setup jurídico: PJ, contrato societário, vesting, cap table, foro arbitral
- [ ] Brand + posicionamento + site one-page
- [ ] Recrutar (se ainda não tem): CTO técnico financial-grade + Head Comercial B2B Tier-1

### Mês 2 — POC + parcerias
- [ ] **POC funcional do fluxo highlight** (ver apêndice abaixo)
- [ ] Carta de intenção de ≥3 design partners (compradores) + 2 fornecedores
- [ ] Contrato preliminar com banco parceiro (sandbox)
- [ ] Definição da stack final + ADRs
- [ ] Implementação do MVP em sandbox (escrow falso ainda)

### Mês 3 — MVP em produção controlada
- [ ] Primeiro contrato real concluído com 1 design partner
- [ ] KYB manual rodando com SLA <72h
- [ ] Banco parceiro em produção (escrow real)
- [ ] Auditoria interna de logs (append-only) e FSM
- [ ] Decisão: levantar pre-seed (R$ 3-5M) ou seed (R$ 12-18M)?

### Decisões a tomar até o fim do trimestre
1. **Banco parceiro principal** — Stark, BMP, ACQ, Quanto, Stone?
2. **Stack de FSM** — XState (TS) ou Stateless (.NET) ou Spring State Machine (Java)?
3. **Linguagem backend** — Go (performance) ou Kotlin/Java (ecossistema)?
4. **Estratégia de captação** — bootstrap até 5 contratos OU pre-seed agressivo?
5. **Modelo de equity** — primeiros engenheiros como CLT+equity ou PJ+equity?

---

## 13. POC

> Esta seção define o que vai ser construído como POC visual/funcional, no espírito do Memora AI POC: prova as teses centrais em <60s de demo, sem queimar capital.

### O que a POC PRECISA mostrar

1. **Comprador cria demanda** com preço-alvo confidencial (visualmente "escondido")
2. **Marketplace anônimo** mostrando demanda do ponto de vista do fornecedor (sem identidade)
3. **Match → Seleção** de participantes pelo comprador
4. **Micro-leilão reverso ao vivo** — *o highlight visual*: timer, lances entrando em tempo real (simulados), soft close acionando overtime, vencedor declarado
5. **FSM do contrato visual** mostrando estado evoluindo: GERADO → ACEITO → ATIVO → ENTREGUE → CONCLUÍDO
6. **Trava Fiscal** em ação: upload XML simulado, comparação vNF × escrow, decisão automática (≤R$ 1) ou waiver
7. **Logística com prova criptográfica** (visual de mapa + foto + assinatura) e janela de 72h
8. **Split automático** no fechamento: dinheiro distribuído entre Fornecedor + Transportadora + Still
9. **Dashboard Admin** com audit log e métricas Business Heartbeat

### O que a POC NÃO faz

- KYB real (apenas mock visual com badge "ATIVO")
- Escrow real (apenas estado simulado em localStorage com cifragem demonstrativa)
- WebSocket real (lances simulados via timer no client)
- Mobile app dedicado pra transportadora (representado como tela mockada)
- Mediação de disputa (apenas estado visível, sem UI de admin avançada)
- Multi-tenant real (1 tenant fixo "Still Connect Demo")

### Stack proposta (igual ao Memora)

- **Frontend:** Vite + React + TypeScript + Tailwind
- **Backend de referência (no repo, não deployado):** Express + node:sqlite + TypeScript
- **Demo deployada:** modo client-side com localStorage + Web Crypto API (mesmo padrão do Memora AI POC)
- **Hospedagem:** GitHub Pages com deploy automático via Actions
- **Tour guiado de 60s:** mesmo padrão do Memora — sequência narrada com pause/skip/exit

### Telas-chave

1. **Home** — pitch + botão "Iniciar tour de 60s"
2. **Painel do Comprador** — minhas demandas + criar nova
3. **Criar Demanda** — form com 6 campos, preço-alvo destacado como confidencial
4. **Marketplace (visão do Fornecedor)** — lista anonimizada de demandas + botão "Dar match"
5. **Sala de Seleção** — comprador vê interessados, escolhe quem entra no leilão
6. **Sala de Leilão Ao Vivo** — timer regressivo, ranking de lances, soft close com overtime, "VOCÊ VENCEU"
7. **Contrato + FSM Visual** — estados marcando ativos como timeline interativa
8. **Escrow + Trava Fiscal** — visual de cofre + upload de XML simulado + comparação
9. **Tracking de Entrega** — mapa simulado + prova criptográfica + janela de 72h
10. **Dashboard Admin** — métricas + audit log + Business Heartbeat alertas

### Tour de 60s

Sequência narrada:
- (3s) Tour de 60s — Still Connect: infraestrutura de mercado de aço
- (5s) Comprador cria demanda — preço-alvo confidencial
- (4s) Marketplace anonimizado — fornecedores não sabem o nome do comprador
- (4s) Match + seleção — comprador escolhe baseado em score
- **(10s) Leilão ao vivo — soft close acionando overtime** *(highlight)*
- (5s) Contrato gerado — FSM visual mostrando lifecycle
- (5s) Escrow + Trava Fiscal — vNF batendo com R$ 0,30 de diferença → aprova
- (6s) Logística — caminhão sai, prova criptográfica chega
- (5s) Janela de 72h — silêncio = aceite — split automático
- (5s) Dashboard final — GMV, audit log, "Vamos conversar?"

Total: ~52s reais + ~5s de waits = **~57s** dentro da promessa.

### Critério de sucesso da POC

Investidor abre o link, clica "Iniciar tour", **em 60 segundos sai entendendo:**
- O QUE: micro-leilão reverso com escrow para aço
- POR QUE: spread + risco financeiro + logística opaca
- COMO: FSM rigorosa + trava fiscal + prova criptográfica
- O DIFERENCIAL: o sistema é a fonte da verdade — não é "marketplace"

Se em 60s ele não consegue articular uma dessas 4, a POC falhou e voltamos pra design.

---

*Documento vivo. Atualizar a cada ciclo de aprendizado (mensal).*

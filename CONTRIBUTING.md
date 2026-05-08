# Contribuição — Steel Connect / repositórios lochesystem

## Regra geral: `main` só por pull request

Alterações à branch **`main`** devem entrar **sempre por pull request** (`merge` no GitHub), não por **push directo** de commits para `main`.

Fluxo sugerido:

1. `git checkout main && git pull origin main`
2. `git checkout -b tipo/resumo-curto` (ex.: `feat/nf-parser`, `fix/health-timeout`)
3. Commits com mensagens claras (`feat:`, `fix:`, `docs:`, `test:`, …).
4. `git push -u origin tipo/resumo-curto`
5. Abrir **Pull Request** para `main`: título objetivo + descrição (contexto, o que mudou, como validar).
6. **Merge** apenas com CI verde e, se configurado, revisões obrigatórias.

---

## Proteger `main` no GitHub (bloquear push directo)

### Limitação de plano (repos privados em organização Free)

Se ao usar a API aparecer erro **403** com mensagem a pedir **GitHub Pro**, **Team** ou repo **público**, o GitHub está a limitar **branch protection** / **rulesets** no teu plano actual. Nesse caso:

- rever **Billing** da organização em GitHub, ou
- subscrever **GitHub Team** para a org (ou equivalente), ou
- tornar o repositório **público** (se for aceitável para o produto).

Enquanto não houver protecção activa no servidor, a disciplina **push só por PR** depende da equipa seguir este documento.

### Configuração manual na interface (quando o GitHub permitir)

Para **cada** repositório (`steelconnect-api`, `steelconnect-web`, `steelconnect-infra`, `stillconnect-poc`, …):

1. No GitHub: **Settings** → **Branches** → **Add branch protection rule** (ou **Rules** / **Rulesets**, conforme a UI).
2. **Branch name pattern:** `main`
3. Activa, no mínimo:
   - **Require a pull request before merging**
   - **Require approvals** — opcional; define **0** aprovações se quiseres apenas impedir push directo sem obrigar outra pessoa a rever (quando disponível).
   - **Do not allow bypassing the above settings** — opcional (até administradores passam a usar PR).
   - **Do not allow force pushes**
   - **Do not allow deletions**
4. Opcional mas recomendado: **Require status checks to pass before merging** → seleccionar o workflow de CI (ex.: job `build` / `CI`).

Guardar a regra e repetir nos outros repositórios com o mesmo critério.

---

## Referência: API (requer plano + permissões de admin)

Quando o plano permitir, podes automatizar com `gh api` e o endpoint [Update branch protection](https://docs.github.com/en/rest/branches/branch-protection). O JSON tem de espelhar os campos obrigatórios da documentação; tokens precisam de âmbito adequado e papel de **admin** no repositório.

---

## Índice de repositórios Steel Connect

| Repositório | Papel |
|-------------|--------|
| [steelconnect-api](https://github.com/lochesystem/steelconnect-api) | Backend |
| [steelconnect-web](https://github.com/lochesystem/steelconnect-web) | Frontend |
| [steelconnect-infra](https://github.com/lochesystem/steelconnect-infra) | OpenTofu / IaC |
| [stillconnect-poc](https://github.com/lochesystem/stillconnect-poc) | POC + documentação de produto / MVP |

# Deploy do frontend na Vercel — BiblioGest

Este projeto usa a Vercel para publicar o **frontend React/Vite**. A API
Express e o PostgreSQL devem estar publicados em outro serviço acessível pela
internet (por exemplo, Render, Railway, Neon ou um servidor próprio).

> A Vercel não consegue acessar `localhost:5433` da máquina de desenvolvimento.
> Portanto, não publique `DATABASE_URL`, `JWT_SECRET` nem a senha do banco nas
> variáveis da Vercel neste modelo de deploy.

## Antes de começar

Tenha a API já publicada e funcionando. Abra no navegador ou execute:

```bash
curl https://URL-DA-API/health
```

O resultado esperado é um JSON com `"status":"OK"`. A URL usada no restante
deste guia será, por exemplo, `https://bibliogest-api.onrender.com`.

No ambiente da API, configure pelo menos:

```env
NODE_ENV=production
DATABASE_URL=postgresql://... # banco PostgreSQL público, com SSL quando exigido
JWT_SECRET=uma-chave-aleatoria-longa-e-exclusiva
CORS_ORIGIN=https://SEU-PROJETO.vercel.app
```

Inclua no `CORS_ORIGIN` também qualquer domínio personalizado, separando os
valores por vírgula. Execute as migrações Prisma no ambiente da API antes do
primeiro acesso.

## Configurar o projeto na Vercel

1. Envie o `vercel.json` para a branch que será publicada:

   ```bash
   git add vercel.json frontend/.env.example docs/DEPLOY_VERCEL.md
   git commit -m "configura deploy do frontend na Vercel"
   git push origin main
   ```

2. Na [Vercel](https://vercel.com/new), importe o repositório do BiblioGest.
   Se o projeto já existe, abra **Settings → General**.

3. Em **Root Directory**, deixe o valor **vazio** (raiz do repositório). Remova
   `backend` ou `frontend` se algum deles estiver configurado.

4. Em **Build and Deployment Settings**, escolha **Vite** como *Framework
   Preset*. Não sobrescreva os comandos de instalação, build ou diretório de
   saída: o [vercel.json](../vercel.json) já define estes valores:

   - instalação: `npm ci --prefix frontend`;
   - build: `npm run build --prefix frontend`;
   - saída: `frontend/dist`.

5. Em **Settings → Environment Variables**, crie a variável abaixo para os
   ambientes **Production** (e **Preview**, se quiser testar previews):

   ```env
   VITE_API_URL=https://bibliogest-api.onrender.com/api
   ```

   Troque a URL pelo endereço real da sua API. Mantenha o sufixo `/api`.
   Variáveis `VITE_*` são incorporadas ao JavaScript durante o build, portanto
   alterar esse valor exige um novo deploy.

6. Clique em **Deploy** ou use **Redeploy** após salvar a variável.

## Conferência após o deploy

1. Abra `https://SEU-PROJETO.vercel.app/`. A tela de login deve carregar sem o
   erro `FUNCTION_INVOCATION_FAILED`.
2. No DevTools do navegador, faça login e confirme que as requisições vão para
   `https://bibliogest-api.onrender.com/api/...`, e não para `/api` na Vercel.
3. Se o login retornar erro de CORS, adicione a URL exata da Vercel ao
   `CORS_ORIGIN` da API e reinicie/reimplante a API.

## Solução de problemas

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| `FUNCTION_INVOCATION_FAILED` ao abrir `/` | O projeto está apontando para `backend` ou tentando executar o Express na Vercel. | Deixe **Root Directory** vazio, confirme o `vercel.json` na branch publicada e faça Redeploy. |
| Página abre, mas as chamadas retornam `404 /api/...` | `VITE_API_URL` não foi definido no build. | Defina a URL pública da API com o sufixo `/api` e faça Redeploy. |
| Erro de CORS no login | A origem da Vercel não foi autorizada pelo backend. | Inclua `https://SEU-PROJETO.vercel.app` em `CORS_ORIGIN` e reimplante a API. |
| Erro de conexão com o banco | A API usa uma URL local ou o banco não está acessível. | Configure `DATABASE_URL` no host da API com um PostgreSQL público; nunca use `localhost` da máquina local. |

Para uma instalação unificada (frontend, API e banco no mesmo serviço), use o
guia [DEPLOY_RENDER.md](DEPLOY_RENDER.md) em vez deste fluxo.

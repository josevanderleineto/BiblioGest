# Deploy completo na Vercel — BiblioGest

Este repositório publica o frontend React e o backend Express no **mesmo
domínio Vercel**:

```text
https://SEU-PROJETO.vercel.app/       → frontend
https://SEU-PROJETO.vercel.app/api/*  → API Express
```

O PostgreSQL continua sendo um serviço gerenciado externo. A Vercel não pode
acessar `localhost:5433` da sua máquina.

## 1. Criar e conectar o banco PostgreSQL

Crie um banco PostgreSQL na Vercel Storage (Prisma Postgres), Neon, Supabase,
Railway ou outro provedor. Copie a string de conexão pública com SSL, por
exemplo:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/bibliogest?sslmode=require
```

Para cargas maiores, prefira a URL com *pooling* fornecida pelo provedor. A
variável é secreta e nunca deve começar com `VITE_`.

## 2. Configurar o projeto Vercel

1. Importe o repositório na [Vercel](https://vercel.com/new), ou abra o projeto
   existente em **Settings → General**.
2. Em **Root Directory**, deixe o campo **vazio**. Não selecione `backend` nem
   `frontend`.
3. Em **Build and Deployment Settings**, use o preset **Vite** e não sobrescreva
   os comandos. O [vercel.json](../vercel.json) instala as duas aplicações,
   gera o Prisma Client, aplica as migrações, prepara os dados iniciais e gera
   o frontend.
4. Em **Settings → Environment Variables**, adicione estas variáveis para
   **Production**:

   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/bibliogest?sslmode=require
   JWT_SECRET=gere-uma-chave-aleatoria-com-no-minimo-32-caracteres
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://SEU-PROJETO.vercel.app
   DEFAULT_ADMIN_USERNAME=admin
   DEFAULT_ADMIN_PASSWORD=defina-uma-senha-forte-e-exclusiva
   VITE_API_URL=/api
   TURNSTILE_SECRET_KEY=chave-secreta-do-cloudflare-turnstile
   VITE_TURNSTILE_SITE_KEY=chave-publica-do-cloudflare-turnstile
   ```

   `VITE_API_URL=/api` é o ponto que mantém frontend e backend no mesmo link.
   Não cadastre `PORT`: a Vercel controla a execução das Functions.
   As variáveis iniciadas por `VITE_` entram no JavaScript no momento do build:
   após incluir ou alterar `VITE_TURNSTILE_SITE_KEY`, é obrigatório fazer um
   novo deploy (não apenas salvar a variável).

## 3. Proteger o login contra bots (Cloudflare Turnstile)

1. No painel do [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile),
   crie um widget e autorize o hostname `biblio-gest.vercel.app` (e seu domínio
   personalizado, se houver).
2. Copie a **Sitekey** para `VITE_TURNSTILE_SITE_KEY` e a **Secret key** para
   `TURNSTILE_SECRET_KEY` nas variáveis de Production da Vercel.
3. Faça um novo deploy. A chave pública é exibida no navegador; a chave secreta
   fica somente na Function e valida cada token no Cloudflare.

Abra `https://SEU-PROJETO.vercel.app/api/health` após publicar. O campo
`turnstileConfigured` precisa estar como `true`. Se estiver `false`, o login
não terá CAPTCHA; confira se as duas chaves estão em **Production** e se o
hostname do widget é exatamente o domínio da Vercel.

Além do Turnstile, a rota de login já limita tentativas por cliente e usa um
campo honeypot. Sem `TURNSTILE_SECRET_KEY`, o widget fica desativado; em
produção, mantenha as duas chaves configuradas.

4. Clique em **Deploy**. O comando de build executa `prisma migrate deploy` e
   o seed inicial. O seed é seguro para novos deploys: ele não altera um banco
   que já tenha usuários cadastrados.

## 4. Conferir o resultado

Após o deploy, abra:

```text
https://SEU-PROJETO.vercel.app/
https://SEU-PROJETO.vercel.app/api/health
```

O endpoint `/api/health` deve retornar `{"status":"OK"}`. As chamadas do
frontend para `/api/...` permanecem no mesmo domínio, sem URL externa e sem
configuração CORS adicional no navegador.

### Administrador já criado, mas a senha não funciona

`DEFAULT_ADMIN_PASSWORD` é usado somente na primeira criação da conta. Alterar
essa variável depois que o banco já possui usuários **não troca** a senha
existente. Para redefini-la, conecte o terminal ao mesmo `DATABASE_URL` da
produção, defina o `DEFAULT_ADMIN_USERNAME` e a nova `DEFAULT_ADMIN_PASSWORD`
nesse ambiente e execute `npm run admin:reset-password`. O próximo login
exigirá que o administrador escolha uma senha própria.

## Atualizar um projeto já criado

1. Confirme que a branch `main` contém `api/index.ts`, `api/[...path].ts` e
   `vercel.json`.
2. Altere **Root Directory** para vazio.
3. Cadastre as variáveis acima e faça **Redeploy** com a opção de limpar o cache
   de build, se disponível.

## Solução de problemas

| Sintoma | Correção |
| --- | --- |
| `FUNCTION_INVOCATION_FAILED` em `/` | Confirme Root Directory vazio, a presença de `vercel.json` na branch publicada e faça Redeploy. |
| Falha no build em `prisma migrate deploy` | Corrija `DATABASE_URL`; ela deve apontar para o PostgreSQL remoto com SSL. |
| `401` ou erro ao autenticar | Defina `JWT_SECRET` e `DEFAULT_ADMIN_*` nas variáveis de Production. |
| API retorna `500` | Abra os logs da Function `/api/[...path]` na Vercel e confirme que o banco remoto está acessível. |
| A página abre, mas a rota React dá `404` | Confirme que `vercel.json` tem o fallback SPA e faça novo deploy. |

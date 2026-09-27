# Guia de Hospedagem do Frontend na Vercel — BiblioGest

O frontend do **BiblioGest** pode ser hospedado de forma independente na Vercel enquanto a API backend roda no Render ou servidor próprio.

---

## Configuração na Vercel

O repositório já contém um `vercel.json` que faz o deploy **somente do frontend
Vite**. Isso evita que a Vercel tente iniciar o Express como uma Function na
rota `/`.

1. Acesse [vercel.com](https://vercel.com) e crie ou ajuste o projeto para usar
   a **raiz do repositório** (deixe *Root Directory* vazio). Não use `backend`
   como raiz neste projeto.
2. Em **Build & Output Settings**:
   - Framework Preset: **Vite**
   - Build Command: deixe a configuração do repositório prevalecer
     (`npm run build --prefix frontend`)
   - Output Directory: deixe a configuração do repositório prevalecer
     (`frontend/dist`)

3. Em **Settings → Environment Variables**, adicione para **Production**:
   ```env
   VITE_API_URL=https://api-bibliogest.seu-servidor.com/api
   ```
   Use a URL pública real do backend (Render ou outro servidor). Não use
   `localhost`, pois ele apontaria para a própria infraestrutura da Vercel.

4. No ambiente do backend, configure `CORS_ORIGIN=https://biblio-gest.vercel.app`
   (e inclua eventuais domínios personalizados), além de `DATABASE_URL` e
   `JWT_SECRET`.

5. Faça um novo deploy. A página inicial será entregue estaticamente; requisições
   de API vão para o endereço definido por `VITE_API_URL`.

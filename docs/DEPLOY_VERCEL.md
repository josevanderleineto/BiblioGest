# Guia de Hospedagem do Frontend na Vercel — BiblioGest

O frontend do **BiblioGest** pode ser hospedado de forma independente na Vercel enquanto a API backend roda no Render ou servidor próprio.

---

## Configuração na Vercel

1. Acesse [vercel.com](https://vercel.com) e crie um novo projeto importando a pasta `frontend`.
2. Em **Build & Output Settings**:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. Adicione a variável de ambiente:
   ```env
   VITE_API_URL=https://api-bibliogest.seu-servidor.com/api
   ```

4. Clique em **Deploy**.

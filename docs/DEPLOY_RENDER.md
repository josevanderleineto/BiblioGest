# Guia de Implantação no Render (Cloud Deploy) — BiblioGest

Este guia detalha o processo de implantação do sistema BiblioGest na plataforma **Render** utilizando o Blueprint `render.yaml`.

---

## Fluxo de Implantação

```text
GitHub Repo  ──>  Render Web Service (Backend)  ──>  PostgreSQL Database
                       │
                       └──>  Render Static Site (Frontend)
```

## Passo a Passo

### 1. Enviar o Código para o GitHub
Certifique-se de que seu repositório contém o arquivo `render.yaml` na raiz.

### 2. Criar Novo Blueprint no Render
1. Acesse o painel do Render ([dashboard.render.com](https://dashboard.render.com)).
2. Clique em **New +** e selecione **Blueprint**.
3. Conecte sua conta do GitHub e selecione o repositório `bibliogest`.

### 3. Configurar Variáveis de Ambiente
O `render.yaml` provisiona automaticamente:
- Banco PostgreSQL gerenciado `bibliogest-db`.
- Serviço Backend Node.js `bibliogest-backend` com migrações Prisma e porta `3000`.
- Serviço Frontend estático `bibliogest-frontend` configurado para redirecionar chamadas de API.

Variáveis criadas automaticamente:
- `DATABASE_URL`: String de conexão fornecida pelo PostgreSQL no Render.
- `JWT_SECRET`: Gerado aleatoriamente pelo Render.
- `DEFAULT_ADMIN_USERNAME`: defina o nome do administrador inicial.
- `DEFAULT_ADMIN_PASSWORD`: defina uma senha forte e exclusiva.

### 4. Primeiro Acesso em Produção
1. Acesse a URL gerada para o frontend do BiblioGest.
2. Faça login com as credenciais configuradas nas variáveis de ambiente.
3. Altere imediatamente a senha inicial exigida pelo sistema.

# BiblioGest — Sistema Integrado de Gestão e Automação de Bibliotecas

O **BiblioGest** é um sistema completo, moderno e de alta performance para automação e gestão de bibliotecas, inspirado funcionalmente no **Koha**, porém projetado com arquitetura contemporânea e interface responsiva, intuitiva e acessível.

---

## 🚀 Principais Funcionalidades

- **OPAC (Catálogo Público)**: Interface moderna em `/opac` com busca rápida, suporte a filtros de disponibilidade, assunto, autor, classificação CDD/CDU e resumo de dados MARC.
- **Catalogação Bibliográfica MARC21 & RDA**: Editor MARC21 interativo com tags repetíveis, indicadores, subcampos, validação ao vivo e templates pré-configurados (Livro, Periódico, TCC, Audiovisual, Obra Rara).
- **Classificação & Cutter**: Notação Decimal Dewey (CDD) e Universal (CDU), com gerador automático de Número de Chamada (CDD/CDU + Cutter-Sanborn + Ano).
- **Circulação Rápida**: Empréstimos, devoluções, renovações e reservas com suporte nativo a leitor de código de barras.
- **Regras de Empréstimo Flexíveis**: Matriz configurável de regras por Categoria de Patrono (Aluno, Professor, Servidor, Pesquisador) x Tipo de Material.
- **Multas & Pendências**: Cálculo automático de multas por dias de atraso com período de carência e histórico de quitação.
- **Usuários & Permissões (RBAC)**: Autenticação JWT com controle de acesso baseado em funções (Administrador, Bibliotecário, Auxiliar, Catalogador).
- **Troca de Senha Obrigatória**: Força alteração da credencial padrão inicial no primeiro login (`admin`/`admin`).
- **Banco de Dados Flexível & Autogerado**:
  - **Local**: Criação, migração e semeadura automática do banco de dados no boot.
  - **Nuvem**: Conexão simples com provedores de nuvem (Neon, Supabase, Render, Railway, AWS RDS).
  - **Zero-Config (SQLite)**: Opção para execução local sem necessidade de instalar o PostgreSQL.
- **Deploy Unificado (Front + Back Juntos)**: O servidor Express serve a compilação do React na mesma porta `3000`, simplificando a hospedagem em 1 único serviço.
- **Aplicativo Desktop Launcher**: Aplicativo instalável para Windows (`BiblioGest-Setup.exe`) e macOS para execução local em 1 clique.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias Utilizadas |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Context API |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Banco de Dados** | PostgreSQL (Local / Nuvem) ou SQLite (Arquivo local) |
| **Desktop Launcher**| Electron / Node |
| **Containers & Nuvem** | Docker, Docker Compose, Render (`render.yaml`), Vercel |

---

## 💻 Como Iniciar Localmente (Instalação Rápida com 1 Comando)

### Pré-requisitos
- Node.js v18+ ou v20+

### Passo 1: Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

### Passo 2: Executar o Setup Automático
Este comando instala as dependências, gera o cliente do Prisma e compila o projeto completo:
```bash
npm run setup
```

### Passo 3: Iniciar o Sistema Unificado
```bash
npm run start
```

Acesse a aplicação no navegador em: `http://localhost:3000`.

> **Nota**: Na primeira execução, o BiblioGest detectará o banco de dados e executará a criação das tabelas e a inserção dos dados iniciais (Seed) automaticamente!

---

## 🗄️ Configuração do Banco de Dados (Local vs Nuvem)

Abra o arquivo `.env` e configure conforme sua preferência:

### Opção A: PostgreSQL Local (Recomendado)
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/bibliogest?schema=public"
```

### Opção B: Banco de Dados na Nuvem (Neon, Supabase, Render, Railway)
Basta colar a string de conexão fornecida pelo seu provedor de nuvem:
```env
DATABASE_URL="postgresql://usuario:senha@ep-exemplo.us-east-2.aws.neon.tech/bibliogest?sslmode=require"
```

### Opção C: SQLite Local (Zero Instalação - Sem PostgreSQL)
Para rodar instantaneamente sem instalar nenhum servidor de banco de dados:
```env
DATABASE_URL="file:../database/bibliogest.db"
```

---

## 🌐 Deploy Unificado (Frontend + Backend Juntos)

O BiblioGest foi preparado para deploy completo do Frontend e Backend em **1 único serviço/servidor**.

### Deploy no Render (1-Clique via Blueprint)
1. Faça um push do projeto para o GitHub.
2. No painel do Render, escolha **New +** -> **Blueprint**.
3. Conecte o repositório. O Render lerá o arquivo `render.yaml` e criará automaticamente:
   - 1 Web Service Unificado (`bibliogest-app`) servindo o Front e o Back na mesma URL.
   - 1 Banco de Dados PostgreSQL gerenciado na nuvem.

### Deploy com Docker (Container Único)
Para subir o banco de dados + aplicação unificada via Docker Compose:
```bash
docker compose up --build
```
Acesse em: `http://localhost:3000`.

---

## 🔐 Credenciais Iniciais de Acesso

Defina `DEFAULT_ADMIN_USERNAME` e `DEFAULT_ADMIN_PASSWORD` no `.env` antes da primeira inicialização. O seed cria o administrador com esses valores e exige a troca da senha no primeiro acesso.

Se o banco já foi inicializado e você alterou a variável de senha, aplique-a sem apagar os dados:

```bash
npm run admin:reset-password
```

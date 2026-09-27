# Arquitetura de Segurança & Permissões RBAC — BiblioGest

## 1. Criptografia & Hash de Senhas
- Nenhuma senha é armazenada em texto puro no banco de dados.
- Utilização de algoritmo **bcrypt** com fator de custo `10`.

## 2. Autenticação JWT
- Tokens JWT assinados com `JWT_SECRET` com tempo de expiração configurável (`JWT_EXPIRES_IN=7d`).

## 3. Proteção do Login contra Automação
- Limite de tentativas por endereço IP, configurável por `LOGIN_RATE_LIMIT_WINDOW_MS` e `LOGIN_RATE_LIMIT_MAX`.
- Campo honeypot invisível para bloquear submissões automatizadas simples.
- Cloudflare Turnstile validado no servidor antes da autenticação, quando
  `TURNSTILE_SECRET_KEY` está configurada. A chave pública correspondente deve
  ser definida no frontend como `VITE_TURNSTILE_SITE_KEY`.
- Tokens Turnstile são validados no servidor e renovados após uma tentativa de
  login falha, pois cada token só pode ser usado uma vez.

## 4. Troca Obrigatória de Senha no Primeiro Acesso
- O administrador inicial usa `DEFAULT_ADMIN_USERNAME` e `DEFAULT_ADMIN_PASSWORD` do `.env` e é criado com a flag `mustChangePassword = true`.
- Após o login, o sistema exige uma nova senha segura antes de liberar os demais recursos.

## 5. Permissões RBAC (Role-Based Access Control)
Códigos de permissão gerenciáveis:
- `users.view`, `users.create`, `users.edit`, `users.delete`
- `catalog.view`, `catalog.create`, `catalog.edit`, `catalog.delete`
- `circulation.checkout`, `circulation.return`, `circulation.renew`
- `reports.view`, `settings.view`, `settings.edit`
- `database.backup`, `database.restore`

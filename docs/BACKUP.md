# Procedimento de Backup e Restauração — BiblioGest

## 1. Como Gerar um Backup
1. Acesse o menu **Banco de Dados & Backup**.
2. Clique no botão **Gerar Backup**.
3. O sistema baixará um arquivo rotulado `bibliogest_backup_[TIMESTAMP].json` contendo todas as tabelas (obras, exemplares, patronos, empréstimos, multas, regras e configurações).

---

## 2. Como Restaurar um Backup
1. No menu **Banco de Dados & Backup**, localize a seção **Restauração de Dados**.
2. Selecione o arquivo de backup exportado.
3. No campo de confirmação de segurança, digite exatamente a palavra:
   ```text
   RESTAURAR
   ```
4. Clique em **Executar Restauração de Dados**.

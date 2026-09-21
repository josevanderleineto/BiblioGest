# Estrutura do Banco de Dados PostgreSQL — BiblioGest

O **BiblioGest** utiliza PostgreSQL com **Prisma ORM**.

---

## Esquema das Tabelas Principais

- `users`: Usuários, bibliotecários, professores, alunos.
- `roles` & `permissions`: RBAC permissões granulares.
- `libraries`: Unidades e campi da biblioteca.
- `bibliographic_records`: Obras catalogadas (MARC21, RDA, CDD, CDU, Cutter).
- `items`: Exemplares físicos com barcode, tombo e localização de estante.
- `circulation_rules`: Regras de empréstimo (Patrono x Material -> Dias, Limite, Multa por dia).
- `loans`: Transações de empréstimo ativas e históricas.
- `fines`: Multas por devolução em atraso.
- `serials` & `serial_issues`: Periódicos e kardex de fascículos.
- `acquisitions` & `disposals`: Compras, doações e registros de descarte.
- `inventory_scans`: Leitura física de código de barras para inventário.
- `audit_logs`: Trilha de auditoria de segurança.
- `system_settings`: Parâmetros do sistema.

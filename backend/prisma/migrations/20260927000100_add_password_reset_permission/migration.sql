-- Applies the password-reset capability to installations that already have
-- users, so the regular seed (which preserves existing data) is not needed.
INSERT INTO "permissions" ("id", "code", "name", "category", "description")
VALUES (
  md5(clock_timestamp()::text || random()::text)::uuid::text,
  'users.reset_password',
  'Redefinir Senhas',
  'Usuários',
  'Permite definir uma senha temporária para contas autorizadas.'
)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT roles."id", permissions."id"
FROM "roles" AS roles
CROSS JOIN "permissions" AS permissions
WHERE roles."name" IN ('Bibliotecário', 'Auxiliar de Biblioteca')
  AND permissions."code" = 'users.reset_password'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

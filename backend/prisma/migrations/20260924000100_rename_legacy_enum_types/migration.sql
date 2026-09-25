-- Bancos criados por versões anteriores do BiblioGest usavam os nomes de
-- enum sem o prefixo BiblioGest. O Prisma atual mapeia os mesmos tipos com
-- prefixo para evitar colisões com aplicações no mesmo banco.
--
-- ALTER TYPE RENAME preserva os valores, as colunas e todos os registros.
-- Os blocos condicionais tornam a migração segura tanto para bancos antigos
-- como para instalações novas, nas quais os tipos já nascem com o nome atual.
DO $$
BEGIN
  IF to_regtype('public."PatronCategory"') IS NOT NULL AND to_regtype('public."BiblioGestPatronCategory"') IS NULL THEN
    ALTER TYPE "PatronCategory" RENAME TO "BiblioGestPatronCategory";
  END IF;
  IF to_regtype('public."MaterialType"') IS NOT NULL AND to_regtype('public."BiblioGestMaterialType"') IS NULL THEN
    ALTER TYPE "MaterialType" RENAME TO "BiblioGestMaterialType";
  END IF;
  IF to_regtype('public."ItemStatus"') IS NOT NULL AND to_regtype('public."BiblioGestItemStatus"') IS NULL THEN
    ALTER TYPE "ItemStatus" RENAME TO "BiblioGestItemStatus";
  END IF;
  IF to_regtype('public."LoanStatus"') IS NOT NULL AND to_regtype('public."BiblioGestLoanStatus"') IS NULL THEN
    ALTER TYPE "LoanStatus" RENAME TO "BiblioGestLoanStatus";
  END IF;
  IF to_regtype('public."ReservationStatus"') IS NOT NULL AND to_regtype('public."BiblioGestReservationStatus"') IS NULL THEN
    ALTER TYPE "ReservationStatus" RENAME TO "BiblioGestReservationStatus";
  END IF;
  IF to_regtype('public."FineStatus"') IS NOT NULL AND to_regtype('public."BiblioGestFineStatus"') IS NULL THEN
    ALTER TYPE "FineStatus" RENAME TO "BiblioGestFineStatus";
  END IF;
  IF to_regtype('public."AuthorityType"') IS NOT NULL AND to_regtype('public."BiblioGestAuthorityType"') IS NULL THEN
    ALTER TYPE "AuthorityType" RENAME TO "BiblioGestAuthorityType";
  END IF;
END $$;

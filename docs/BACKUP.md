# Procedimento de Backup e Restauração — BiblioGest

## 1. Como Gerar um Backup
1. Acesse o menu **Banco de Dados & Backup**.
2. Em **Backup do acervo catalogado**, clique em **Baixar planilha**.
3. O sistema baixará `bibliogest_acervo_[TIMESTAMP].xlsx`, contendo as obras catalogadas, campos MARC21/RDA, autoridades, exemplares, bibliotecas e periódicos. Ele não contém senhas, usuários, empréstimos ou logs.

Na aba **Acervo**, cada linha reúne a ficha bibliográfica e o exemplar. Na aba **MARC21**, todos os campos preenchidos são preservados em linhas próprias, com tag, indicadores, subcampo e valor. Assim a planilha pode ser conferida, arquivada e mapeada por outro sistema sem perder os dados catalogados.

## Migração para outro sistema ou biblioteca

- Para outro sistema de biblioteca, baixe **MARC21 (.mrc)**. Ele usa MARC21 ISO 2709, o formato padrão de intercâmbio bibliográfico.
- Para outro BiblioGest, baixe **Importar no BiblioGest** e envie esse arquivo JSON técnico na seção **Importação de catálogo BiblioGest** do destino. É possível selecionar a biblioteca de destino para os exemplares importados.
- A **Planilha** é a cópia legível para conferência e guarda. Ela não substitui o arquivo de importação nem o MARC21.

Para uma recuperação integral da instalação do BiblioGest, use **Backup completo do sistema**. Esse arquivo também leva usuários, permissões, circulação, configurações e auditoria.

---

## 2. Como Restaurar um Backup
1. No menu **Banco de Dados & Backup**, localize a seção **Restauração de Dados**.
2. Selecione o arquivo de backup exportado.
3. No campo de confirmação de segurança, digite exatamente a palavra:
   ```text
   RESTAURAR
   ```
4. Clique em **Executar Restauração de Dados**.

> A restauração substitui os dados do esquema atual do BiblioGest pelo conteúdo do backup. Antes de continuar, gere e guarde uma cópia recente. Para incorporar somente um acervo sem apagar dados já existentes, use a importação colaborativa.

---

## 3. Importação colaborativa

Para incorporar dados recebidos de outra unidade sem apagar o acervo local, selecione o arquivo JSON na seção **Importação colaborativa** e clique em **Importar sem substituir**. Registros que já existam são preservados.

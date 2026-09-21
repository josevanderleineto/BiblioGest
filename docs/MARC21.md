# Manual de Catalogação MARC21 & RDA — BiblioGest

O **BiblioGest** implementa o padrão **MARC21 Bibliográfico** com suporte a elementos **RDA (Resource Description and Access)**.

---

## Estrutura de Campos MARC21 Principais

| Tag | Descrição | Indicadores | Subcampos Comuns |
| :--- | :--- | :--- | :--- |
| **001** | Número de Controle | `# #` | `$a` Número de controle do registro |
| **008** | Elementos de Tamanho Fixo | `# #` | Dados codificados de país, idioma e data |
| **020** | ISBN | `# #` | `$a` Número do ISBN |
| **022** | ISSN | `# #` | `$a` Número do ISSN (periódicos) |
| **100** | Autor Principal (Pessoa) | `1 #` | `$a` Sobrenome, Nome, `$e` termo de relação (autor, ilustrador) |
| **245** | Título Principal | `1 0` | `$a` Título, `$b` subtítulo, `$c` indicação de responsabilidade |
| **250** | Edição | `# #` | `$a` Indicação de edição |
| **260 / 264** | Publicação / Distribuição | `# #` | `$a` Lugar, `$b` editora, `$c` data de publicação |
| **300** | Descrição Física | `# #` | `$a` Extensão (páginas), `$b` detalhes ilustrativos, `$c` dimensão (cm) |
| **490** | Indicação de Série | `1 #` | `$a` Título da série, `$v` volume |
| **500** | Nota Geral | `# #` | `$a` Texto da nota |
| **650** | Assunto (Termo de Tópico) | `# 4` | `$a` Cabeçalho de assunto |
| **700** | Autor Secundário | `1 #` | `$a` Nome do coautor ou colaborador |
| **830** | Título Uniforme de Série | `# 0` | `$a` Título da série |

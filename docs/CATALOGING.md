# Regras de Classificação CDD, CDU e Cutter — BiblioGest

## 1. Classificação Decimal de Dewey (CDD)
A CDD divide o conhecimento em 10 grandes classes (000 a 900):
- **000**: Ciência da Computação, Informação e Obras Gerais
- **100**: Filosofia e Psicologia
- **200**: Religião
- **300**: Ciências Sociais
- **400**: Línguas
- **500**: Ciências Naturais e Matemática
- **600**: Tecnologia e Ciências Aplicadas
- **700**: Artes e Recreação
- **800**: Literatura
- **900**: História e Geografia

---

## 2. Geração Automática do Número de Chamada
O BiblioGest calcula o Número de Chamada pela fórmula:

$$\text{Número de Chamada} = \text{CDD/CDU} + \text{Cutter-Sanborn} + \text{Ano}$$

Exemplo:
- Classificação CDD: `005.133`
- Autor: `Silva, Edson` -> Cutter: `S586i`
- Ano: `2026`
- **Resultado Final**: `005.133 S586i 2026`

# CKD - Gerador SEPA / GiroCode v2

Este projeto cria QR Codes EPC/SEPA/GiroCode para oferta de coleta da CKD.

## Modos

### Usuário
- Escolhe a congregação/referência.
- Baixa o QR Code PNG.
- Copia IBAN/BIC.

### Administrador
- Altera prefixo da referência.
- Altera beneficiário, IBAN, BIC.
- Altera tamanho do logo.
- Altera lista de congregações.
- Exporta um novo arquivo `config.js`.

## Publicar no Netlify

1. Acesse https://app.netlify.com/drop
2. Arraste a pasta do projeto ou o ZIP extraído.
3. O Netlify criará um link público automaticamente.

## Publicar no GitHub Pages

1. Crie um repositório público no GitHub.
2. Envie todos os arquivos: `index.html`, `style.css`, `app.js`, `config.js`, `logo.png`.
3. Vá em Settings > Pages.
4. Source: Deploy from a branch.
5. Branch: main, folder: root.
6. Salve e aguarde o link.

## Compatibilidade

O conteúdo do QR segue o formato EPC/SEPA/GiroCode:
BCD, versão 002, charset 1, SCT, BIC, nome, IBAN e referência.
Teste no app bancário antes de imprimir em grande quantidade.

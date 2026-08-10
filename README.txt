CKD SEPA GiroCode v6.3 — Compatibilidade e Diagnóstico EPC

Beneficiário legal:
Christliche Kongregation in Deutschland e.V.

Mudanças:
- O QR EPC continua usando sempre o nome legal completo.
- O texto é normalizado em Unicode NFC.
- Novo botão "Ver conteúdo EPC".
- Esse botão mostra exatamente o texto gravado no QR antes de escanear.
- O layout e as placas A5/A4 não foram alterados.

Teste:
1. Substitua index.html, logo.png e README.txt no GitHub.
2. Aguarde a publicação.
3. Confirme no rodapé: v6.3 compatibilidade.
4. Gere um QR novo.
5. Clique em "Ver conteúdo EPC".
6. Confira a linha:
   Christliche Kongregation in Deutschland e.V.
7. Teste o mesmo QR no N26 e no Commerzbank.

Se o conteúdo EPC mostrar o nome completo e o Commerzbank continuar truncando,
o problema está no fluxo de leitura/importação do app do banco.

ADM:
Clique 5 vezes no logo.
Senha padrão: CKD2025.

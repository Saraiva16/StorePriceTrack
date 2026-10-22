---
trigger: always_on
description: Regra obrigatória de testes de renderização após alterações no frontend
---

# Regra de Testes e Renderização no Frontend

Sempre que modificar ou criar qualquer arquivo no frontend (componentes JSX, páginas, estilos CSS, hooks ou serviços):
1. **Obrigatoriedade de Teste de Renderização (`npm test`):**
   - Execute sempre `npm test` no diretório `frontend` para garantir que os componentes e páginas montam no DOM e executam seu ciclo de vida sem erros de tempo de execução (`ReferenceError`, `Cannot read properties of undefined`, quebras de hooks ou sintaxe).
2. **Insuficiência do Build Estático:**
   - O comando `npm run build` faz apenas análise estática e empacotamento, não garantindo que o código JSX e os componentes montem sem erros no navegador. Nunca considere a tarefa frontend concluída sem a execução e aprovação dos testes de renderização.

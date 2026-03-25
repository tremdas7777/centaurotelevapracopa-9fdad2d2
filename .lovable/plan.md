

## Plano: Mostrar mais do banner dos jogadores apenas no desktop

### O que será feito
Na home, o banner dos jogadores atualmente tem altura `h-40 md:h-64`. Vamos aumentar a altura apenas para desktop (breakpoint `lg` ou `xl`), mantendo mobile e tablet iguais.

### Alteração técnica

**Arquivo:** `src/pages/QuizHome.tsx` (linha 173)

Alterar a classe do container do banner de:
```
h-40 md:h-64
```
Para:
```
h-40 md:h-64 lg:h-80
```

Isso adiciona mais altura ao banner apenas em telas ≥1024px (desktop), mantendo mobile (`h-40` = 160px) e tablet (`md:h-64` = 256px) inalterados.


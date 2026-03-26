

## Plan: Remove ball image from loading screen

The user wants to undo the ball image addition on the "Verificando Resultado" loading screen and revert to the original emoji.

### Changes

**`src/components/LoadingAnimation.tsx`**
- Remove the `import bolaCopa` line
- Replace the `<img>` tag (lines ~62-64) with the original `⚽` emoji text, keeping the pulse animation div


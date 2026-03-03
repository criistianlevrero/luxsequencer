# Onboarding de Repos Marketplace

Guía mínima para crear y publicar un nuevo repositorio de herramientas/renderers en la estructura multi-repo:

## 1) Estructura esperada

Base local:

```text
luxsequencer/
├── luxsequencer-core/
└── marketplace-repos/
    ├── core-renderers/
    └── <nuevo-repo>/
```

## 2) Crear repositorio local

Desde la carpeta base (`luxsequencer/`):

```bash
mkdir -p marketplace-repos/<nuevo-repo>
cd marketplace-repos/<nuevo-repo>
git init
```

## 3) Scaffold mínimo recomendado

- `package.json` (nombre/version/scripts)
- `README.md` (qué incluye y cómo validar)
- `src/catalog.json` (índice de herramientas)
- `src/**` (manifests, workers, shared)
- `scripts/validate-catalog.mjs`

## 4) Commit inicial

```bash
git add .
git commit -m "feat(repo): initial marketplace package"
git branch -M main
```

## 5) Conectar remoto y publicar

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

## 6) Tag beta inicial

```bash
git tag -a v0.1.0-beta.1 -m "Initial beta marketplace release"
git push origin v0.1.0-beta.1
```

## 7) Convenciones de identidad (obligatorias)

- Usar `canonicalToolKey` en formato:  
  `<publisherId>/<repositoryId>:<toolKind>/<toolId>@<major>`
- Mantener coherencia entre `catalog`, manifests y entitlements (`allowedToolKeys`).
- En beta, no mantener compatibilidad retroactiva de esquemas no publicados.

## 8) Checklist de publicación

- `git status` limpio
- `main` sincronizada con `origin/main`
- `catalog` válido
- release tag publicado

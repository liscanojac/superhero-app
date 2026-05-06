# Superhero App

Single-page application (SPA) built with **Angular** for browsing and managing superhero data. The UI combines **in-memory state** (created heroes) with the public **Superhero API** for discovery and details.

**Tooling:** Angular CLI **21.2.9** · TypeScript **~5.9** · RxJS **~7.8** · Vitest (unit tests) · Angular Material & Tailwind CSS.

> **Version policy:** This repo pins dependencies compatible with **Angular 21.x**. Before submission, confirm the [Angular support schedule](https://angular.dev/reference/releases) and upgrade to the **current LTS** line if your institution requires it.

## Features

Legend: **Done** · **Partial** · **N/A / optional**

### Services (state + API)

| Requirement | Status | Notes |
|-------------|--------|--------|
| Register a new superhero | **Done** | `Superhero.addCreatedHero()` + `HeroCreator` form with validations |
| List all superheroes | **Done** | Unified list in `Superhero.superheroList()`; API thumbnails loaded in batches |
| Get one superhero by id | **Done** | Details route loads from list (created) or `ApiService.getCharacterById()` |
| Search by name (parameter) | **Done** | Local name filter + debounced API search (`nameSearch` / `ApiService.searchHeroesByName`) when API key is set |
| Modify a superhero | **Partial** | No separate “edit in place” screen. **Duplicate hero** pre-fills the creator with mapped data so you can save a new copy (edit-by-duplicate workflow) |
| Delete a superhero | **Done** | `deleteHero()` + confirmation modal (`HeroDeleteModal`) |
| Unit tests for the service | **Done** | `superhero.spec.ts`, `api-service.spec.ts`, `superhero-list.mappers.spec.ts` |

**Storage note:** Created heroes and list composition live in the **`Superhero` injectable** (signals). **No custom backend** is required; optional HTTP calls go to the **Superhero API** for remote characters and search.

### UI component(s) — list & CRUD-style flows

| Requirement | Status | Notes |
|-------------|--------|--------|
| Paginated list with add / edit / delete actions | **Partial** | **Progressive loading** (batched thumbnails + infinite scroll) instead of classic page-number pagination. **Add** and **remove** on cards; **details** + **duplicate** instead of a dedicated “edit” button |
| Filter input above the list | **Done** | `SearchBar` + filter toggles (all / created / API) on `Heroes` |
| Add → empty form → validations → return to list | **Done** | `/heroes/create` (`HeroCreator`) |
| Edit → form with selected hero → save → list | **Partial** | Use **Duplicate hero** on the details page to open the creator with data; there is no route that updates the same id in place |
| Delete → confirm → remove | **Done** | Modal confirmation then `deleteHero()` |
| Unit tests for the component | **Done** | Specs under `src/app/components/**.spec.ts` (e.g. `heroes`, `hero-creator`, `hero-delete-modal`, …) |


### Positive criteria (high level)

- **Data model:** Typed API shapes (`superhero-api.model`), creator input (`superhero-creator.model`), and mappers (`superhero-list.mappers`).
- **Reactive style:** `combineLatest`, `switchMap`, `forkJoin`, `toObservable`, signals/computed in components.
- **Readable code:** Small helpers and lambdas where they clarify intent.

## Development server

```bash
npm install
ng serve
```

Open `http://localhost:4200/`.

## Build

```bash
ng build
```

Artifacts go to `dist/` (production build applies environment replacements as configured).

## Deployment (Firebase Hosting)

**Live app:** [https://superhero-app-cc9c0.web.app/](https://superhero-app-cc9c0.web.app/)

The static site is hosted on **Firebase Hosting** (project `superhero-app-cc9c0`). Production builds do **not** store API keys or other secrets in the repository:

- The Superhero API key and Firebase service account are provided as **GitHub Actions secrets** (e.g. `SUPERHERO_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_*`) and are only available in the CI environment.
- At deploy time, `scripts/write-environment.mjs` writes `environment.generated.ts` from those values so the production bundle is built without committing secrets to Git.

## Unit tests

```bash
ng test
```

Coverage summary (non-watch):

```bash
npm run test:coverage
```

**Coverage:** With the default Vitest **v8** report, **statement** and **line** coverage are **above 80%** ( ~83% statements, ~81% lines on a full run).
run `npm run test:coverage` locally for the current numbers.

## Repository & delivery

Submit this **Git repository** URL as instructed. Prefer **clear, scoped commits** (feature vs. chore vs. test).

## Additional resources

- [Angular CLI documentation](https://angular.dev/tools/cli)
- [Angular testing](https://angular.dev/guide/testing)

<p align="center">
  <img src="docs/pyttogpanne.png" alt="Pyttogpanne" width="220">
</p>

<p align="center">
  The Pyttogpanne app — turmat you can follow with the burner going and no signal.
</p>

---

pyttogpanne-mobile is the phone app for **Pyttogpanne** — turmat cooked in one
pan on a gas burner. Recipes are written in
[pyttogpanne-app](https://github.com/sondresjolyst/pyttogpanne-app) and served by
[pyttogpanne-api](https://github.com/sondresjolyst/pyttogpanne-api).

## What's in it

- **Recipes** — searchable by name or ingredient, filtered by category, with a
  serving count that scales the amounts.
- **Offline** — every published recipe is stored on the phone. Once it has
  synced, the app works without signal; it only asks the API for what has
  changed since last time.
- **Shopping list** — send a recipe's ingredients to one list, grouped by the
  recipe they came from.
- **Favourites and gear tips** — saved on the device, no account needed.
- **Terms, privacy and cookies** — downloaded with the recipes and read in the
  app, so they are there without signal.

The app is Norwegian only and needs no sign-in.

---

## For developers

<details>
<summary>Run, build, and test from source</summary>

### Stack

Expo (SDK 57) · expo-router · TypeScript · Axios · AsyncStorage · Jest.

### Run locally

```bash
npm install
npm start      # then press a for Android, i for iOS
```

`EXPO_PUBLIC_API_URL` points the app at the API: set per build profile in
`eas.json` (`development` and `preview` use the dev API, `production` the prod
one), or in `.env.local` for a local API. Without it the app falls back to
`extra.apiUrl` in `app.json`.

### Scripts

```bash
npm start       # Expo dev server
npm run android # dev build on a connected device or emulator
npm run ios     # dev build on a simulator
npm test        # Jest
```

Expo itself is free; building with EAS beyond its free tier is not, and
`npx expo run:android` builds locally without it. Store accounts cost what they
cost: Apple 99 USD a year, Google 25 USD once.

### Layout

```
app/              routes (expo-router)
  (tabs)/         recipes, favourites, shopping list, gear
  oppskrift/      one recipe
  utstyr/         one gear or tips article
  juridisk/       terms, privacy and cookies
  om.tsx          about, with links to the legal pages
src/api/          API client and the shapes it returns
src/store/        offline catalog, favourites and shopping list
src/recipes/      amount scaling and ingredient grouping
src/theme/        colours, spacing, type scale
```

### How the offline copy works

`CatalogProvider` reads the cache from AsyncStorage, then asks the API for
everything changed since the `serverTime` it stored last. Changed recipes
replace their cached copy, slugs the API reports as gone are dropped, and the
new `serverTime` is saved. A failed sync leaves the cached recipes on screen.

</details>

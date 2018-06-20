# digital-link-tool

This project contains an example GS1 Digital Link generator and verifier.

The verifier uses the [`apglib`](https://github.com/ldthomas/apg-js2-lib) 
library to check a GS1 Digital Link for formatting errors using the grammar as 
detailed in `src/scripts/grammar.js`.

The site is built using a combination of Bootstrap and flexbox and is compiled 
with [Parcel](https://parceljs.org/).


## Build

1. `git clone` this repository.
2. Run `npm i` to install dependencies.
3. Run `npm run build` to build the site, or `npm run server`.


## Deploy

1. Run `npm run build` to generate artifacts.
2. Deploy generated the `dist` folder to your hosting service of choice.
3. Go to `/index.html` to begin.

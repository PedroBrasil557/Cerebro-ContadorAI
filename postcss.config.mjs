// postcss.config.mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <-- USA O NOVO PACOTE
    autoprefixer: {},
  },
}

export default config
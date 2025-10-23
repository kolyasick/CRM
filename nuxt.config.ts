import prisma from "./lib/prisma";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "nuxt-auth-utils", "nuxt-file-storage", "@nuxtjs/google-fonts", "@pinia/nuxt"],
  fileStorage: {
    mount: process.env.NODE_ENV === "production" ? "/uploads" : "public/uploads",
  },
  build: {
    transpile: ["@vuepic/vue-datepicker"],
  },
  nitro: {
    externals: {
      trace: false,
      traceInclude: ["@prisma/client"],
    },
    storage: {
      cache: {
        driver: "memory",
      },
    },
  },

  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 30,
      name: "nuxt-session",
      password: process.env.NUXT_SESSION_PASSWORD || "",
      cookie: {
        httpOnly: false,
        secure: false,
      },
    },
    public: {
      APP_URL: process.env.NODE_ENV === "development" ? "http://localhost:3000" : "http://5.19.137.120:1823",
      API_URL: "http://5.19.137.120",
      ACCOUNTANT_EMAILS: [
        "e.demirova@magnatmedia.com",
        "m.sergeev@lightdigital.ru",
        "killergems122@gmail.com",
        "buh2@magnatmedia.com",
        "gracionova@magnatmedia.com",
      ],
      LAWYER_EMAILS: ["urist1@magnatmedia.com"],
      MY_EMAIL: ["killergems122@gmail.com"],
    },
  },

  vite: {
    resolve: {
      alias: {
        ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js",
      },
    },
  },
  googleFonts: {
    families: {
      Montserrat: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    display: "swap",
    preload: true,
  },
  tailwindcss: {
    config: {
      darkMode: "class",
      theme: {
        extend: {
          screens: {
            "2xl": "1600px",
          },
        },
      },
    },
  },
  app: {
    head: {
      link: [
        { rel: "apple-touch-icon", sizes: "57x57", href: "https://magnatmedia.com/fav/apple-icon-57x57.png" },
        { rel: "apple-touch-icon", sizes: "60x60", href: "https://magnatmedia.com/fav/apple-icon-60x60.png" },
        { rel: "apple-touch-icon", sizes: "72x72", href: "https://magnatmedia.com/fav/apple-icon-72x72.png" },
        { rel: "apple-touch-icon", sizes: "76x76", href: "https://magnatmedia.com/fav/apple-icon-76x76.png" },
        { rel: "apple-touch-icon", sizes: "114x114", href: "https://magnatmedia.com/fav/apple-icon-114x114.png" },
        { rel: "apple-touch-icon", sizes: "120x120", href: "https://magnatmedia.com/fav/apple-icon-120x120.png" },
        { rel: "apple-touch-icon", sizes: "144x144", href: "https://magnatmedia.com/fav/apple-icon-144x144.png" },
        { rel: "apple-touch-icon", sizes: "152x152", href: "https://magnatmedia.com/fav/apple-icon-152x152.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "https://magnatmedia.com/fav/apple-icon-180x180.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "https://magnatmedia.com/fav/android-icon-192x192.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "https://magnatmedia.com/fav/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "96x96", href: "https://magnatmedia.com/fav/favicon-96x96.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "https://magnatmedia.com/fav/favicon-16x16.png" },
      ],
    },
  },
});

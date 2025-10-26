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
      APP_URL: process.env.NODE_ENV === "development" ? "http://localhost:3000" : process.env.APP_URL,
      API_URL: process.env.APP_URL,
      ACCOUNTANT_EMAILS: [],
      LAWYER_EMAILS: [],
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
});

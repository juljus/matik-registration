// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    'nuxt-vue3-google-signin'
  ],
  googleSignIn: {
    clientId: '846248110836-av396asmi08d2aoh794cjri9rri9vlt2.apps.googleusercontent.com',
  }
})
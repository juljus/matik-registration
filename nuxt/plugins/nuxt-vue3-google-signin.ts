import { defineNuxtPlugin } from '#app'
import Vue3GoogleSignin from 'vue3-google-signin'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vue3GoogleSignin, {
    clientId: process.env.GOOGLE_CLIENT_ID
  })
})

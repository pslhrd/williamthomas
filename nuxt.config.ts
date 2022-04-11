import { defineNuxtConfig } from 'nuxt3'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  css: [
    '@/assets/fonts/fonts.scss',
    '@/assets/styles/main.scss',
    '@/assets/styles/reset.scss'
  ],
  modules: ['@nuxtjs/prismic'],
  prismic: {
      endpoint: 'https://wotprod.cdn.prismic.io/api/v2'
  },
})

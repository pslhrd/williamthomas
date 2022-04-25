<template>
  <main>
    <div class="preloader" ref="preloader">
      <div v-splitChars ref="preloadText">WILLIAM THOMAS</div>
    </div>
    <Header />
    <NuxtPage />
  </main>
</template>

<script setup>
import { gsap } from 'gsap'
import { onMounted, ref } from 'vue'

const preloader = ref(null)
const preloadText = ref(null)

onMounted(() => {
  const tl = gsap.timeline()
  const text = preloadText.value.querySelectorAll('span')
  const container = preloader.value
  tl
  .fromTo(text, {autoAlpha:0}, {autoAlpha:1, duration: 0.4, stagger:{amount:0.4, from:'random'}, ease:'power3.out'}, '+=0.5')
  .to(text, {autoAlpha:0, duration: 0.4, stagger:{amount:0.4, from:'random'}, ease:'power3.out'}, '+=0.2')
  .to(container, {autoAlpha:0, duration: 1, ease:'power3.out'}, '-=0.2')
  
})
</script>

<style lang="scss">
main {
  width: 100%;
  min-height: 100vh;
  background-color: black;

  .preloader {
    z-index: 50;
    background-color: black;
    position: fixed;
    overflow: hidden;
    width: 100vw;
    height: 100vh;

    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: 'NM Medium';
    font-size: 16px;

    .split-letter {
      opacity: 0;
    }
  }
}
</style>
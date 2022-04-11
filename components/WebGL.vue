<template>
  <section>
    <!-- <canvas ref="canvas" class="webgl" /> -->
  </section>
</template>

<script setup>
// import Webgl from '../webgl/js/Webgl/Webgl'
const props = defineProps(['videos'])
// console.log(Webgl)

</script>

<style lang="scss" scoped>
  .webgl {
    position: fixed;
    z-index: 1;
    width: 100%;
    height: 100%;
  }
</style>

<template>
  <section class="content">
    <Slider :videos="videoData"/>
    <WebGL :videos="videoData" />
  </section>
</template>

<script setup>
  import { onMounted } from "vue"

  const { client } = usePrismic()
  const { data: home } = await useAsyncData('homepage', () => client.getSingle('homepage'))
  const videoData = home._rawValue.data.video

  onMounted(() => {
  })
  
</script>

<style lang="scss" scoped>
.content {
  width: 100vw;
  min-height: 100vh;
  overflow: hidden;
}
</style>
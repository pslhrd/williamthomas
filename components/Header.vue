<template>
  <header>
    <div class="wrapper">
      <div class="logo">
        <Nuxt-Link to="/">
          WILLIAM THOMAS
        </Nuxt-Link>
      </div>
    </div>
    <div class="wrapper">
      <div class="a-propos">
        <Nuxt-Link to="about">
          A PROPOS
        </Nuxt-Link>
      </div>
      <div class="realisations">
        <div class="works">
          <Nuxt-Link to="works">
            REALISATIONS
          </Nuxt-Link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
</script>

<style lang="scss" scoped>

  header {
    width: 100%;
    position: fixed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    padding: 50px;
    font-family: 'NM Medium';
    color: white;
  }

  .wrapper {
    display: block;

    div {
      padding: 10px;
      display: inline-block;
      &:hover {
        cursor: pointer;
      }
    }
  }
</style>
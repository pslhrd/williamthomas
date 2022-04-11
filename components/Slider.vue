<template>
<section class="slider-content">
  <section class="slider" ref="slider">
    <div class="slide" v-for="(video, i) in videos" :key="video.i" :class="{current: currentIndex === i}">
      <div class="wrapper">
        <div class="artist" v-splitChars>{{ $prismic.asText(video.artist) }}</div>
      </div>
      <div class="wrapper">
        <div class="title" v-splitChars>{{ $prismic.asText(video.title) }}</div>
      </div>
    </div>
  </section>
  <section class="slideCounter">
    <div class="counter" v-for="(video, i) in videos" :key="video.i" :class="{currentCount: currentIndex === i}"></div>
  </section>
</section>
</template>

<script setup>
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import { ref, onMounted, nextTick } from 'vue'
gsap.registerPlugin(Observer)

const props = defineProps(['videos'])
let currentIndex = ref(0)
let animating = false
let slider = ref(null)
let wrap = gsap.utils.wrap(0, props.videos.length)

function GoToSlide(oldIndex, index, direction) {
  animating = true
  index = wrap(index)
  let slides = slider.value.querySelectorAll('.slide')
  let oldTitle = slides[oldIndex].querySelectorAll('.artist span')
  let oldArtist = slides[oldIndex].querySelectorAll('.title span')
  let newTitle = slides[index].querySelectorAll('.title span')
  let newArtist = slides[index].querySelectorAll('.artist span')

  let fromTop = direction === -1,
      dFactor = fromTop ? -1 : 1,
      tl = gsap.timeline({
        onComplete: () => animating = false,
      })
      
  tl.fromTo(oldTitle, {
    yPercent:0,
    autoAlpha:1
    }, {
    autoAlpha:0,
    duration:0.4,
    ease:'power4.out',
    stagger:{
      from: 'random',
      amount: 0.3
    }
  })

  tl.fromTo(oldArtist, {
    yPercent:0,
    autoAlpha:1
    }, {
    autoAlpha:0,
    duration:0.4,
    ease:'power4.out',
    stagger:{
      each: 0.03,
      from: 'random',
      amount: 0.3
    }
  },'-=0.5')

  tl.fromTo(newArtist, {
    autoAlpha:0
    }, {
    yPercent:0,
    autoAlpha:1,
    duration:0.2,
    ease:'power4.out',
    stagger:{
      from: 'random',
      amount: 0.3
    }
  }, '-=0.2')

  tl.fromTo(newTitle, {
    autoAlpha:0
    }, {
    yPercent:0,
    autoAlpha:1,
    duration:0.2,
    ease:'power4.out',
    stagger:{
      from: 'random',
      amount: 0.3
    }
  }, '-=0.2')
  currentIndex.value = index
}


onMounted(() => {
  let currentSpans = slider.value.querySelectorAll('.split-letter')
  // gsap.set(currentSpans, {autoAlpha:0})

  function Once() {
    let slides = slider.value.querySelectorAll('.slide')
    let Title = slides[0].querySelectorAll('.title span')
    let Artist = slides[0].querySelectorAll('.artist span')
    const tl = gsap.timeline()
    tl.fromTo(Artist, {
      autoAlpha:0
      }, {
      yPercent:0,
      autoAlpha:1,
      duration:0.4,
      ease:'power4.out',
      stagger:{
        from: 'random',
        amount: 0.4
      }
    }, '+=0.2')
    tl.fromTo(Title, {
      autoAlpha:0
      }, {
      yPercent:0,
      autoAlpha:1,
      duration:0.4,
      ease:'power4.out',
      stagger:{
        from: 'random',
        amount: 0.4
      }
    }, '-=0.5')
  }
  Observer.create({
    type: "wheel,touch,pointer",
    wheelSpeed: -1,
    onDown: () => {
      !animating && GoToSlide(currentIndex.value, currentIndex.value - 1, -1)
    },
    onUp: () => {
      !animating && GoToSlide(currentIndex.value, currentIndex.value + 1, 1)
    },
    tolerance: 10,
    preventDefault: true,
  })
  
  Once()
})

</script>

<style lang="scss">

.slider-content {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  pointer-events: none;
  left: 0;
}
.slider {
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: white;
  font-family: 'NM Black';
  font-size: 6vw;
  letter-spacing: -0.05em;
  line-height: 100%;
  text-transform: uppercase;
  pointer-events: none;

  .slide {
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    pointer-events: none;

    .artist, .title {
      .split-letter {
        opacity: 0;
      }
    }
    .wrapper {
      display: block;
      // overflow: hidden;
    }
  }
}

.slideCounter {
  width: 40px;
  height: auto;
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-evenly;

  .counter {
    width: 1px;
    height: 10px;
    background-color: white;
    transform-origin: bottom;
    transition: transform 1.2s cubic-bezier(0,0,0,1);

    &.currentCount {
      transform: scaleY(2);
    }
  }
}
</style>
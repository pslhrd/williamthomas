<template>
  <section class="listing">
    <div class="video-wrapper" ref="videoContainer">
      <div class="video" ref="video" v-for="(video, i) in videos" :key="video.i" :Index="i" :class="{current: currentIndex === i}">
        <div class="wrapper">
          <div class="video-image">
            <prismic-image :field="video.thumbnail" />
          </div>
          <!-- <div class="video-player">
            <video muted loop playsinline preload="none" crossorigin="anonymous" webkit-playsinline :src="video.link.url"></video>
          </div> -->
        </div>
        <div class="video-content">
          <span class="artist">{{ $prismic.asText(video.artist) }}</span>
          <span class="title">{{ $prismic.asText(video.title1) }}</span>
        </div>
      </div>
    </div>
    <!-- <div class="middleSection"></div> -->
    <div class="videoCounter">
      <div class="counter" v-for="(video, i) in videos" :Index="i" :key="video.i" :class="{currentCount: currentIndex === i}"></div>
    </div>
  </section>
</template>

<script setup>
  import { ref, onMounted, nextTick } from 'vue'
  import { gsap } from 'gsap'
  import { Observer } from 'gsap/Observer'
  gsap.registerPlugin(Observer)

  const { client } = usePrismic()
  const { data: works } = await useAsyncData('works', () => client.getSingle('works'))
  const videos = works._rawValue.data.videos
  let wrap = gsap.utils.wrap(0, videos.length)

  const currentIndex = ref(0)
  const videoContainer = ref(null)

  onMounted(() => {
    console.log(videoContainer)
    let container = videoContainer.value
    let videos = container.querySelectorAll('.video')
    container.addEventListener('click', getIndex)
    function getIndex(e){
      let target = e.path[3]
      if (target.className === 'video') {
        GoToSlide(target.getAttribute('index'))
      }
    }
    function Once(){
      nextTick(() => {
        console.log('launched')
        let current = videos[1]
        let array = Array.from(videos)
        let animated = array.slice(0, 4)
        let totalWrapper = container.getBoundingClientRect()
        let currentSlide = current.getBoundingClientRect()
        let clientWidth = window.innerWidth / 2
        let totalOffset = (clientWidth - currentSlide.width / 2)  - (currentSlide.x - totalWrapper.x)
        gsap.set(container, {x:totalOffset})
        gsap.from(animated, {autoAlpha:0, xPercent:70, stagger:0.1, duration:1, delay:'power4.out'})
      })
    }
    function GoToSlide(index) {
      index = wrap(index)  
      let current = videos[index]
      let totalWrapper = container.getBoundingClientRect()
      let currentSlide = current.getBoundingClientRect()
      let clientWidth = window.innerWidth / 2
      let totalOffset = (clientWidth - currentSlide.width / 2)  - (currentSlide.x - totalWrapper.x)
      gsap.to(container, {x:totalOffset, duration:2, ease:'power4.out'})
      currentIndex.value = index
    }

    Observer.create({
      type: "wheel,touch,pointer",
      wheelSpeed: -1,
      onDown: () => {
        GoToSlide(currentIndex.value - 1)
      },
      onUp: () => {
        GoToSlide(currentIndex.value + 1)
      },
      tolerance: 20,
      preventDefault: true,
    })

    Once()
  })

</script>

<style lang="scss" scoped>

.listing {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.middleSection {
  width: 1px;
  height: 100vh;
  background-color: white;
  position: absolute;
  top: 0;
  left: 50%;
}

.video {
  width: 22vw;
  display: inline-block;
  color: white;
  font-family: 'NM Regular';
  font-size: 14px;
  text-transform: uppercase;
  margin: 40px;
  overflow: hidden;

  &:hover {
    cursor: pointer;

    .wrapper {
      opacity: 1;
    }
  }

  &.current {

    .wrapper {
      opacity: 1;
    }

    .video-image {
      border: 5px solid white;
    }
    span {
      transform: translateY(0%);
      opacity: 1;
    }
  }

  .wrapper {
    width: 22vw;
    height: 30vw;
    overflow: hidden;
    transition: opacity 1s cubic-bezier(0,0,0,1);
    opacity: 0.5;
  }

  &-content {
    margin-top: 20px;

    span {
      display: inline-block;
      transition: all 1.4s cubic-bezier(0,0,0,1);
      transform: translateY(100%);
      opacity: 0;
    }

    .title {
      transition-delay: 0.3s;
      &:before {
        display: inline-block;
        content: '';
        width: 15px;
        height: 1px;
        margin-bottom: 4px;
        margin-left: 5px;
        margin-right: 5px;
        background-color: white;
      }
    }

    .artist {
      font-family: 'NM Black';
    }

  }

  &-image {
    width: 100%;
    height: 100%;
    border: 0px solid white;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.videoCounter {
  width: 200px;
  height: auto;
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-evenly;

  .counter {
    // padding: 3px;
    width: 1px;
    height: 10px;
    background-color: white;
    transform-origin: bottom;
    transition: transform 1s cubic-bezier(0,0,0,1);

    &:hover {
      cursor: pointer;
      transform: scaleY(2);
    }

    &.currentCount {
      transform: scaleY(2);
    }
  }
}

</style>
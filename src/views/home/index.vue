<template>
  <div class="home" :class="{ 'is-started': journeyStarted }">
    <IntroGate :visible="phase === 'gate'" @start="handleStart" />

    <TimeShift
      :visible="phase === 'to-past'"
      mode="past"
      eyebrow="TIME REVERSING"
      title="时间正在倒流。"
      subtitle="请允许我们，短暂离开现在。"
    />

    <TimeShift
      :visible="phase === 'to-present'"
      mode="present"
      eyebrow="RETURNING"
      title="对话结束。过去已经听见。"
      subtitle="现在，请回望此处。"
    />

    <main v-show="journeyStarted" class="home__main">
      <header class="home__hero">
        <div class="home__hero-bg" :style="{ backgroundImage: `url(${heroBg})` }" />
        <div class="home__hero-veil" />
        <div class="home__hero-copy">
          <p class="home__eyebrow">DIALOGUE WITH THE PAST</p>
          <h1 class="home__brand">回到过去</h1>
          <p class="home__lead">向下行走。每一帧，都是通往那时的钥匙。</p>
        </div>
        <div class="home__mouse" aria-hidden="true">
          <span />
        </div>
      </header>

      <StoryScroll />
      <PhotoBloom @bloom="onBloom" @returning="onReturning" @finale="onFinale" />
    </main>

    <MusicControl v-if="journeyStarted" :playing="playing" @toggle="toggleMusic" />
    <audio ref="audio" :src="musicSrc" loop preload="auto" />
  </div>
</template>

<script>
import IntroGate from '@/components/IntroGate.vue'
import TimeShift from '@/components/TimeShift.vue'
import StoryScroll from '@/components/StoryScroll.vue'
import PhotoBloom from '@/components/PhotoBloom.vue'
import MusicControl from '@/components/MusicControl.vue'
import { getPhoto } from '@/utils/photos'
import musicSrc from '@/assets/music/audio.mp3'

export default {
  name: 'Home',
  components: {
    IntroGate,
    TimeShift,
    StoryScroll,
    PhotoBloom,
    MusicControl
  },
  data() {
    return {
      phase: 'gate', // gate | to-past | journey | to-present | brand
      journeyStarted: false,
      playing: false,
      musicSrc,
      heroBg: getPhoto(12),
      shiftTimer: null
    }
  },
  beforeDestroy() {
    if (this.shiftTimer) clearTimeout(this.shiftTimer)
  },
  methods: {
    handleStart() {
      this.phase = 'to-past'
      this.playMusic()
      this.shiftTimer = window.setTimeout(() => {
        this.journeyStarted = true
        this.phase = 'journey'
        this.$nextTick(() => {
          window.scrollTo({ top: 0, behavior: 'auto' })
        })
      }, 3200)
    },
    playMusic() {
      const audio = this.$refs.audio
      if (!audio) return
      const playPromise = audio.play()
      if (playPromise && playPromise.then) {
        playPromise
          .then(() => {
            this.playing = true
          })
          .catch(() => {
            this.playing = false
          })
      } else {
        this.playing = !audio.paused
      }
    },
    toggleMusic() {
      const audio = this.$refs.audio
      if (!audio) return
      if (audio.paused) {
        audio.play().then(() => {
          this.playing = true
        })
      } else {
        audio.pause()
        this.playing = false
      }
    },
    onBloom() {
      const audio = this.$refs.audio
      if (!audio) return
      try {
        audio.currentTime = 0
      } catch (e) {
        /* ignore */
      }
      this.playMusic()
    },
    onReturning() {
      this.phase = 'to-present'
      if (this.shiftTimer) clearTimeout(this.shiftTimer)
      this.shiftTimer = window.setTimeout(() => {
        this.phase = 'brand'
      }, 3800)
    },
    onFinale() {
      this.phase = 'brand'
    }
  }
}
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background: var(--bg-deep);

  &__main {
    animation: mainIn 1.1s ease both;
  }

  &__hero {
    position: relative;
    height: 100vh;
    min-height: 640px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__hero-bg {
    position: absolute;
    inset: -8%;
    background-size: cover;
    background-position: center;
    filter: brightness(0.48) saturate(0.68) contrast(1.12) hue-rotate(-8deg);
    animation: heroDrift 20s ease-in-out infinite alternate;
  }

  &__hero-veil {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 65% 55% at 50% 40%, transparent 0%, rgba(5, 7, 12, 0.55) 65%, rgba(5, 7, 12, 0.94) 100%),
      linear-gradient(180deg, rgba(122, 16, 40, 0.2), rgba(5, 7, 12, 0.55));
  }

  &__hero-copy {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 24px;
    animation: rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
  }

  &__eyebrow {
    margin: 0 0 16px;
    font-family: var(--font-display);
    font-size: 13px;
    letter-spacing: 0.42em;
    color: var(--accent-metal);
  }

  &__brand {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(48px, 11vw, 96px);
    letter-spacing: 0.14em;
    text-indent: 0.14em;
    line-height: 1;
    text-shadow: 0 0 48px rgba(176, 30, 58, 0.28);
  }

  &__lead {
    margin: 22px 0 0;
    font-weight: 300;
    font-size: 15px;
    letter-spacing: 0.2em;
    color: var(--text-muted);
  }

  &__mouse {
    position: absolute;
    left: 50%;
    bottom: 36px;
    transform: translateX(-50%);
    width: 22px;
    height: 34px;
    border: 1px solid var(--metal-line);
    border-radius: 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);

    span {
      position: absolute;
      left: 50%;
      top: 8px;
      width: 3px;
      height: 7px;
      margin-left: -1.5px;
      border-radius: 2px;
      background: var(--accent-metal);
      animation: mouseDrop 1.8s ease-in-out infinite;
    }
  }
}

@keyframes mainIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes heroDrift {
  from {
    transform: scale(1.05) translate3d(-1%, 0, 0);
  }
  to {
    transform: scale(1.12) translate3d(1.2%, 1%, 0);
  }
}

@keyframes mouseDrop {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(12px);
  }
}
</style>

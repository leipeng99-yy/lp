<template>
  <section class="force-return" :class="{ 'is-lite': isLite }">
    <div v-if="!isLite" class="force-return__grid">
      <div v-for="(src, i) in sources" :key="i" class="force-return__cell">
        <video
          :ref="'fv' + i"
          class="force-return__video"
          :src="src"
          muted
          playsinline
          preload="metadata"
        />
      </div>
    </div>
    <div v-else class="force-return__lite" aria-hidden="true">
      <div class="force-return__lite-ring" />
      <div class="force-return__lite-ring is-delay" />
      <div class="force-return__lite-flash" />
    </div>
    <div class="force-return__crush" />
    <div class="force-return__copy">
      <p class="force-return__eyebrow">FORCED RETURN · NOW</p>
      <h2 class="force-return__title">时空坍塌。</h2>
      <p class="force-return__sub">没有人能把昨日据为己有。</p>
    </div>
  </section>
</template>

<script>
import { videoList } from '@/utils/videos'
import { isMobileDevice } from '@/utils/device'

export default {
  name: 'ForceReturn',
  data() {
    return {
      sources: [],
      rafId: null,
      running: false,
      isLite: isMobileDevice()
    }
  },
  mounted() {
    if (this.isLite) return
    this.sources = videoList.slice(0, 3).map((v) => v.src)
    this.$nextTick(() => this.startBurst())
  },
  beforeDestroy() {
    this.stopBurst()
  },
  methods: {
    getVideos() {
      const result = []
      for (let i = 0; i < this.sources.length; i++) {
        const ref = this.$refs['fv' + i]
        const el = Array.isArray(ref) ? ref[0] : ref
        if (el) result.push(el)
      }
      return result
    },
    startBurst() {
      this.getVideos().forEach((video, i) => {
        const boot = () => {
          try {
            video.currentTime = Math.min(0.2, (video.duration || 1) * 0.1)
            video.playbackRate = 3 + (i % 3)
            const p = video.play()
            if (p && p.catch) p.catch(() => {})
          } catch (e) {
            /* ignore */
          }
        }
        if (video.readyState >= 1) boot()
        else video.addEventListener('loadedmetadata', boot, { once: true })
      })

      this.running = true
      let last = performance.now()
      const tick = (now) => {
        if (!this.running) return
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        this.getVideos().forEach((video, i) => {
          if (!video.duration || i % 2 !== 0) return
          let t = video.currentTime + dt * (8 + i)
          if (t >= video.duration - 0.05) t = 0.05
          try {
            video.currentTime = t
          } catch (e) {
            /* ignore */
          }
        })
        this.rafId = requestAnimationFrame(tick)
      }
      this.rafId = requestAnimationFrame(tick)
    },
    stopBurst() {
      this.running = false
      if (this.rafId) cancelAnimationFrame(this.rafId)
      this.rafId = null
      this.getVideos().forEach((v) => {
        try {
          v.pause()
        } catch (e) {
          /* ignore */
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.force-return {
  position: fixed;
  inset: 0;
  z-index: 70;
  overflow: hidden;
  background: #020308;
  animation: crushIn 5.6s cubic-bezier(0.55, 0.05, 0.35, 1) both;

  &__grid {
    position: absolute;
    inset: -8%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    filter: contrast(1.25) saturate(0.55);
    animation: gridSpin 5.6s ease-in both;
  }

  &__cell {
    overflow: hidden;
    opacity: 0.9;
  }

  &__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.75);
  }

  &__lite {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, #1c0c14, #05070c 60%);
  }

  &__lite-ring {
    position: absolute;
    left: 50%;
    top: 50%;
    width: min(70vw, 420px);
    height: min(70vw, 420px);
    margin: calc(min(70vw, 420px) / -2) 0 0 calc(min(70vw, 420px) / -2);
    border: 1px solid rgba(200, 208, 220, 0.35);
    border-radius: 50%;
    animation: ringOut 5.6s ease-out both;

    &.is-delay {
      animation-delay: 0.35s;
      opacity: 0.45;
    }
  }

  &__lite-flash {
    position: absolute;
    inset: 0;
    background: #fff;
    opacity: 0;
    animation: whiteFlash 5.6s ease both;
  }

  &__crush {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(2, 3, 8, 0.25) 40%, rgba(2, 3, 8, 0.92) 78%);
    animation: crushVeil 5.6s ease both;
  }

  &__copy {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 28px;
    animation: copyHold 5.6s ease both;
  }

  &__eyebrow {
    margin: 0 0 16px;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.46em;
    text-indent: 0.46em;
    color: var(--accent-metal);
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(30px, 6.5vw, 52px);
    letter-spacing: 0.28em;
    text-indent: 0.28em;
  }

  &__sub {
    margin: 18px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.2em;
    color: var(--text-muted);
  }
}

@keyframes crushIn {
  0% {
    transform: scale(1);
    filter: contrast(1);
  }
  55% {
    transform: scale(1.08);
    filter: contrast(1.35);
  }
  100% {
    transform: scale(1.16);
    filter: contrast(1.5);
  }
}

@keyframes gridSpin {
  0% {
    transform: scale(1) rotate(0deg);
  }
  100% {
    transform: scale(1.28) rotate(-3deg);
  }
}

@keyframes crushVeil {
  0% {
    opacity: 0.35;
  }
  100% {
    opacity: 1;
  }
}

@keyframes copyHold {
  0% {
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0.9;
  }
}

@keyframes ringOut {
  0% {
    transform: scale(0.55);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}

@keyframes whiteFlash {
  0%,
  100% {
    opacity: 0;
  }
  8% {
    opacity: 0.55;
  }
  16% {
    opacity: 0;
  }
  42% {
    opacity: 0.25;
  }
  50% {
    opacity: 0;
  }
}
</style>

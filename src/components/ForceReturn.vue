<template>
  <section class="force-return" :class="{ 'is-lite': isLite }">
    <!-- 桌面 3 格狂 scrub / 手机单路低频跳帧：保留「截帧被扯回现在」 -->
    <div class="force-return__grid" :class="{ 'is-single': isLite }">
      <div v-for="(src, i) in sources" :key="i" class="force-return__cell">
        <video
          :ref="'fv' + i"
          class="force-return__video"
          :src="src"
          muted
          playsinline
          webkit-playsinline
          preload="metadata"
        />
      </div>
    </div>

    <div class="force-return__crush" />
    <div class="force-return__flash" aria-hidden="true" />
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
      jumpTimer: null,
      blackTimer: null,
      running: false,
      isLite: isMobileDevice()
    }
  },
  mounted() {
    const list = videoList.map((v) => v.src)
    // 手机：单路；桌面：三格
    this.sources = this.isLite
      ? [list[Math.min(2, list.length - 1)]]
      : list.slice(0, 3)
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
            video.playbackRate = this.isLite ? 2.8 + (i % 2) * 0.4 : 3 + (i % 3)
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

      if (this.isLite) {
        // 手机：定时低频跳帧，不用 rAF 狂 scrub
        const jump = () => {
          if (!this.running) return
          this.getVideos().forEach((video) => {
            if (!video.duration) return
            try {
              const t = 0.05 + Math.random() * Math.max(0.1, video.duration - 0.15)
              video.currentTime = t
              video.playbackRate = 2.5 + Math.random() * 2
              if (video.paused) {
                const p = video.play()
                if (p && p.catch) p.catch(() => {})
              }
            } catch (e) {
              /* ignore */
            }
          })
          this.jumpTimer = window.setTimeout(jump, 280 + Math.random() * 320)
        }
        this.jumpTimer = window.setTimeout(jump, 200)
        return
      }

      // 桌面：保留多路 rAF scrub
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
      if (this.jumpTimer) clearTimeout(this.jumpTimer)
      this.jumpTimer = null
      if (this.blackTimer) clearTimeout(this.blackTimer)
      this.blackTimer = null
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
  animation: crushIn 8.5s cubic-bezier(0.55, 0.05, 0.35, 1) both;

  &__grid {
    position: absolute;
    inset: -8%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    filter: contrast(1.25) saturate(0.55);
    animation: gridSpin 8.5s ease-in both;

    &.is-single {
      grid-template-columns: 1fr;
      inset: -4%;
      filter: contrast(1.2) saturate(0.6) brightness(0.85);
      animation: gridSpinLite 8.5s ease-in both;
    }
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

  &__crush {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(2, 3, 8, 0.25) 40%, rgba(2, 3, 8, 0.92) 78%);
    animation: crushVeil 8.5s ease both;
  }

  &__flash {
    position: absolute;
    inset: 0;
    background: #000;
    opacity: 0;
    pointer-events: none;
    animation: forceBlackFlash 8.5s steps(1) both;
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
    animation: copyHold 8.5s ease both;
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

@keyframes gridSpinLite {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.12);
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
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0.9;
  }
}

@keyframes forceBlackFlash {
  0%,
  100% {
    opacity: 0;
  }
  6% {
    opacity: 0.85;
  }
  9% {
    opacity: 0;
  }
  22% {
    opacity: 0.7;
  }
  25% {
    opacity: 0;
  }
  48% {
    opacity: 0.55;
  }
  52% {
    opacity: 0;
  }
  70% {
    opacity: 0.4;
  }
  74% {
    opacity: 0;
  }
}
</style>

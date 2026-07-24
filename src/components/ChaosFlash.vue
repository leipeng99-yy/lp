<template>
  <section class="chaos-flash" :class="{ 'is-dim': dim }">
    <div class="chaos-flash__grid">
      <div
        v-for="(cell, i) in cells"
        :key="cell.id"
        class="chaos-flash__cell"
        :style="cellStyle(i)"
      >
        <video
          :ref="'v' + i"
          class="chaos-flash__video"
          :src="cell.src"
          muted
          playsinline
          preload="auto"
        />
      </div>
    </div>

    <div class="chaos-flash__scan" aria-hidden="true" />
    <div class="chaos-flash__noise" aria-hidden="true" />
    <div class="chaos-flash__chromatic" aria-hidden="true" />

    <div class="chaos-flash__copy">
      <p class="chaos-flash__eyebrow">TEMPORAL DRIFT · SIGNAL UNSTABLE</p>
      <h1 class="chaos-flash__title">时空正在失序。</h1>
      <p class="chaos-flash__lead">有些画面，正以错误的方向抵达。</p>
    </div>
  </section>
</template>

<script>
import { videoList } from '@/utils/videos'

const CELL_COUNT = 9

export default {
  name: 'ChaosFlash',
  props: {
    dim: { type: Boolean, default: false }
  },
  data() {
    return {
      cells: [],
      rafId: null,
      running: false
    }
  },
  mounted() {
    this.buildCells()
    this.$nextTick(() => {
      this.startReverse()
    })
  },
  beforeDestroy() {
    this.stopReverse()
  },
  methods: {
    buildCells() {
      const list = videoList.length ? videoList : []
      this.cells = Array.from({ length: CELL_COUNT }, (_, i) => {
        const item = list[i % Math.max(list.length, 1)]
        return {
          id: i,
          src: item ? item.src : ''
        }
      })
    },
    cellStyle(i) {
      const jitter = ((i * 37) % 11) - 5
      return {
        animationDelay: `${(i % 5) * 0.12}s`,
        transform: `scale(${1.05 + (i % 3) * 0.04}) translate(${jitter}%, ${-jitter * 0.4}%)`
      }
    },
    getVideos() {
      const result = []
      for (let i = 0; i < CELL_COUNT; i++) {
        const ref = this.$refs['v' + i]
        const el = Array.isArray(ref) ? ref[0] : ref
        if (el) result.push(el)
      }
      return result
    },
    startReverse() {
      const videos = this.getVideos()
      videos.forEach((video, i) => {
        const boot = () => {
          try {
            const dur = video.duration && !Number.isNaN(video.duration) ? video.duration : 3
            video.currentTime = Math.max(0.05, dur * (0.35 + (i % 5) * 0.12))
            video.playbackRate = 1
            video.pause()
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
          if (!video.duration || Number.isNaN(video.duration)) return
          const speed = 4.2 + (i % 4) * 0.8
          let next = video.currentTime - dt * speed
          if (next <= 0.02) next = video.duration - 0.05
          try {
            video.currentTime = next
          } catch (e) {
            /* ignore */
          }
        })
        this.rafId = requestAnimationFrame(tick)
      }
      this.rafId = requestAnimationFrame(tick)
    },
    stopReverse() {
      this.running = false
      if (this.rafId) cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
</script>

<style lang="scss" scoped>
.chaos-flash {
  position: fixed;
  inset: 0;
  z-index: 40;
  overflow: hidden;
  background: #030508;
  transition: filter 0.8s ease, opacity 0.8s ease;

  &.is-dim {
    filter: brightness(0.45) saturate(0.55);
  }

  &__grid {
    position: absolute;
    inset: -4%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 2px;
    filter: contrast(1.15) saturate(0.7) hue-rotate(-12deg);
  }

  &__cell {
    position: relative;
    overflow: hidden;
    opacity: 0.85;
    animation: cellPulse 1.4s ease-in-out infinite alternate;
  }

  &__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
    filter: brightness(0.72) contrast(1.2);
  }

  &__scan {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.18) 0,
      rgba(0, 0, 0, 0.18) 1px,
      transparent 1px,
      transparent 3px
    );
    mix-blend-mode: multiply;
    opacity: 0.55;
    animation: scanDrift 3.2s linear infinite;
  }

  &__noise {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.12;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    animation: noiseFlick 0.18s steps(2) infinite;
  }

  &__chromatic {
    position: absolute;
    inset: 0;
    pointer-events: none;
    box-shadow: inset 0 0 120px rgba(176, 30, 58, 0.22);
    background:
      linear-gradient(90deg, rgba(176, 30, 58, 0.08), transparent 40%, rgba(120, 180, 255, 0.06));
    mix-blend-mode: screen;
    animation: chromaShift 2.4s ease-in-out infinite alternate;
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
    background: radial-gradient(ellipse 55% 45% at 50% 48%, rgba(3, 5, 8, 0.15), rgba(3, 5, 8, 0.78));
    animation: copyBreath 3.6s ease-in-out infinite;
  }

  &__eyebrow {
    margin: 0 0 18px;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.48em;
    text-indent: 0.48em;
    color: var(--accent-metal);
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(32px, 7vw, 64px);
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    line-height: 1.25;
    text-shadow: 0 0 40px rgba(176, 30, 58, 0.35);
  }

  &__lead {
    margin: 20px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.24em;
    color: var(--text-muted);
  }
}

@keyframes cellPulse {
  from {
    opacity: 0.55;
    filter: brightness(0.8);
  }
  to {
    opacity: 1;
    filter: brightness(1.15);
  }
}

@keyframes scanDrift {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(12px);
  }
}

@keyframes noiseFlick {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(-2%, 1%);
  }
}

@keyframes chromaShift {
  from {
    transform: translateX(-1%);
  }
  to {
    transform: translateX(1.2%);
  }
}

@keyframes copyBreath {
  0%,
  100% {
    opacity: 0.88;
  }
  50% {
    opacity: 1;
  }
}
</style>

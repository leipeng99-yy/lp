<template>
  <section class="temporal-disorder" :class="['is-' + mode, { 'is-dim': dim }]">
    <div class="temporal-disorder__stage">
      <video
        v-for="(src, i) in layerSrcs"
        :key="mode + '-' + i"
        :ref="'layer' + i"
        class="temporal-disorder__video"
        :class="'layer-' + i"
        :src="src"
        muted
        playsinline
        preload="auto"
      />
    </div>

    <div class="temporal-disorder__blackout" :style="{ opacity: blackout }" />
    <div class="temporal-disorder__scan" aria-hidden="true" />
    <div class="temporal-disorder__noise" aria-hidden="true" />
    <div class="temporal-disorder__tear" aria-hidden="true" />

    <div class="temporal-disorder__copy">
      <p class="temporal-disorder__eyebrow">{{ eyebrow }}</p>
      <h1 class="temporal-disorder__title">{{ title }}</h1>
      <p class="temporal-disorder__lead">{{ lead }}</p>
    </div>
  </section>
</template>

<script>
import { videoList } from '@/utils/videos'

export default {
  name: 'TemporalDisorder',
  props: {
    mode: { type: String, default: 'open' }, // open | close
    dim: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    eyebrow: { type: String, default: 'TEMPORAL DRIFT · SIGNAL UNSTABLE' },
    title: { type: String, default: '时空正在失序。' },
    lead: { type: String, default: '轴线正在撕裂。请屏息。' }
  },
  data() {
    return {
      blackout: 0,
      pulseTimer: null,
      running: false,
      layerSrcs: []
    }
  },
  watch: {
    active(val) {
      if (val) this.startPulse()
      else this.stopPulse()
    }
  },
  mounted() {
    const list = videoList.map((v) => v.src)
    if (this.mode === 'close') {
      this.layerSrcs = list.slice(-3).length ? list.slice(-3) : list.slice(0, 3)
    } else {
      this.layerSrcs = list.slice(0, Math.min(4, list.length))
    }
    this.$nextTick(() => {
      this.bootVideos()
      if (this.active) this.startPulse()
    })
  },
  beforeDestroy() {
    this.stopPulse()
  },
  methods: {
    getVideos() {
      const result = []
      for (let i = 0; i < this.layerSrcs.length; i++) {
        const ref = this.$refs['layer' + i]
        const el = Array.isArray(ref) ? ref[0] : ref
        if (el) result.push(el)
      }
      return result
    },
    bootVideos() {
      this.getVideos().forEach((video, i) => {
        const boot = () => {
          try {
            const dur = video.duration && !Number.isNaN(video.duration) ? video.duration : 4
            video.currentTime = Math.min(dur * 0.2 * (i + 1), Math.max(0.1, dur - 0.2))
            video.playbackRate = 8 + i * 1.5
            const p = video.play()
            if (p && p.catch) p.catch(() => {})
          } catch (e) {
            /* ignore */
          }
        }
        if (video.readyState >= 1) boot()
        else video.addEventListener('loadedmetadata', boot, { once: true })
      })
    },
    startPulse() {
      this.stopPulse()
      this.running = true
      this.$emit('disorder-pulse', true)
      const tick = () => {
        if (!this.running) return
        const roll = Math.random()
        // black flash burst
        if (roll > 0.35) {
          this.blackout = 0.92 + Math.random() * 0.08
          this.applyVideoChaos(true)
          this.$emit('stutter', { hard: true })
          this.pulseTimer = window.setTimeout(() => {
            this.blackout = Math.random() > 0.55 ? 0 : 0.15 + Math.random() * 0.25
            this.applyVideoChaos(false)
            this.$emit('stutter', { hard: false })
            const gap = 70 + Math.random() * 280
            this.pulseTimer = window.setTimeout(tick, gap)
          }, 60 + Math.random() * 180)
        } else {
          this.blackout = 0
          this.applyVideoChaos(true)
          this.$emit('stutter', { hard: false, soft: true })
          this.pulseTimer = window.setTimeout(() => {
            this.applyVideoChaos(false)
            this.pulseTimer = window.setTimeout(tick, 90 + Math.random() * 220)
          }, 100 + Math.random() * 160)
        }
      }
      tick()
    },
    applyVideoChaos(intense) {
      this.getVideos().forEach((video, i) => {
        try {
          if (intense) {
            video.playbackRate = 9 + Math.random() * 6 + i
            if (Math.random() > 0.55 && video.duration) {
              const jump = Math.random() * Math.min(1.2, video.duration * 0.08)
              video.currentTime = Math.min(
                video.duration - 0.05,
                Math.max(0.05, video.currentTime + (Math.random() > 0.5 ? jump : -jump))
              )
            }
          } else {
            video.playbackRate = 1.2 + Math.random() * 1.5
          }
          if (video.paused) {
            const p = video.play()
            if (p && p.catch) p.catch(() => {})
          }
        } catch (e) {
          /* ignore */
        }
      })
    },
    stopPulse() {
      this.running = false
      if (this.pulseTimer) clearTimeout(this.pulseTimer)
      this.pulseTimer = null
      this.blackout = 0
      this.$emit('disorder-pulse', false)
      this.getVideos().forEach((video) => {
        try {
          video.playbackRate = 1
        } catch (e) {
          /* ignore */
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.temporal-disorder {
  position: fixed;
  inset: 0;
  z-index: 40;
  overflow: hidden;
  background: #020308;
  transition: filter 0.6s ease;

  &.is-dim {
    filter: brightness(0.5) saturate(0.55);
  }

  &.is-close {
    z-index: 65;
  }

  &__stage {
    position: absolute;
    inset: -3%;
  }

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: contrast(1.25) saturate(0.65) brightness(0.78);

    &.layer-1 {
      mix-blend-mode: screen;
      opacity: 0.45;
      transform: scale(1.08) translate(1.5%, -1%);
      filter: contrast(1.4) hue-rotate(-18deg) brightness(0.7);
    }

    &.layer-2 {
      mix-blend-mode: lighten;
      opacity: 0.28;
      transform: scale(1.12) translate(-2%, 1%);
      filter: contrast(1.5) hue-rotate(12deg);
    }

    &.layer-3 {
      mix-blend-mode: overlay;
      opacity: 0.22;
      transform: scaleX(-1) scale(1.05);
    }
  }

  &__blackout {
    position: absolute;
    inset: 0;
    background: #000;
    pointer-events: none;
    z-index: 3;
    transition: opacity 40ms linear;
  }

  &__scan {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    opacity: 0.4;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.22) 0,
      rgba(0, 0, 0, 0.22) 1px,
      transparent 1px,
      transparent 3px
    );
    animation: scanMove 2.4s linear infinite;
  }

  &__noise {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    opacity: 0.14;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    animation: noiseJump 0.14s steps(2) infinite;
  }

  &__tear {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    box-shadow: inset 0 0 100px rgba(176, 30, 58, 0.22);
    background: linear-gradient(90deg, rgba(176, 30, 58, 0.08), transparent 35%, rgba(100, 160, 255, 0.07));
    mix-blend-mode: screen;
    animation: chroma 1.6s ease-in-out infinite alternate;
  }

  &__copy {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 28px;
    background: radial-gradient(ellipse 50% 40% at 50% 48%, rgba(2, 3, 8, 0.1), rgba(2, 3, 8, 0.55));
    pointer-events: none;
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
    font-size: clamp(30px, 6.5vw, 56px);
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    line-height: 1.3;
    text-shadow: 0 0 36px rgba(176, 30, 58, 0.35);
  }

  &__lead {
    margin: 18px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.22em;
    color: var(--text-muted);
  }
}

@keyframes scanMove {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(10px);
  }
}

@keyframes noiseJump {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(-2%, 1%);
  }
}

@keyframes chroma {
  from {
    transform: translateX(-1%);
  }
  to {
    transform: translateX(1%);
  }
}
</style>

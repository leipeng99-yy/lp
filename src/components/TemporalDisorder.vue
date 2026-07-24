<template>
  <section
    class="temporal-disorder"
    :class="['is-' + mode, { 'is-dim': dim, 'is-burst': bursting, 'is-lite': isLite }]"
  >
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
        webkit-playsinline
        preload="metadata"
      />
    </div>

    <div class="temporal-disorder__axis" aria-hidden="true" />
    <div class="temporal-disorder__blackout" :style="{ opacity: blackout }" />
    <div v-if="!isLite" class="temporal-disorder__scan" aria-hidden="true" />
    <div v-if="!isLite" class="temporal-disorder__grain" aria-hidden="true" />

    <div class="temporal-disorder__copy">
      <p class="temporal-disorder__eyebrow">{{ eyebrow }}</p>
      <h1 class="temporal-disorder__title">{{ title }}</h1>
      <p class="temporal-disorder__lead">{{ lead }}</p>
    </div>
  </section>
</template>

<script>
import { videoList } from '@/utils/videos'
import { isMobileDevice } from '@/utils/device'

export default {
  name: 'TemporalDisorder',
  props: {
    mode: { type: String, default: 'open' },
    dim: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    sparse: { type: Boolean, default: false },
    eyebrow: { type: String, default: '' },
    title: { type: String, default: '' },
    lead: { type: String, default: '' }
  },
  data() {
    return {
      blackout: 0,
      bursting: false,
      pulseTimer: null,
      running: false,
      layerSrcs: [],
      isLite: isMobileDevice()
    }
  },
  watch: {
    active(val) {
      if (val) this.startPulse()
      else this.stopPulse(true)
    },
    sparse() {
      if (this.active) this.startPulse()
    }
  },
  mounted() {
    const list = videoList.map((v) => v.src)
    const count = this.isLite ? 1 : this.mode === 'close' ? 2 : 2
    if (this.mode === 'close') {
      this.layerSrcs = list.slice(-count)
    } else {
      this.layerSrcs = list.slice(0, count)
    }
    this.$nextTick(() => {
      this.bootVideos()
      if (this.active) this.startPulse()
    })
  },
  beforeDestroy() {
    this.stopPulse(true)
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
            video.currentTime = Math.min(dur * (0.15 + i * 0.12), Math.max(0.1, dur - 0.2))
            // 手机少用超高 playbackRate
            video.playbackRate = this.isLite ? 1.25 : 3.5 + i
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
    calmGap() {
      if (this.sparse) return 2800 + Math.random() * 1800
      // 收束紊乱更疏，更像穿梭拉长
      if (this.mode === 'close') return 1800 + Math.random() * 1400
      return 1400 + Math.random() * 1200
    },
    startPulse() {
      this.stopPulse(false)
      this.running = true
      this.applyVideoChaos(false)
      const schedule = () => {
        if (!this.running) return
        this.pulseTimer = window.setTimeout(() => this.doBurst(schedule), this.calmGap())
      }
      this.pulseTimer = window.setTimeout(
        () => this.doBurst(schedule),
        this.sparse ? 1600 : this.mode === 'close' ? 1200 : 900
      )
    },
    doBurst(schedule) {
      if (!this.running) return
      this.bursting = true
      this.blackout = 0.95
      this.applyVideoChaos(true)
      this.$emit('stutter', { hard: true })

      const flashMs = this.isLite ? 120 + Math.random() * 80 : 90 + Math.random() * 100
      this.pulseTimer = window.setTimeout(() => {
        if (!this.isLite && Math.random() > 0.6) {
          this.blackout = 0.15
          this.pulseTimer = window.setTimeout(() => {
            this.blackout = 0.9
            this.applyVideoChaos(true)
            this.pulseTimer = window.setTimeout(() => this.endBurst(schedule), 70 + Math.random() * 80)
          }, 70)
        } else {
          this.endBurst(schedule)
        }
      }, flashMs)
    },
    endBurst(schedule) {
      this.blackout = 0
      this.bursting = false
      this.applyVideoChaos(false)
      this.$emit('stutter', { hard: false })
      if (typeof schedule === 'function') schedule()
    },
    applyVideoChaos(intense) {
      this.getVideos().forEach((video, i) => {
        try {
          if (intense) {
            if (this.isLite) {
              // 手机：短跳帧 + 轻微加速，避免解码炸
              video.playbackRate = 1.6 + Math.random() * 0.6
              if (video.duration) {
                const jump = 0.25 + Math.random() * 0.55
                video.currentTime = Math.min(
                  video.duration - 0.05,
                  Math.max(0.05, video.currentTime + (Math.random() > 0.5 ? jump : -jump * 0.4))
                )
              }
            } else {
              video.playbackRate = 12 + Math.random() * 6 + i * 0.5
              if (video.duration) {
                const jump = 0.4 + Math.random() * 1.2
                video.currentTime = Math.min(
                  video.duration - 0.05,
                  Math.max(0.05, video.currentTime + (Math.random() > 0.5 ? jump : -jump * 0.5))
                )
              }
            }
          } else if (this.isLite) {
            video.playbackRate = 1.15
          } else {
            video.playbackRate = 3 + Math.random() * 1.5 + i * 0.2
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
    stopPulse(resetRate) {
      this.running = false
      if (this.pulseTimer) clearTimeout(this.pulseTimer)
      this.pulseTimer = null
      this.blackout = 0
      this.bursting = false
      if (resetRate) {
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
}
</script>

<style lang="scss" scoped>
.temporal-disorder {
  position: fixed;
  inset: 0;
  z-index: 40;
  overflow: hidden;
  background: #020308;
  transition: filter 0.8s ease;

  &.is-dim {
    filter: brightness(0.48) saturate(0.5);
  }

  &.is-close {
    z-index: 65;
  }

  &.is-burst .temporal-disorder__stage {
    transform: scale(1.06);
  }

  &.is-lite.is-burst .temporal-disorder__stage {
    transform: scale(1.03);
  }

  &__stage {
    position: absolute;
    inset: -3%;
    transition: transform 0.12s ease;
  }

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;

    &.layer-1 {
      mix-blend-mode: screen;
      opacity: 0.32;
      transform: scale(1.05) translate(1%, -0.6%);
    }
  }

  &.is-lite &__video {
    filter: none;

    &.layer-1 {
      display: none;
    }
  }

  &:not(.is-lite) &__video {
    filter: contrast(1.15) saturate(0.7) brightness(0.8);
  }

  &__axis {
    position: absolute;
    left: 50%;
    top: 18%;
    bottom: 18%;
    width: 1px;
    transform: translateX(-50%);
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(200, 208, 220, 0.35) 20%,
      rgba(176, 30, 58, 0.45) 50%,
      rgba(200, 208, 220, 0.35) 80%,
      transparent
    );
    opacity: 0.55;
    animation: axisBreath 3.6s ease-in-out infinite;
  }

  &__blackout {
    position: absolute;
    inset: 0;
    background: #000;
    pointer-events: none;
    z-index: 3;
    transition: opacity 50ms linear;
  }

  &__scan {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    opacity: 0.2;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.18) 0,
      rgba(0, 0, 0, 0.18) 1px,
      transparent 1px,
      transparent 4px
    );
  }

  &__grain {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    opacity: 0.07;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
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
    background: radial-gradient(ellipse 48% 38% at 50% 48%, rgba(2, 3, 8, 0.08), rgba(2, 3, 8, 0.62));
    pointer-events: none;
  }

  &__eyebrow {
    margin: 0 0 18px;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.5em;
    text-indent: 0.5em;
    color: var(--accent-metal);
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(28px, 6vw, 52px);
    letter-spacing: 0.24em;
    text-indent: 0.24em;
    line-height: 1.35;
    text-shadow: 0 0 40px rgba(176, 30, 58, 0.28);
  }

  &__lead {
    margin: 20px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.24em;
    color: var(--text-muted);
  }
}

@keyframes axisBreath {
  0%,
  100% {
    opacity: 0.35;
    transform: translateX(-50%) scaleY(0.96);
  }
  50% {
    opacity: 0.7;
    transform: translateX(-50%) scaleY(1);
  }
}
</style>

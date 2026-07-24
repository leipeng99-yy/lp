<template>
  <section
    class="temporal-disorder"
    :class="['is-' + mode, { 'is-dim': dim, 'is-burst': bursting, 'is-lite': isLite }]"
  >
    <!-- 桌面 2 层 / 手机 1 路：真实视频 + 黑闪跳帧（精简截帧，非纯 CSS） -->
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
    if (this.isLite) {
      // 手机：单路视频，开场取前段，收束取末段
      this.layerSrcs = this.mode === 'close' ? [list[list.length - 1]] : [list[0]]
    } else {
      this.layerSrcs = this.mode === 'close' ? list.slice(-2) : list.slice(0, 2)
    }
    this.$nextTick(() => this.bootVideos())
    if (this.active) this.startPulse()
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
            video.playbackRate = this.isLite ? 4 + i * 0.5 : 3.5 + i
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
      // 收束：略密脉冲，体感更长的「被拉扯」
      if (this.mode === 'close') {
        return this.isLite ? 900 + Math.random() * 700 : 1100 + Math.random() * 900
      }
      return this.isLite ? 1400 + Math.random() * 900 : 1400 + Math.random() * 1200
    },
    startPulse() {
      this.stopPulse(false)
      this.running = true
      this.applyVideoChaos(false)
      const schedule = () => {
        if (!this.running) return
        this.pulseTimer = window.setTimeout(() => this.doBurst(schedule), this.calmGap())
      }
      const firstDelay = this.sparse ? 1600 : this.mode === 'close' ? 700 : 900
      this.pulseTimer = window.setTimeout(() => this.doBurst(schedule), firstDelay)
    },
    doBurst(schedule) {
      if (!this.running) return
      this.bursting = true
      this.blackout = 0.95
      this.applyVideoChaos(true)
      this.$emit('stutter', { hard: true })

      const flashMs = this.isLite ? 100 + Math.random() * 80 : 90 + Math.random() * 100
      this.pulseTimer = window.setTimeout(() => {
        const doubleFlash = this.isLite ? Math.random() > 0.4 : Math.random() > 0.6
        if (doubleFlash) {
          this.blackout = 0.12
          this.pulseTimer = window.setTimeout(() => {
            this.blackout = 0.9
            this.applyVideoChaos(true)
            this.pulseTimer = window.setTimeout(
              () => this.endBurst(schedule),
              this.isLite ? 80 + Math.random() * 60 : 70 + Math.random() * 80
            )
          }, this.isLite ? 70 : 70)
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
            // 手机：中倍速 + 偶发跳帧；桌面：更狠
            if (this.isLite) {
              video.playbackRate = 5 + Math.random() * 3
              if (video.duration && Math.random() > 0.25) {
                const jump = 0.3 + Math.random() * 0.6
                video.currentTime = Math.min(
                  video.duration - 0.05,
                  Math.max(0.05, video.currentTime + (Math.random() > 0.45 ? jump : -jump * 0.4))
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
          } else {
            video.playbackRate = this.isLite ? 3.2 + Math.random() * 1.2 : 3 + Math.random() * 1.5 + i * 0.2
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
            video.pause()
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
    transform: scale(1.05);
  }

  &.is-lite.is-burst .temporal-disorder__stage {
    transform: scale(1.04);
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
    filter: contrast(1.15) saturate(0.7) brightness(0.8);

    &.layer-1 {
      mix-blend-mode: screen;
      opacity: 0.32;
      transform: scale(1.05) translate(1%, -0.6%);
    }
  }

  &.is-lite &__video {
    filter: contrast(1.2) saturate(0.65) brightness(0.78);
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
      rgba(200, 208, 220, 0.4) 20%,
      rgba(176, 30, 58, 0.5) 50%,
      rgba(200, 208, 220, 0.4) 80%,
      transparent
    );
    opacity: 0.6;
    animation: axisBreath 3.6s ease-in-out infinite;
  }

  &.is-burst &__axis {
    opacity: 1;
    box-shadow: 0 0 24px rgba(200, 208, 220, 0.35);
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
    opacity: 0.2;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.18) 0,
      rgba(0, 0, 0, 0.18) 1px,
      transparent 1px,
      transparent 4px
    );
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
    opacity: 0.75;
    transform: translateX(-50%) scaleY(1);
  }
}
</style>

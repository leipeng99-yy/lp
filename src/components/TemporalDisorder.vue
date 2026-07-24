<template>
  <section
    class="temporal-disorder"
    :class="[
      'is-' + mode,
      {
        'is-dim': dim,
        'is-burst': bursting,
        'is-lite': isLite,
        'is-flashback': mode === 'close'
      }
    ]"
  >
    <!-- 回声散尽：照片软溶；开场紊乱：轻量视频 -->
    <div v-if="mode === 'close'" class="temporal-disorder__photos">
      <img
        v-for="(src, i) in photoSlots"
        :key="'ph-' + i + '-' + src"
        class="temporal-disorder__photo"
        :class="{ 'is-on': photoFocus === i }"
        :src="src"
        alt=""
      />
    </div>
    <div v-else class="temporal-disorder__stage">
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
        :style="layerStyle(i)"
      />
    </div>

    <div class="temporal-disorder__axis" aria-hidden="true" />
    <div class="temporal-disorder__blackout" :style="{ opacity: blackout }" />
    <div v-if="mode === 'close'" class="temporal-disorder__echo-veil" aria-hidden="true" />
    <div v-if="!isLite && mode !== 'close'" class="temporal-disorder__scan" aria-hidden="true" />

    <div class="temporal-disorder__copy">
      <p class="temporal-disorder__eyebrow">{{ eyebrow }}</p>
      <h1 class="temporal-disorder__title">{{ title }}</h1>
      <p class="temporal-disorder__lead">{{ lead }}</p>
    </div>
  </section>
</template>

<script>
import { videoList } from '@/utils/videos'
import { photosEarly, photosLate, photosMid, pick } from '@/utils/photos'
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
      focus: 0,
      photoSlots: ['', ''],
      photoFocus: 1,
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
    if (this.mode === 'close') {
      this.photoSlots = [pick(photosEarly()), pick(photosLate())]
      this.photoFocus = 1
    } else {
      const list = videoList.map((v) => v.src)
      this.layerSrcs = this.isLite
        ? [list[0], list[Math.min(1, list.length - 1)]]
        : list.slice(0, 2)
      this.focus = 0
      this.$nextTick(() => this.bootVideos())
    }
    if (this.active) this.startPulse()
  },
  beforeDestroy() {
    this.stopPulse(true)
  },
  methods: {
    layerStyle(i) {
      if (i === this.focus) return { opacity: 1, zIndex: 2 }
      return { opacity: this.bursting ? 0.45 : 0.28, zIndex: 1 }
    },
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
            video.playbackRate = this.isLite ? 4 + i * 0.4 : 3.5 + i
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
      if (this.mode === 'close') return 1100 + Math.random() * 900
      return this.isLite ? 1400 + Math.random() * 900 : 1400 + Math.random() * 1200
    },
    startPulse() {
      this.stopPulse(false)
      this.running = true
      if (this.mode !== 'close') this.applyVideoChaos(false)
      const schedule = () => {
        if (!this.running) return
        this.pulseTimer = window.setTimeout(() => this.doBurst(schedule), this.calmGap())
      }
      const firstDelay = this.sparse ? 1600 : this.mode === 'close' ? 500 : 900
      this.pulseTimer = window.setTimeout(() => this.doBurst(schedule), firstDelay)
    },
    wait(ms) {
      return new Promise((resolve) => {
        this.pulseTimer = window.setTimeout(resolve, ms)
      })
    },
    async doBurst(schedule) {
      if (!this.running) return
      this.bursting = true
      this.$emit('stutter', { hard: true })

      if (this.mode === 'close') await this.echoPhotoBurst()
      else await this.openBurst()

      this.endBurst(schedule)
    },
    async openBurst() {
      this.blackout = 0.95
      this.applyVideoChaos(true)
      this.focus = this.focus === 0 ? 1 : 0
      await this.wait(this.isLite ? 90 + Math.random() * 70 : 90 + Math.random() * 100)

      if (Math.random() > 0.45) {
        this.blackout = 0.15
        await this.wait(70)
        this.blackout = 0.88
        this.applyVideoChaos(true)
        this.focus = this.focus === 0 ? 1 : 0
        await this.wait(70 + Math.random() * 60)
      }
    },
    async echoPhotoBurst() {
      // 柔和溶镜：短暗 → 起点 → 淡暗 → 尽头（偶发中段）
      if (!this.running) return
      this.blackout = 0.55
      await this.wait(90 + Math.random() * 50)
      if (!this.running) return

      this.$set(this.photoSlots, 0, pick(photosEarly()))
      this.photoFocus = 0
      this.blackout = 0.06
      await this.wait(240 + Math.random() * 140)
      if (!this.running) return

      this.blackout = 0.4
      await this.wait(100)
      if (!this.running) return

      this.$set(this.photoSlots, 1, pick(photosLate()))
      this.photoFocus = 1
      this.blackout = 0.05
      await this.wait(280 + Math.random() * 160)
      if (!this.running) return

      if (Math.random() > 0.55) {
        this.blackout = 0.35
        await this.wait(80)
        if (!this.running) return
        this.$set(this.photoSlots, 0, pick(photosMid()))
        this.photoFocus = 0
        this.blackout = 0.08
        await this.wait(200 + Math.random() * 100)
        if (!this.running) return
        this.blackout = 0.3
        await this.wait(70)
        this.$set(this.photoSlots, 1, pick(photosLate()))
        this.photoFocus = 1
        this.blackout = 0.05
        await this.wait(180)
      }
    },
    endBurst(schedule) {
      this.blackout = 0
      this.bursting = false
      if (this.mode !== 'close') this.applyVideoChaos(false)
      this.$emit('stutter', { hard: false })
      if (typeof schedule === 'function') schedule()
    },
    applyVideoChaos(intense) {
      this.getVideos().forEach((video, i) => {
        try {
          if (intense) {
            video.playbackRate = this.isLite ? 5 + Math.random() * 2.5 : 12 + Math.random() * 6 + i * 0.5
            if (video.duration && Math.random() > 0.35) {
              const jump = 0.25 + Math.random() * 0.8
              video.currentTime = Math.min(
                video.duration - 0.05,
                Math.max(0.05, video.currentTime + (Math.random() > 0.5 ? jump : -jump * 0.4))
              )
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
      if (resetRate && this.mode !== 'close') {
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

  &.is-burst.is-flashback .temporal-disorder__photos {
    transform: scale(1.03);
  }

  &.is-burst:not(.is-flashback) .temporal-disorder__stage {
    transform: scale(1.045);
  }

  &__photos {
    position: absolute;
    inset: -2%;
    transition: transform 0.35s ease;
  }

  &__photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    filter: saturate(0.55) contrast(1.05) brightness(0.88) sepia(0.12);
    transition: opacity 180ms ease;
    will-change: opacity;

    &.is-on {
      opacity: 1;
      z-index: 2;
    }
  }

  &__echo-veil {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    background:
      radial-gradient(ellipse 70% 55% at 50% 45%, transparent 0%, rgba(8, 6, 10, 0.35) 100%),
      linear-gradient(180deg, rgba(40, 28, 24, 0.12), transparent 40%, rgba(8, 10, 16, 0.35));
  }

  &__stage {
    position: absolute;
    inset: -3%;
    transition: transform 0.14s ease;
  }

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: contrast(1.15) saturate(0.7) brightness(0.82);
    transition: opacity 90ms ease;
    will-change: opacity;
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
    z-index: 5;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(200, 208, 220, 0.35) 20%,
      rgba(176, 30, 58, 0.45) 50%,
      rgba(200, 208, 220, 0.35) 80%,
      transparent
    );
    opacity: 0.45;
    animation: axisBreath 3.6s ease-in-out infinite;
  }

  &.is-burst &__axis {
    opacity: 0.85;
    box-shadow: 0 0 20px rgba(200, 208, 220, 0.3);
  }

  &__blackout {
    position: absolute;
    inset: 0;
    background: #000;
    pointer-events: none;
    z-index: 6;
    transition: opacity 70ms ease;
  }

  &.is-flashback &__blackout {
    background: #0a0809;
    transition: opacity 120ms ease;
  }

  &__scan {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
    opacity: 0.16;
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
    z-index: 8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 28px;
    background: radial-gradient(ellipse 42% 32% at 50% 48%, rgba(2, 3, 8, 0.12), rgba(2, 3, 8, 0.42));
    pointer-events: none;
  }

  &.is-flashback &__copy {
    background: radial-gradient(ellipse 36% 26% at 50% 48%, rgba(2, 3, 8, 0.08), rgba(2, 3, 8, 0.32));
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
    opacity: 0.3;
    transform: translateX(-50%) scaleY(0.96);
  }
  50% {
    opacity: 0.65;
    transform: translateX(-50%) scaleY(1);
  }
}
</style>

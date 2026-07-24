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
        :style="layerStyle(i)"
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
      // close：0=首(起点) 1=尾(尽头) 2=中段点缀；默认主显尾
      focus: 1,
      ghost: 0.12,
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
    const first = list[0]
    const last = list[list.length - 1]
    const mid = list[Math.floor(list.length / 2)] || last

    if (this.mode === 'close') {
      // 收束：首 / 尾 / 中 —— 闪现闪回
      this.layerSrcs = [first, last, mid]
      this.focus = 1
    } else if (this.isLite) {
      this.layerSrcs = [first, list[Math.min(1, list.length - 1)]]
      this.focus = 0
    } else {
      this.layerSrcs = list.slice(0, 2)
      this.focus = 0
    }

    this.$nextTick(() => this.bootVideos())
    if (this.active) this.startPulse()
  },
  beforeDestroy() {
    this.stopPulse(true)
  },
  methods: {
    layerStyle(i) {
      if (this.mode === 'close') {
        // 主层全显；非主层作轻微叠影；爆发时由 focus 切换
        if (i === this.focus) {
          return { opacity: 1, zIndex: 3 }
        }
        if (i === 2) {
          // 中段只在被 focus 时出现，平时几乎不可见
          return { opacity: this.focus === 2 ? 1 : 0, zIndex: 2 }
        }
        // 首↔尾：非焦点保留 ghost，形成叠影穿越感
        return { opacity: this.ghost, zIndex: 1 }
      }
      // 开场：主层 + 次层淡叠
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
            if (this.mode === 'close') {
              // 首偏开头、尾偏中后、中段中部
              const ratios = [0.12, 0.55, 0.35]
              video.currentTime = Math.min(dur * ratios[i], Math.max(0.08, dur - 0.2))
              video.playbackRate = this.isLite ? 3 + i * 0.2 : 3.2 + i * 0.3
            } else {
              video.currentTime = Math.min(dur * (0.15 + i * 0.12), Math.max(0.1, dur - 0.2))
              video.playbackRate = this.isLite ? 4 + i * 0.4 : 3.5 + i
            }
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
      if (this.mode === 'close') {
        return this.isLite ? 850 + Math.random() * 650 : 1000 + Math.random() * 800
      }
      return this.isLite ? 1400 + Math.random() * 900 : 1400 + Math.random() * 1200
    },
    startPulse() {
      this.stopPulse(false)
      this.running = true
      if (this.mode === 'close') {
        this.focus = 1
        this.ghost = 0.12
      }
      this.applyVideoChaos(false)
      const schedule = () => {
        if (!this.running) return
        this.pulseTimer = window.setTimeout(() => this.doBurst(schedule), this.calmGap())
      }
      const firstDelay = this.sparse ? 1600 : this.mode === 'close' ? 600 : 900
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

      if (this.mode === 'close') {
        await this.flashbackBurst()
      } else {
        await this.openBurst()
      }

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
    async flashbackBurst() {
      // 黑 → 闪回起点(首) → 淡 → 闪回尽头(尾) → 偶发中段
      if (!this.running) return
      this.blackout = 0.92
      this.ghost = 0.08
      await this.wait(70 + Math.random() * 40)
      if (!this.running) return

      this.focus = 0
      this.nudgeLayer(0, 0.08 + Math.random() * 0.15)
      this.applyVideoChaos(true, 0)
      this.blackout = 0.08
      await this.wait(100 + Math.random() * 70)
      if (!this.running) return

      this.blackout = 0.85
      await this.wait(55 + Math.random() * 35)
      if (!this.running) return

      this.focus = 1
      this.nudgeLayer(1, 0.4 + Math.random() * 0.35)
      this.applyVideoChaos(true, 1)
      this.blackout = 0.06
      await this.wait(110 + Math.random() * 90)
      if (!this.running) return

      if (Math.random() > 0.65) {
        this.blackout = 0.75
        await this.wait(45)
        if (!this.running) return
        this.focus = 2
        this.nudgeLayer(2, 0.25 + Math.random() * 0.3)
        this.applyVideoChaos(true, 2)
        this.blackout = 0.1
        await this.wait(90 + Math.random() * 50)
        if (!this.running) return
        this.blackout = 0.7
        await this.wait(40)
        if (!this.running) return
        this.focus = 1
        this.blackout = 0.05
        await this.wait(80)
      }

      this.ghost = 0.14
      this.focus = 1
    },
    nudgeLayer(index, ratio) {
      const videos = this.getVideos()
      const video = videos[index]
      if (!video || !video.duration) return
      try {
        const dur = video.duration
        video.currentTime = Math.min(Math.max(0.05, dur * ratio), dur - 0.08)
        if (video.paused) {
          const p = video.play()
          if (p && p.catch) p.catch(() => {})
        }
      } catch (e) {
        /* ignore */
      }
    },
    endBurst(schedule) {
      this.blackout = 0
      this.bursting = false
      this.applyVideoChaos(false)
      this.$emit('stutter', { hard: false })
      if (typeof schedule === 'function') schedule()
    },
    applyVideoChaos(intense, onlyIndex) {
      this.getVideos().forEach((video, i) => {
        if (onlyIndex != null && i !== onlyIndex) return
        try {
          if (intense) {
            if (this.isLite) {
              video.playbackRate = 5 + Math.random() * 2.5
              // 收束闪回已用 nudgeLayer；开场才偶发跳
              if (this.mode !== 'close' && video.duration && Math.random() > 0.35) {
                const jump = 0.25 + Math.random() * 0.5
                video.currentTime = Math.min(
                  video.duration - 0.05,
                  Math.max(0.05, video.currentTime + (Math.random() > 0.5 ? jump : -jump * 0.4))
                )
              }
            } else {
              video.playbackRate = this.mode === 'close' ? 6 + Math.random() * 4 : 12 + Math.random() * 6 + i * 0.5
              if (this.mode !== 'close' && video.duration) {
                const jump = 0.4 + Math.random() * 1.2
                video.currentTime = Math.min(
                  video.duration - 0.05,
                  Math.max(0.05, video.currentTime + (Math.random() > 0.5 ? jump : -jump * 0.5))
                )
              }
            }
          } else {
            video.playbackRate =
              this.mode === 'close'
                ? this.isLite
                  ? 2.6 + Math.random() * 0.8
                  : 2.8 + Math.random() * 1
                : this.isLite
                  ? 3.2 + Math.random() * 1.2
                  : 3 + Math.random() * 1.5 + i * 0.2
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
    transform: scale(1.045);
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

  &.is-flashback &__video {
    filter: contrast(1.18) saturate(0.62) brightness(0.8);
  }

  &.is-flashback &__video.layer-0 {
    transform: scale(1.03);
  }

  &.is-flashback &__video.layer-1 {
    transform: scale(1.01);
  }

  &.is-flashback &__video.layer-2 {
    transform: scale(1.06);
    filter: contrast(1.25) saturate(0.5) brightness(0.75) hue-rotate(-8deg);
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
    z-index: 4;
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
    z-index: 5;
    transition: opacity 55ms ease;
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
    z-index: 7;
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
    background: radial-gradient(ellipse 38% 28% at 50% 48%, rgba(2, 3, 8, 0.1), rgba(2, 3, 8, 0.36));
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

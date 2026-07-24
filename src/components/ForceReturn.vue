<template>
  <section class="force-return" :class="{ 'is-lite': isLite, 'is-exit': exiting }">
    <!-- 全屏叠层：首 ↔ 尾闪现闪回（手机/桌面统一；桌面额外一格中段） -->
    <div class="force-return__stack">
      <video
        v-for="(src, i) in sources"
        :key="'fr-' + i"
        :ref="'fv' + i"
        class="force-return__video"
        :class="'layer-' + i"
        :src="src"
        muted
        playsinline
        webkit-playsinline
        preload="metadata"
        :style="{ opacity: opacities[i] }"
      />
    </div>

    <div class="force-return__crush" />
    <div class="force-return__flash" :style="{ opacity: flash }" aria-hidden="true" />
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
      opacities: [0, 1, 0],
      flash: 0,
      jumpTimer: null,
      sequenceTimer: null,
      exitTimer: null,
      running: false,
      exiting: false,
      isLite: isMobileDevice()
    }
  },
  mounted() {
    const list = videoList.map((v) => v.src)
    const first = list[0]
    const last = list[list.length - 1]
    const mid = list[Math.floor(list.length / 2)] || last
    // 0 首 / 1 尾 / 2 中 —— 手机也保留三路叠层（同时播最多 2 路可见）
    this.sources = [first, last, mid]
    this.opacities = [0.08, 1, 0]
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
    showFocus(index) {
      const next = [0.06, 0.06, 0]
      next[index] = 1
      // 首尾互为 ghost
      if (index === 0) next[1] = 0.1
      if (index === 1) next[0] = 0.1
      this.opacities = next
    },
    nudge(index, ratio) {
      const videos = this.getVideos()
      const video = videos[index]
      if (!video || !video.duration) return
      try {
        video.currentTime = Math.min(Math.max(0.05, video.duration * ratio), video.duration - 0.08)
        video.playbackRate = this.isLite ? 2.6 + Math.random() * 1.6 : 3.2 + Math.random() * 2
        if (video.paused) {
          const p = video.play()
          if (p && p.catch) p.catch(() => {})
        }
      } catch (e) {
        /* ignore */
      }
    },
    wait(ms) {
      return new Promise((resolve) => {
        this.sequenceTimer = window.setTimeout(resolve, ms)
      })
    },
    async startBurst() {
      this.getVideos().forEach((video, i) => {
        const boot = () => {
          try {
            const ratios = [0.1, 0.5, 0.3]
            const dur = video.duration || 4
            video.currentTime = Math.min(dur * ratios[i], Math.max(0.08, dur - 0.2))
            video.playbackRate = this.isLite ? 2.8 : 3.2 + i * 0.4
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
      await this.runPingPong()
    },
    async runPingPong() {
      // 节奏：尾稳 → 闪首 → 闪尾 → 闪首 → 中段点缀 → 渐稳尾 → 收黑
      const steps = [
        { focus: 1, hold: 420, flash: 0.15, ratio: 0.45 },
        { focus: 0, hold: 160, flash: 0.75, ratio: 0.12 },
        { focus: 1, hold: 200, flash: 0.55, ratio: 0.62 },
        { focus: 0, hold: 140, flash: 0.8, ratio: 0.2 },
        { focus: 1, hold: 280, flash: 0.35, ratio: 0.7 },
        { focus: 2, hold: 150, flash: 0.65, ratio: 0.4 },
        { focus: 0, hold: 120, flash: 0.7, ratio: 0.08 },
        { focus: 1, hold: 360, flash: 0.25, ratio: 0.55 },
        { focus: 0, hold: 110, flash: 0.85, ratio: 0.15 },
        { focus: 1, hold: 500, flash: 0.2, ratio: 0.75 }
      ]

      // 循环约两轮再进入收束（总长约 8s 量级，配合 home 11s）
      for (let round = 0; round < 2 && this.running; round++) {
        for (let s = 0; s < steps.length && this.running; s++) {
          const step = steps[s]
          this.flash = step.flash
          await this.wait(45)
          this.showFocus(step.focus)
          this.nudge(step.focus, step.ratio)
          this.flash = Math.max(0, step.flash * 0.15)
          await this.wait(step.hold + (this.isLite ? 40 : 0))
        }
      }

      if (!this.running) return
      // 更自然退出：稳住尾层，再收黑
      this.exiting = true
      this.showFocus(1)
      this.nudge(1, 0.8)
      this.flash = 0.1
      await this.wait(400)
      this.flash = 0.35
      await this.wait(350)
      this.flash = 0.7
      await this.wait(400)
      this.flash = 1
      this.opacities = [0, 0, 0]
    },
    stopBurst() {
      this.running = false
      if (this.jumpTimer) clearTimeout(this.jumpTimer)
      this.jumpTimer = null
      if (this.sequenceTimer) clearTimeout(this.sequenceTimer)
      this.sequenceTimer = null
      if (this.exitTimer) clearTimeout(this.exitTimer)
      this.exitTimer = null
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
  animation: crushIn 9.5s cubic-bezier(0.55, 0.05, 0.35, 1) both;

  &.is-exit {
    animation: none;
    transform: scale(1.1);
    filter: contrast(1.35);
  }

  &__stack {
    position: absolute;
    inset: -4%;
    filter: contrast(1.18) saturate(0.58) brightness(0.82);
    transition: transform 0.8s ease;
  }

  &.is-exit &__stack {
    transform: scale(1.06);
    filter: contrast(1.3) saturate(0.4) brightness(0.55);
  }

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 95ms ease;
    will-change: opacity;

    &.layer-0 {
      transform: scale(1.04);
    }

    &.layer-1 {
      transform: scale(1.01);
    }

    &.layer-2 {
      transform: scale(1.08);
      filter: hue-rotate(-10deg) contrast(1.2);
    }
  }

  &__crush {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(2, 3, 8, 0.2) 42%, rgba(2, 3, 8, 0.88) 80%);
    animation: crushVeil 9.5s ease both;
  }

  &__flash {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: #000;
    pointer-events: none;
    transition: opacity 50ms ease;
  }

  &__copy {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 28px;
    animation: copyHold 9.5s ease both;
  }

  &.is-exit &__copy {
    opacity: 0.35;
    transition: opacity 0.8s ease;
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
  60% {
    transform: scale(1.07);
    filter: contrast(1.28);
  }
  100% {
    transform: scale(1.12);
    filter: contrast(1.4);
  }
}

@keyframes crushVeil {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

@keyframes copyHold {
  0% {
    opacity: 0;
  }
  14% {
    opacity: 1;
  }
  78% {
    opacity: 0.95;
  }
  100% {
    opacity: 0.55;
  }
}
</style>

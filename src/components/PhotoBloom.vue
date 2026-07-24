<template>
  <section
    class="photo-bloom"
    :class="{
      'is-active': active,
      'is-armed': armed,
      'is-pulse': pulsing,
      'is-returning': phase === 'returning',
      'is-brand': phase === 'brand'
    }"
  >
    <div class="photo-bloom__stage" ref="stage">
      <div class="photo-bloom__void" />
      <div class="photo-bloom__keyhole" aria-hidden="true" />
      <div class="photo-bloom__grade" />
      <div class="photo-bloom__grain" />

      <div class="photo-bloom__headline" v-show="!active">
        <p class="photo-bloom__eyebrow">DIALOGUE WITH THE PAST</p>
        <h2 class="photo-bloom__title">九十三把钥匙</h2>
        <p class="photo-bloom__desc">每一帧，都是一扇未关严的门。</p>
        <button class="photo-bloom__trigger" type="button" @click="bloom">
          开锁
        </button>
      </div>

      <div
        v-for="(photo, index) in photos"
        :key="photo.id"
        class="photo-bloom__card"
        :class="{
          'is-flying': active && phase !== 'brand',
          'is-collapse': phase === 'returning' || phase === 'brand'
        }"
        :style="cardStyle(index)"
      >
        <div class="photo-bloom__frame">
          <img :src="photo.src" :alt="'key-' + photo.id" loading="lazy" />
        </div>
      </div>

      <div class="photo-bloom__whisper" :class="{ 'is-show': active && phase === 'dialogue' }">
        <p class="photo-bloom__whisper-key">钥匙 No.{{ String(currentKey).padStart(2, '0') }}</p>
        <p class="photo-bloom__whisper-text">{{ currentWhisper }}</p>
      </div>

      <div class="photo-bloom__return" :class="{ 'is-show': phase === 'returning' }">
        <p class="photo-bloom__eyebrow">RETURNING</p>
        <h3>对话结束。</h3>
        <p>过去已经听见。</p>
        <p class="photo-bloom__return-last">现在，请回望此处。</p>
      </div>
    </div>

    <div class="photo-bloom__finale" :class="{ 'is-show': phase === 'brand' }" ref="brand">
      <div class="photo-bloom__finale-bg" :style="{ backgroundImage: `url(${finaleBg})` }" />
      <div class="photo-bloom__finale-veil" />
      <div class="photo-bloom__finale-copy">
        <p class="photo-bloom__eyebrow">RAY-BAN</p>
        <h2 class="photo-bloom__brand">全球热恋</h2>
        <p class="photo-bloom__finale-text">看见彼此的人，才会看见世界。</p>
        <p class="photo-bloom__finale-sub">爱情无需翻译。目光已经足够。</p>
      </div>
    </div>
  </section>
</template>

<script>
import { photoList, getPhoto } from '@/utils/photos'

const BPM = 156
const BEAT = 60 / BPM
const PHOTOS_PER_STEP = 1
const STEP_BEATS = 2
const FLY_BEATS = 12

const WHISPERS = [
  '你还在那里。',
  '我隔着很久，才学会如何看你。',
  '幸福是真的。遗憾也是。',
  '那天风很大，你却笑得很轻。',
  '若过去会说话，它只会再叫你一声。',
  '我们曾拥有整个世界——至少在那一张里。',
  '别急着醒来。让我再看一眼。',
  '钥匙转过之后，有些门就再也合不上了。'
]

export default {
  name: 'PhotoBloom',
  data() {
    return {
      photos: photoList,
      armed: false,
      active: false,
      phase: 'idle', // idle | dialogue | returning | brand
      pulsing: false,
      finaleBg: getPhoto(88),
      layouts: [],
      whisperIndex: 0,
      currentKey: 1,
      pulseTimer: null,
      whisperTimer: null,
      returningTimer: null,
      brandTimer: null
    }
  },
  computed: {
    currentWhisper() {
      return WHISPERS[this.whisperIndex % WHISPERS.length]
    }
  },
  mounted() {
    this.buildLayouts()
    window.addEventListener('resize', this.buildLayouts)
    this.observeArm()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.buildLayouts)
    if (this.armObserver) this.armObserver.disconnect()
    this.clearTimers()
  },
  methods: {
    clearTimers() {
      ;['pulseTimer', 'whisperTimer', 'returningTimer', 'brandTimer'].forEach((key) => {
        if (this[key]) {
          clearTimeout(this[key])
          clearInterval(this[key])
          this[key] = null
        }
      })
    },
    observeArm() {
      this.armObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) this.armed = true
          })
        },
        { threshold: 0.25 }
      )
      this.armObserver.observe(this.$el)
    },
    buildLayouts() {
      const count = this.photos.length
      const isMobile = window.innerWidth < 768
      const radiusX = Math.min(window.innerWidth, 1400) * (isMobile ? 0.4 : 0.45)
      const radiusY = Math.min(window.innerHeight, 900) * (isMobile ? 0.34 : 0.38)
      const step = BEAT * STEP_BEATS
      const duration = BEAT * FLY_BEATS

      this.layouts = this.photos.map((_, index) => {
        const t = index / count
        const angle = t * Math.PI * 2 * 3.4 + index * 0.19
        const spiral = 0.22 + t * 0.78
        const x = Math.cos(angle) * radiusX * spiral
        const y = Math.sin(angle) * radiusY * spiral * 0.9
        const z = (Math.sin(angle * 1.35) * 0.5 + 0.5) * (isMobile ? 200 : 380)
        const rot = ((index * 17) % 28) - 14
        const delay = index * step
        const width = isMobile ? 108 + (index % 4) * 10 : 160 + (index % 5) * 16
        const driftDelay = (index % 9) * 0.35
        return { x, y, z, rot, delay, duration, width, driftDelay }
      })
    },
    cardStyle(index) {
      const layout = this.layouts[index] || {
        x: 0,
        y: 0,
        z: 0,
        rot: 0,
        delay: 0,
        duration: BEAT * FLY_BEATS,
        width: 170,
        driftDelay: 0
      }

      if (!this.active) {
        return {
          width: layout.width + 'px',
          opacity: 0,
          filter: 'blur(10px)',
          transform: 'translate3d(-50%, -50%, -280px) scale(0.04) rotateX(22deg)',
          transitionDelay: '0s',
          transitionDuration: '0s',
          '--drift-delay': layout.driftDelay + 's'
        }
      }

      if (this.phase === 'returning' || this.phase === 'brand') {
        return {
          width: layout.width + 'px',
          opacity: this.phase === 'brand' ? 0 : 0.18,
          filter: 'blur(6px)',
          transform: 'translate3d(-50%, -50%, -120px) scale(0.2) rotateX(12deg)',
          transitionDuration: '2.4s',
          transitionDelay: (index % 8) * 0.04 + 's',
          '--drift-delay': layout.driftDelay + 's'
        }
      }

      return {
        width: layout.width + 'px',
        opacity: 1,
        filter: 'blur(0px)',
        transform: `translate3d(calc(-50% + ${layout.x}px), calc(-50% + ${layout.y}px), ${layout.z}px) rotate(${layout.rot}deg) scale(1)`,
        transitionDuration: layout.duration + 's',
        transitionDelay: layout.delay + 's',
        '--drift-delay': layout.driftDelay + 's'
      }
    },
    bloom() {
      if (this.active) return
      this.active = true
      this.phase = 'dialogue'
      this.currentKey = 1
      this.whisperIndex = 0
      this.$emit('bloom')
      this.startBeatPulse()
      this.startWhispers()

      const waves = this.photos.length
      const dialogueMs = (waves * BEAT * STEP_BEATS + BEAT * FLY_BEATS) * 1000

      this.returningTimer = window.setTimeout(() => {
        this.enterReturning()
      }, dialogueMs)
    },
    startWhispers() {
      const stepMs = BEAT * STEP_BEATS * 1000
      this.whisperTimer = window.setInterval(() => {
        if (this.phase !== 'dialogue') return
        this.currentKey = Math.min(this.currentKey + 1, this.photos.length)
        this.whisperIndex += 1
      }, stepMs)
    },
    startBeatPulse() {
      const measure = BEAT * 4 * 1000
      this.pulsing = true
      this.pulseTimer = window.setInterval(() => {
        this.pulsing = false
        this.$nextTick(() => {
          this.pulsing = true
        })
      }, measure)
    },
    enterReturning() {
      this.phase = 'returning'
      this.pulsing = false
      this.$emit('returning')
      if (this.whisperTimer) {
        clearInterval(this.whisperTimer)
        this.whisperTimer = null
      }
      if (this.pulseTimer) {
        clearInterval(this.pulseTimer)
        this.pulseTimer = null
      }

      this.brandTimer = window.setTimeout(() => {
        this.phase = 'brand'
        this.$emit('finale')
        this.$nextTick(() => {
          const el = this.$refs.brand
          if (el && el.scrollIntoView) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        })
      }, 4200)
    }
  }
}
</script>

<style lang="scss" scoped>
.photo-bloom {
  position: relative;
  z-index: 2;
  background:
    radial-gradient(ellipse 70% 55% at 50% 45%, rgba(122, 16, 40, 0.28) 0%, transparent 55%),
    radial-gradient(ellipse at center, #120814 0%, #05070c 72%);

  &__stage {
    position: relative;
    height: 100vh;
    min-height: 680px;
    perspective: 1400px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__void {
    position: absolute;
    width: 46vmin;
    height: 46vmin;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(176, 30, 58, 0.22) 0%, rgba(154, 168, 184, 0.06) 42%, transparent 70%);
    filter: blur(10px);
    animation: voidPulse calc(var(--beat) * 8) ease-in-out infinite;
    transition: transform 0.35s ease, opacity 0.35s ease;
  }

  &__keyhole {
    position: absolute;
    width: min(28vmin, 220px);
    height: min(28vmin, 220px);
    border: 1px solid rgba(200, 208, 220, 0.28);
    border-radius: 50%;
    box-shadow:
      inset 0 0 30px rgba(176, 30, 58, 0.15),
      0 0 40px rgba(200, 208, 220, 0.05);
    opacity: 0.55;
    transition: opacity 0.8s ease, transform 1.2s ease;
  }

  &.is-active .photo-bloom__keyhole {
    opacity: 0.25;
    transform: scale(1.35);
  }

  &.is-returning .photo-bloom__keyhole,
  &.is-brand .photo-bloom__keyhole {
    opacity: 0.7;
    transform: scale(0.85);
  }

  &.is-pulse .photo-bloom__void {
    transform: scale(1.12);
    opacity: 0.95;
  }

  &__grade {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(5, 7, 12, 0.2), rgba(5, 7, 12, 0.55)),
      radial-gradient(ellipse 80% 60% at 50% 100%, rgba(122, 16, 40, 0.25), transparent 55%);
    mix-blend-mode: multiply;
  }

  &__grain {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.07;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__headline {
    position: relative;
    z-index: 5;
    text-align: center;
    padding: 0 24px;
    transition: opacity 0.8s ease, transform 0.8s ease;
  }

  &.is-active .photo-bloom__headline {
    opacity: 0;
    transform: scale(1.06);
    pointer-events: none;
  }

  &__eyebrow {
    margin: 0 0 14px;
    font-family: var(--font-display);
    font-size: 13px;
    letter-spacing: 0.42em;
    color: var(--accent-metal);
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(36px, 8vw, 68px);
    letter-spacing: 0.16em;
    text-shadow: 0 0 40px rgba(176, 30, 58, 0.25);
  }

  &__desc {
    margin: 16px 0 0;
    font-weight: 300;
    font-size: 15px;
    letter-spacing: 0.2em;
    color: var(--text-muted);
  }

  &__trigger {
    margin-top: 36px;
    min-width: 160px;
    height: 52px;
    padding: 0 28px;
    border: 1px solid var(--metal-line);
    background:
      linear-gradient(135deg, rgba(200, 208, 220, 0.14), rgba(176, 30, 58, 0.22) 55%, rgba(5, 7, 12, 0.65));
    color: var(--text-primary);
    font-family: var(--font-display);
    font-size: 20px;
    letter-spacing: 0.4em;
    text-indent: 0.4em;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 10px 30px rgba(0, 0, 0, 0.35);
    transition: transform 0.35s ease, border-color 0.3s ease, box-shadow 0.35s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: var(--accent-metal);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.22),
        0 14px 40px var(--metal-glow);
    }
  }

  &__card {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 3;
    transform-style: preserve-3d;
    transform-origin: center center;
    transition-property: transform, opacity, filter;
    transition-timing-function: cubic-bezier(0.22, 1, 0.18, 1);
    pointer-events: none;
    will-change: transform, opacity, filter;

    &.is-flying .photo-bloom__frame {
      animation: floatDrift 8s ease-in-out infinite;
      animation-delay: calc(var(--drift-delay, 0s) + 4s);
    }
  }

  &__frame {
    border: 1px solid var(--metal-line);
    background: linear-gradient(145deg, rgba(200, 208, 220, 0.16), rgba(5, 7, 12, 0.2));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 18px 46px rgba(0, 0, 0, 0.55);
    padding: 3px;
  }

  &__frame img {
    width: 100%;
    height: auto;
    filter: contrast(1.16) saturate(0.68) brightness(0.88) hue-rotate(-8deg);
  }

  &__whisper {
    position: absolute;
    left: 50%;
    bottom: 9vh;
    z-index: 6;
    width: min(560px, 88vw);
    transform: translateX(-50%) translateY(12px);
    text-align: center;
    opacity: 0;
    transition: opacity 0.7s ease, transform 0.7s ease;
    pointer-events: none;

    &.is-show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  &__whisper-key {
    margin: 0 0 10px;
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 0.36em;
    color: rgba(200, 208, 220, 0.55);
  }

  &__whisper-text {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(16px, 3.2vw, 22px);
    letter-spacing: 0.18em;
    line-height: 1.7;
    color: var(--text-primary);
    text-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
  }

  &__return {
    position: absolute;
    inset: 0;
    z-index: 8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 28px;
    background: rgba(5, 7, 12, 0.42);
    backdrop-filter: blur(2px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 1.1s ease;

    &.is-show {
      opacity: 1;
    }

    h3 {
      margin: 0;
      font-family: var(--font-display);
      font-weight: 500;
      font-size: clamp(28px, 5vw, 42px);
      letter-spacing: 0.28em;
      text-indent: 0.28em;
    }

    p {
      margin: 16px 0 0;
      font-weight: 300;
      font-size: 15px;
      letter-spacing: 0.22em;
      color: var(--text-muted);
    }
  }

  &__return-last {
    color: var(--accent-metal) !important;
  }

  &__finale {
    position: relative;
    height: 100vh;
    min-height: 640px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 1.6s ease;

    &.is-show {
      opacity: 1;
    }
  }

  &__finale-bg {
    position: absolute;
    inset: -6%;
    background-size: cover;
    background-position: center;
    filter: brightness(0.5) saturate(0.72) contrast(1.12) hue-rotate(-6deg);
    transform: scale(1.08);
    animation: finaleDrift 16s ease-in-out infinite alternate;
  }

  &__finale-veil {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 50% 45%, transparent 0%, rgba(5, 7, 12, 0.55) 70%, rgba(5, 7, 12, 0.94) 100%),
      linear-gradient(180deg, rgba(122, 16, 40, 0.18), transparent 40%);
  }

  &__finale-copy {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 24px;
    transform: translateY(24px);
    opacity: 0;
    transition: opacity 1.2s ease 0.35s, transform 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.35s;
  }

  &__finale.is-show .photo-bloom__finale-copy {
    opacity: 1;
    transform: translateY(0);
  }

  &__brand {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(48px, 11vw, 96px);
    letter-spacing: 0.14em;
    text-indent: 0.14em;
    text-shadow: 0 0 48px rgba(176, 30, 58, 0.28);
  }

  &__finale-text {
    margin: 22px 0 0;
    font-weight: 300;
    font-size: 16px;
    letter-spacing: 0.22em;
    color: var(--text-muted);
  }

  &__finale-sub {
    margin: 14px 0 0;
    font-family: var(--font-display);
    font-size: 14px;
    letter-spacing: 0.28em;
    color: rgba(200, 208, 220, 0.62);
  }
}

@keyframes voidPulse {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.55;
  }
  50% {
    transform: scale(1.06);
    opacity: 0.85;
  }
}

@keyframes floatDrift {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes finaleDrift {
  from {
    transform: scale(1.08) translate3d(-1%, 0, 0);
  }
  to {
    transform: scale(1.14) translate3d(1%, 1%, 0);
  }
}
</style>

<template>
  <section
    class="photo-bloom"
    :class="{ 'is-active': active, 'is-armed': armed, 'is-pulse': pulsing }"
  >
    <div class="photo-bloom__stage" ref="stage">
      <div class="photo-bloom__void" />
      <div class="photo-bloom__grade" />
      <div class="photo-bloom__grain" />

      <div class="photo-bloom__headline" v-show="!active">
        <p class="photo-bloom__eyebrow">156 BPM · THE BLOOM</p>
        <h2 class="photo-bloom__title">九十三帧热恋</h2>
        <p class="photo-bloom__desc">踩着节拍绽放，让回忆铺满整个宇宙</p>
        <button class="photo-bloom__trigger" type="button" @click="bloom">
          绽放
        </button>
      </div>

      <div
        v-for="(photo, index) in photos"
        :key="photo.id"
        class="photo-bloom__card"
        :class="{ 'is-flying': active, 'is-downbeat': layouts[index] && layouts[index].downbeat }"
        :style="cardStyle(index)"
      >
        <div class="photo-bloom__frame">
          <img :src="photo.src" :alt="'frame-' + photo.id" loading="lazy" />
        </div>
      </div>
    </div>

    <div class="photo-bloom__finale" :class="{ 'is-show': showFinale }">
      <div class="photo-bloom__finale-bg" :style="{ backgroundImage: `url(${finaleBg})` }" />
      <div class="photo-bloom__finale-veil" />
      <div class="photo-bloom__finale-copy">
        <p class="photo-bloom__eyebrow">FOREVER</p>
        <h2 class="photo-bloom__brand">全球热恋</h2>
        <p class="photo-bloom__finale-text">爱是一场永不落幕的盛大。</p>
      </div>
    </div>
  </section>
</template>

<script>
import { photoList, getPhoto } from '@/utils/photos'

const BPM = 156
const BEAT = 60 / BPM
const PHOTOS_PER_STEP = 2
const STEP_BEATS = 2
const FLY_BEATS = 10

export default {
  name: 'PhotoBloom',
  data() {
    return {
      photos: photoList,
      armed: false,
      active: false,
      showFinale: false,
      pulsing: false,
      finaleBg: getPhoto(88),
      layouts: [],
      pulseTimer: null,
      finaleTimer: null
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
      if (this.pulseTimer) {
        clearInterval(this.pulseTimer)
        this.pulseTimer = null
      }
      if (this.finaleTimer) {
        clearTimeout(this.finaleTimer)
        this.finaleTimer = null
      }
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
        const wave = Math.floor(index / PHOTOS_PER_STEP)
        const angle = t * Math.PI * 2 * 3.4 + index * 0.19
        const spiral = 0.22 + t * 0.78
        const x = Math.cos(angle) * radiusX * spiral
        const y = Math.sin(angle) * radiusY * spiral * 0.9
        const z = (Math.sin(angle * 1.35) * 0.5 + 0.5) * (isMobile ? 200 : 380)
        const rot = ((index * 17) % 28) - 14
        const delay = wave * step
        const downbeat = wave % 2 === 0
        const width = isMobile ? 108 + (index % 4) * 10 : 160 + (index % 5) * 16
        const driftDelay = (index % 9) * 0.35
        return { x, y, z, rot, delay, duration, width, downbeat, driftDelay }
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
          transform: 'translate3d(-50%, -50%, 0) scale(0.06) rotateX(18deg)',
          transitionDelay: '0s',
          transitionDuration: '0s',
          '--drift-delay': layout.driftDelay + 's'
        }
      }

      return {
        width: layout.width + 'px',
        opacity: 1,
        transform: `translate3d(calc(-50% + ${layout.x}px), calc(-50% + ${layout.y}px), ${layout.z}px) rotate(${layout.rot}deg) scale(1)`,
        transitionDuration: layout.duration + 's',
        transitionDelay: layout.delay + 's',
        '--drift-delay': layout.driftDelay + 's'
      }
    },
    bloom() {
      if (this.active) return
      this.active = true
      this.$emit('bloom')
      this.startBeatPulse()

      const waves = Math.ceil(this.photos.length / PHOTOS_PER_STEP)
      const total = waves * BEAT * STEP_BEATS + BEAT * FLY_BEATS + BEAT * 2

      this.finaleTimer = window.setTimeout(() => {
        this.showFinale = true
        this.pulsing = false
        this.clearTimers()
        this.$emit('finale')
      }, total * 1000)
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
    background: radial-gradient(circle, rgba(176, 30, 58, 0.32) 0%, rgba(154, 168, 184, 0.08) 42%, transparent 70%);
    filter: blur(10px);
    animation: voidPulse calc(var(--beat) * 4) ease-in-out infinite;
    transition: transform 0.12s ease, opacity 0.12s ease;
  }

  &.is-pulse .photo-bloom__void {
    transform: scale(1.22);
    opacity: 1;
    background: radial-gradient(circle, rgba(200, 208, 220, 0.28) 0%, rgba(176, 30, 58, 0.4) 35%, transparent 72%);
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
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  &.is-active .photo-bloom__headline {
    opacity: 0;
    transform: scale(1.08);
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
    transition-property: transform, opacity;
    transition-timing-function: cubic-bezier(0.22, 1, 0.18, 1);
    pointer-events: none;
    will-change: transform, opacity;

    &.is-flying {
      opacity: 1;
    }

    &.is-flying .photo-bloom__frame {
      animation: floatDrift 7.2s ease-in-out infinite;
      animation-delay: calc(var(--drift-delay, 0s) + 3.2s);
    }

    &.is-downbeat.is-flying .photo-bloom__frame {
      box-shadow:
        0 0 0 1px rgba(200, 208, 220, 0.55),
        0 0 24px rgba(176, 30, 58, 0.35),
        0 22px 50px rgba(0, 0, 0, 0.55);
    }
  }

  &__frame {
    border: 1px solid var(--metal-line);
    background: linear-gradient(145deg, rgba(200, 208, 220, 0.16), rgba(5, 7, 12, 0.2));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 18px 46px rgba(0, 0, 0, 0.55);
    padding: 3px;
    transition: box-shadow 0.35s ease;
  }

  &__frame img {
    width: 100%;
    height: auto;
    filter: contrast(1.14) saturate(0.72) brightness(0.9) hue-rotate(-8deg);
  }

  &__finale {
    position: relative;
    height: 100vh;
    min-height: 640px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.3;
    transition: opacity 1.4s ease;

    &.is-show {
      opacity: 1;
    }
  }

  &__finale-bg {
    position: absolute;
    inset: -6%;
    background-size: cover;
    background-position: center;
    filter: brightness(0.48) saturate(0.7) contrast(1.1) hue-rotate(-8deg);
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
    transition: opacity 1.1s ease 0.25s, transform 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.25s;
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
    margin: 20px 0 0;
    font-weight: 300;
    font-size: 16px;
    letter-spacing: 0.22em;
    color: var(--text-muted);
  }
}

@keyframes voidPulse {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.65;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.95;
  }
}

@keyframes floatDrift {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
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

<template>
  <section class="force-return" :class="{ 'is-exit': exiting }">
    <!-- 时空坍塌：仅用 collapsePhotos，与回声池互不重复 -->
    <div class="force-return__stack" :style="{ transform: 'scale(' + crushScale + ')' }">
      <img class="force-return__photo is-base" :src="baseSrc" alt="" />
      <img
        class="force-return__photo is-flash"
        :class="{ 'is-on': flashOn }"
        :src="flashSrc"
        alt=""
      />
    </div>

    <div class="force-return__crush" />
    <div class="force-return__flash" :style="{ opacity: flash }" aria-hidden="true" />
    <div class="force-return__rift" aria-hidden="true" />
    <div class="force-return__copy">
      <p class="force-return__eyebrow">FORCED RETURN · NOW</p>
      <h2 class="force-return__title">时空坍塌。</h2>
      <p class="force-return__sub">没有人能把昨日据为己有。</p>
    </div>
  </section>
</template>

<script>
import { collapsePhotos, createPicker } from '@/utils/photos'

export default {
  name: 'ForceReturn',
  data() {
    return {
      baseSrc: '',
      flashSrc: '',
      flashOn: false,
      flash: 0,
      crushScale: 1,
      sequenceTimer: null,
      running: false,
      exiting: false,
      pickCollapse: null
    }
  },
  mounted() {
    this.pickCollapse = createPicker(collapsePhotos)
    this.baseSrc = this.pickCollapse()
    this.flashSrc = this.pickCollapse()
    this.running = true
    this.runCollapse()
  },
  beforeDestroy() {
    this.stopBurst()
  },
  methods: {
    wait(ms) {
      return new Promise((resolve) => {
        this.sequenceTimer = window.setTimeout(resolve, ms)
      })
    },
    nextPhoto() {
      return (this.pickCollapse || createPicker(collapsePhotos))()
    },
    async hardCut(src, hold, blackMs) {
      if (!this.running) return
      this.flash = 0.92
      await this.wait(blackMs != null ? blackMs : 35 + Math.random() * 30)
      if (!this.running) return
      this.flashSrc = src
      this.flashOn = true
      this.baseSrc = src
      this.flash = 0
      await this.wait(hold)
      this.flashOn = false
    },
    async runCollapse() {
      for (let i = 0; i < 10 && this.running; i++) {
        this.crushScale = 1 + i * 0.012
        await this.hardCut(this.nextPhoto(), 70 + Math.random() * 55, 28 + Math.random() * 25)
      }

      for (let i = 0; i < 6 && this.running; i++) {
        this.crushScale = 1.12 + i * 0.02
        await this.hardCut(this.nextPhoto(), 90 + Math.random() * 40, 40)
        if (!this.running) return
        await this.hardCut(this.nextPhoto(), 100 + Math.random() * 50, 40)
      }

      if (this.running) {
        this.crushScale = 1.28
        await this.hardCut(this.nextPhoto(), 120, 50)
        await this.hardCut(this.nextPhoto(), 80, 35)
        await this.hardCut(this.nextPhoto(), 140, 45)
      }

      if (!this.running) return
      this.exiting = true
      this.crushScale = 1.38
      await this.hardCut(this.nextPhoto(), 280, 60)
      if (!this.running) return
      this.crushScale = 1.48
      await this.hardCut(this.nextPhoto(), 320, 50)
      this.flash = 0.35
      await this.wait(200)
      this.flash = 0.7
      await this.wait(280)
      this.flash = 1
      this.flashOn = false
    },
    stopBurst() {
      this.running = false
      if (this.sequenceTimer) clearTimeout(this.sequenceTimer)
      this.sequenceTimer = null
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
  background: #000;
  animation: crushIn 9.5s cubic-bezier(0.55, 0.05, 0.35, 1) both;

  &.is-exit {
    animation: none;
  }

  &__stack {
    position: absolute;
    inset: -6%;
    transition: transform 0.18s cubic-bezier(0.55, 0.05, 0.35, 1);
    filter: contrast(1.35) saturate(0.45) brightness(0.78);
  }

  &.is-exit &__stack {
    filter: contrast(1.55) saturate(0.25) brightness(0.45);
  }

  &__photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;

    &.is-base {
      opacity: 1;
      z-index: 1;
    }

    &.is-flash {
      opacity: 0;
      z-index: 2;
      transition: none;

      &.is-on {
        opacity: 1;
      }
    }
  }

  &__crush {
    position: absolute;
    inset: 0;
    z-index: 3;
    background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.15) 35%, rgba(0, 0, 0, 0.92) 78%);
    animation: crushVeil 9.5s ease both;
    pointer-events: none;
  }

  &__rift {
    position: absolute;
    left: 50%;
    top: 10%;
    bottom: 10%;
    width: 2px;
    transform: translateX(-50%) scaleY(0.2);
    z-index: 4;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(220, 230, 255, 0.55) 30%,
      rgba(176, 30, 58, 0.7) 50%,
      rgba(220, 230, 255, 0.55) 70%,
      transparent
    );
    opacity: 0.85;
    animation: riftGrow 9.5s ease-out both;
    box-shadow: 0 0 28px rgba(200, 210, 255, 0.35);
  }

  &__flash {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: #000;
    pointer-events: none;
  }

  &__copy {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 28px;
    animation: copyHold 9.5s ease both;
  }

  &.is-exit &__copy {
    opacity: 0.25;
    transition: opacity 0.7s ease;
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
  }
  100% {
    transform: scale(1.04);
  }
}

@keyframes crushVeil {
  0% {
    opacity: 0.25;
  }
  100% {
    opacity: 1;
  }
}

@keyframes riftGrow {
  0% {
    transform: translateX(-50%) scaleY(0.15);
    opacity: 0.4;
  }
  55% {
    transform: translateX(-50%) scaleY(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) scaleY(1.05);
    opacity: 0.55;
  }
}

@keyframes copyHold {
  0% {
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  72% {
    opacity: 0.95;
  }
  100% {
    opacity: 0.4;
  }
}
</style>

<template>
  <transition name="gate">
    <section v-if="visible" class="intro-gate">
      <div class="intro-gate__bg" :style="{ backgroundImage: `url(${bg})` }" />
      <div class="intro-gate__veil" />
      <div class="intro-gate__grain" />

      <div class="intro-gate__content">
        <p class="intro-gate__eyebrow">RAY-BAN · ACROSS TIME</p>
        <h1 class="intro-gate__brand">全球热恋</h1>
        <p class="intro-gate__lead">有些目光，只能隔着时间抵达。</p>
        <button class="intro-gate__cta" type="button" @click="onStart">
          <span class="intro-gate__cta-glow" />
          <span class="intro-gate__cta-text">回到那时</span>
        </button>
        <p class="intro-gate__hint">启程后将播放音乐</p>
      </div>

      <div class="intro-gate__scroll-hint" aria-hidden="true">
        <span />
      </div>
    </section>
  </transition>
</template>

<script>
import { getPhoto } from '@/utils/photos'

export default {
  name: 'IntroGate',
  props: {
    visible: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      bg: getPhoto(26)
    }
  },
  methods: {
    onStart() {
      this.$emit('start')
    }
  }
}
</script>

<style lang="scss" scoped>
.intro-gate {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-deep);

  &__bg {
    position: absolute;
    inset: -8%;
    background-size: cover;
    background-position: center;
    filter: saturate(0.7) brightness(0.48) contrast(1.08) hue-rotate(-8deg);
    transform: scale(1.08);
    animation: bgDrift 18s ease-in-out infinite alternate;
  }

  &__veil {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 55% at 50% 40%, transparent 0%, rgba(5, 7, 12, 0.4) 55%, rgba(5, 7, 12, 0.94) 100%),
      linear-gradient(180deg, rgba(122, 16, 40, 0.28) 0%, rgba(5, 7, 12, 0.75) 100%);
  }

  &__grain {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 24px;
    animation: riseIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  &__eyebrow {
    margin: 0 0 18px;
    font-family: var(--font-display);
    font-size: 13px;
    letter-spacing: 0.42em;
    color: var(--accent-metal);
    text-indent: 0.42em;
  }

  &__brand {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(52px, 12vw, 108px);
    line-height: 1;
    letter-spacing: 0.12em;
    text-indent: 0.12em;
    color: var(--text-primary);
    text-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  }

  &__lead {
    margin: 22px 0 0;
    font-weight: 300;
    font-size: clamp(15px, 2.4vw, 18px);
    letter-spacing: 0.28em;
    text-indent: 0.28em;
    color: var(--text-muted);
  }

  &__cta {
    position: relative;
    margin-top: 48px;
    width: 188px;
    height: 188px;
    border: 1px solid var(--metal-line);
    border-radius: 50%;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease;

    &:hover {
      transform: scale(1.05);
      border-color: var(--accent-metal);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &__cta-glow {
    position: absolute;
    inset: 18%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(176, 30, 58, 0.4) 0%, rgba(200, 208, 220, 0.08) 55%, transparent 72%);
    animation: pulse calc(var(--beat) * 8) ease-in-out infinite;
  }

  &__cta-text {
    position: relative;
    z-index: 1;
    font-family: var(--font-display);
    font-size: 24px;
    letter-spacing: 0.28em;
    text-indent: 0.28em;
  }

  &__hint {
    margin: 28px 0 0;
    font-size: 12px;
    letter-spacing: 0.18em;
    color: rgba(200, 212, 228, 0.38);
  }

  &__scroll-hint {
    position: absolute;
    bottom: 36px;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 56px;
    overflow: hidden;

    span {
      display: block;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, transparent, var(--accent-metal), transparent);
      animation: lineDrop 2.2s ease-in-out infinite;
    }
  }
}

.gate-enter-active,
.gate-leave-active {
  transition: opacity 0.9s ease, transform 0.9s ease;
}

.gate-leave-to {
  opacity: 0;
  transform: scale(1.06);
}

@keyframes bgDrift {
  from {
    transform: scale(1.08) translate3d(-1%, -0.5%, 0);
  }
  to {
    transform: scale(1.14) translate3d(1.5%, 1%, 0);
  }
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.55;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

@keyframes lineDrop {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}
</style>

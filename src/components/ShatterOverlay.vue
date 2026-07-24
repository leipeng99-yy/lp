<template>
  <transition name="shatter">
    <section v-if="visible" class="shatter" :class="'is-' + mode">
      <div class="shatter__flash" />
      <div class="shatter__shards" aria-hidden="true">
        <span v-for="n in 12" :key="n" :style="shardStyle(n)" />
      </div>
      <div class="shatter__tear" />
      <div class="shatter__copy">
        <p class="shatter__eyebrow">{{ eyebrow }}</p>
        <h2 class="shatter__title">{{ title }}</h2>
        <p v-if="subtitle" class="shatter__sub">{{ subtitle }}</p>
      </div>
    </section>
  </transition>
</template>

<script>
export default {
  name: 'ShatterOverlay',
  props: {
    visible: { type: Boolean, default: false },
    mode: { type: String, default: 'past' }, // past | break | collapse
    eyebrow: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' }
  },
  methods: {
    shardStyle(n) {
      const angle = (n / 12) * 360
      const dist = 28 + (n % 5) * 10
      const x = Math.cos((angle * Math.PI) / 180) * dist
      const y = Math.sin((angle * Math.PI) / 180) * dist
      const rot = -40 + n * 17
      return {
        '--tx': `${x}vw`,
        '--ty': `${y}vh`,
        '--rot': `${rot}deg`,
        animationDelay: `${n * 0.03}s`,
        clipPath: `polygon(${10 + (n % 4) * 8}% 0%, 100% ${15 + (n % 3) * 10}%, ${60 - (n % 5) * 5}% 100%, 0% ${40 + (n % 4) * 8}%)`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.shatter {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #020308;
  pointer-events: none;

  &__flash {
    position: absolute;
    inset: 0;
    background: #fff;
    opacity: 0;
    animation: flashBurst 0.9s ease both;
  }

  &.is-break .shatter__flash {
    animation: flashBurst 1.1s ease both;
    background: #d8e2ef;
  }

  &.is-collapse .shatter__flash {
    animation: flashBurst 0.7s ease both 0.15s;
    background: #f2e8ea;
  }

  &__shards {
    position: absolute;
    inset: 0;

    span {
      position: absolute;
      left: 30%;
      top: 25%;
      width: 40%;
      height: 42%;
      background:
        linear-gradient(135deg, rgba(200, 208, 220, 0.16), rgba(176, 30, 58, 0.18)),
        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.12), transparent 55%);
      border: 1px solid rgba(200, 208, 220, 0.18);
      opacity: 0;
      animation: shardFly 2.8s cubic-bezier(0.22, 1, 0.36, 1) both;
      box-shadow: inset 0 0 30px rgba(176, 30, 58, 0.15);
    }
  }

  &__tear {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      180deg,
      transparent 0,
      transparent 7px,
      rgba(0, 0, 0, 0.35) 7px,
      rgba(0, 0, 0, 0.35) 8px
    );
    mix-blend-mode: multiply;
    opacity: 0.45;
    animation: tearShake 0.55s steps(2) infinite;
  }

  &__copy {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 28px;
    animation: copyIn 1s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
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
    font-size: clamp(28px, 6vw, 48px);
    letter-spacing: 0.28em;
    text-indent: 0.28em;
    line-height: 1.35;
  }

  &__sub {
    margin: 20px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.2em;
    color: var(--text-muted);
  }
}

.shatter-enter-active,
.shatter-leave-active {
  transition: opacity 0.55s ease;
}

.shatter-enter,
.shatter-leave-to {
  opacity: 0;
}

@keyframes flashBurst {
  0% {
    opacity: 0;
  }
  12% {
    opacity: 0.92;
  }
  28% {
    opacity: 0.15;
  }
  42% {
    opacity: 0.75;
  }
  100% {
    opacity: 0;
  }
}

@keyframes shardFly {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  12% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.55);
  }
}

@keyframes tearShake {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-1.5%);
  }
}

@keyframes copyIn {
  from {
    opacity: 0;
    transform: translateY(16px);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
</style>

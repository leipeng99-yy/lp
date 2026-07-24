<template>
  <transition name="shift">
    <section v-if="visible" class="time-shift" :class="'is-' + mode">
      <div class="time-shift__wash" />
      <div class="time-shift__ring" />
      <div class="time-shift__copy">
        <p class="time-shift__eyebrow">{{ eyebrow }}</p>
        <h2 class="time-shift__title">{{ title }}</h2>
        <p v-if="subtitle" class="time-shift__sub">{{ subtitle }}</p>
      </div>
    </section>
  </transition>
</template>

<script>
export default {
  name: 'TimeShift',
  props: {
    visible: { type: Boolean, default: false },
    mode: { type: String, default: 'past' }, // past | present
    eyebrow: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.time-shift {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #05070c;
  pointer-events: none;

  &__wash {
    position: absolute;
    inset: -20%;
    background:
      radial-gradient(circle at 50% 50%, rgba(176, 30, 58, 0.35), transparent 55%),
      radial-gradient(circle at 50% 50%, rgba(200, 208, 220, 0.12), transparent 70%);
    animation: washPulse 2.8s ease-in-out infinite;
  }

  &.is-past .time-shift__wash {
    animation: washPast 3.2s ease both;
  }

  &.is-present .time-shift__wash {
    animation: washPresent 3.2s ease both;
  }

  &__ring {
    position: absolute;
    width: min(52vmin, 420px);
    height: min(52vmin, 420px);
    border: 1px solid rgba(200, 208, 220, 0.35);
    border-radius: 50%;
    box-shadow:
      inset 0 0 40px rgba(176, 30, 58, 0.2),
      0 0 60px rgba(200, 208, 220, 0.08);
    animation: ringBreath 2.4s ease-in-out infinite;
  }

  &__copy {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 28px;
    animation: copyIn 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  &__eyebrow {
    margin: 0 0 16px;
    font-family: var(--font-display);
    font-size: 12px;
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
    margin: 22px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.22em;
    color: var(--text-muted);
  }
}

.shift-enter-active,
.shift-leave-active {
  transition: opacity 0.9s ease;
}

.shift-enter,
.shift-leave-to {
  opacity: 0;
}

@keyframes washPast {
  0% {
    transform: scale(1.4) rotate(0deg);
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(-8deg);
    opacity: 0.85;
  }
}

@keyframes washPresent {
  0% {
    transform: scale(0.7) rotate(-12deg);
    opacity: 0;
  }
  45% {
    opacity: 1;
  }
  100% {
    transform: scale(1.15) rotate(0deg);
    opacity: 0.9;
  }
}

@keyframes washPulse {
  0%,
  100% {
    opacity: 0.75;
  }
  50% {
    opacity: 1;
  }
}

@keyframes ringBreath {
  0%,
  100% {
    transform: scale(0.96);
    opacity: 0.55;
  }
  50% {
    transform: scale(1.04);
    opacity: 0.95;
  }
}

@keyframes copyIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

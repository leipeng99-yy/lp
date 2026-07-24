<template>
  <section class="signal">
    <div class="signal__snow" aria-hidden="true" />
    <div class="signal__bars" aria-hidden="true">
      <span v-for="n in 8" :key="n" />
    </div>
    <div class="signal__copy">
      <p class="signal__eyebrow">LINK LOST · COLLAPSE IMMINENT</p>
      <h2 class="signal__title">信号正在溃散。</h2>
      <p class="signal__body">此次穿梭将被提前终止。<br />过去无法被永久占用。</p>
      <p class="signal__nosignal">NO SIGNAL</p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'SignalDisconnect'
}
</script>

<style lang="scss" scoped>
.signal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #05070c;
  overflow: hidden;

  &__snow {
    position: absolute;
    inset: -10%;
    opacity: 0.28;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    animation: snowJump 0.12s steps(2) infinite;
  }

  &__bars {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none;

    span {
      display: block;
      height: 2px;
      background: rgba(200, 208, 220, 0.18);
      transform: scaleX(0);
      transform-origin: left center;
      animation: barSlash 1.8s ease-in-out infinite;

      &:nth-child(odd) {
        transform-origin: right center;
        animation-delay: 0.2s;
      }

      &:nth-child(3n) {
        height: 8px;
        opacity: 0.35;
        animation-duration: 1.1s;
      }
    }
  }

  &__copy {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 28px;
    animation: signalIn 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  &__eyebrow {
    margin: 0 0 16px;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.42em;
    text-indent: 0.42em;
    color: var(--accent-metal);
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(28px, 6vw, 46px);
    letter-spacing: 0.24em;
    text-indent: 0.24em;
    line-height: 1.35;
  }

  &__body {
    margin: 20px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.18em;
    line-height: 2;
    color: var(--text-muted);
  }

  &__nosignal {
    margin: 36px 0 0;
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 0.55em;
    text-indent: 0.55em;
    color: rgba(176, 30, 58, 0.75);
    animation: blink 1.2s steps(2) infinite;
  }
}

@keyframes snowJump {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(-3%, 2%);
  }
}

@keyframes barSlash {
  0%,
  100% {
    transform: scaleX(0);
    opacity: 0.2;
  }
  45%,
  55% {
    transform: scaleX(1);
    opacity: 0.7;
  }
}

@keyframes signalIn {
  from {
    opacity: 0;
    filter: blur(6px);
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}
</style>

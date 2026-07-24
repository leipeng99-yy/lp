<template>
  <section class="sealed">
    <div class="sealed__atmosphere" />
    <div class="sealed__grain" aria-hidden="true" />
    <div class="sealed__copy">
      <p class="sealed__eyebrow">THE ONLY EXIT</p>
      <h1 class="sealed__brand">交给时间。</h1>
      <p class="sealed__lead">穿梭已止。过去被封存，现在重新成立。</p>
      <p class="sealed__close">再也无法回到过去——也无需再去。</p>
      <p class="sealed__en">leave it to time.</p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'SealedFinale'
}
</script>

<style lang="scss" scoped>
.sealed {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #05070c;
  overflow: hidden;
  animation: sealedIn 1.6s cubic-bezier(0.22, 1, 0.36, 1) both;

  &__atmosphere {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 40% at 50% 42%, rgba(176, 30, 58, 0.16), transparent 65%),
      radial-gradient(ellipse 80% 70% at 50% 100%, rgba(20, 28, 42, 0.85), transparent 55%),
      linear-gradient(180deg, #070a12, #05070c 55%, #0a0610);
  }

  &__grain {
    position: absolute;
    inset: 0;
    opacity: 0.07;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__copy {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 28px;
    max-width: 720px;
  }

  &__eyebrow {
    margin: 0 0 22px;
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 0.5em;
    text-indent: 0.5em;
    color: var(--accent-metal);
    animation: rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  &__brand {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(48px, 12vw, 96px);
    letter-spacing: 0.2em;
    text-indent: 0.2em;
    line-height: 1.1;
    text-shadow: 0 0 60px rgba(176, 30, 58, 0.22);
    animation: rise 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
  }

  &__lead {
    margin: 28px 0 0;
    font-weight: 300;
    font-size: 15px;
    letter-spacing: 0.22em;
    line-height: 1.9;
    color: var(--text-muted);
    animation: rise 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both;
  }

  &__close {
    margin: 18px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.18em;
    color: rgba(200, 212, 228, 0.42);
    animation: rise 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.42s both;
  }

  &__en {
    margin: 40px 0 0;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 14px;
    letter-spacing: 0.36em;
    text-indent: 0.36em;
    color: rgba(200, 208, 220, 0.38);
    animation: rise 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.58s both;
  }
}

@keyframes sealedIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes rise {
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

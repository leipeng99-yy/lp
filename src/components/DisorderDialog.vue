<template>
  <div v-if="visible" class="disorder-dialog" :class="'mode-' + mode">
    <div
      class="disorder-dialog__panel"
      :class="{ 'is-fake-anchor': fakeAnchoring }"
      :style="panelStyle"
    >
      <div class="disorder-dialog__glitch" aria-hidden="true" />
      <p class="disorder-dialog__eyebrow">{{ eyebrow }}</p>
      <h2 class="disorder-dialog__title">{{ title }}</h2>
      <p class="disorder-dialog__body">{{ body }}</p>
      <p v-if="hint" class="disorder-dialog__hint">{{ hint }}</p>

      <div class="disorder-dialog__actions">
        <button class="disorder-dialog__btn is-primary" type="button" @click="$emit('primary')">
          {{ primaryText }}
        </button>
        <button
          v-if="secondaryText"
          class="disorder-dialog__btn is-ghost"
          type="button"
          @click="$emit('secondary')"
        >
          {{ secondaryText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DisorderDialog',
  props: {
    visible: { type: Boolean, default: false },
    mode: { type: String, default: 'ask' }, // ask | stay
    eyebrow: { type: String, default: '' },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    hint: { type: String, default: '' },
    primaryText: { type: String, default: '' },
    secondaryText: { type: String, default: '' },
    fakeAnchoring: { type: Boolean, default: false },
    position: {
      type: Object,
      default: () => ({ x: 50, y: 46 })
    }
  },
  computed: {
    panelStyle() {
      return {
        left: this.position.x + '%',
        top: this.position.y + '%'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.disorder-dialog {
  position: fixed;
  inset: 0;
  z-index: 90;
  pointer-events: none;

  &__panel {
    position: absolute;
    width: min(420px, calc(100vw - 40px));
    padding: 28px 26px 24px;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    background: rgba(6, 8, 14, 0.82);
    border: 1px solid rgba(200, 208, 220, 0.28);
    box-shadow:
      0 0 0 1px rgba(176, 30, 58, 0.12),
      0 24px 60px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(14px);
    animation: panelCrack 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    overflow: hidden;

    &.is-fake-anchor {
      border-color: rgba(140, 200, 160, 0.45);
      box-shadow:
        0 0 0 1px rgba(120, 180, 140, 0.2),
        0 24px 60px rgba(0, 0, 0, 0.55);
      transition: border-color 0.4s ease, box-shadow 0.4s ease;
    }
  }

  &__glitch {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(90deg, rgba(176, 30, 58, 0.08), transparent 30%, rgba(100, 160, 255, 0.06));
    mix-blend-mode: screen;
    animation: glitchShift 1.8s steps(3) infinite;
  }

  &__eyebrow {
    position: relative;
    margin: 0 0 12px;
    font-family: var(--font-display);
    font-size: 10px;
    letter-spacing: 0.42em;
    text-indent: 0.42em;
    color: var(--accent-metal);
  }

  &__title {
    position: relative;
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(22px, 4.5vw, 28px);
    letter-spacing: 0.16em;
    text-indent: 0.16em;
    line-height: 1.4;
  }

  &__body {
    position: relative;
    margin: 14px 0 0;
    font-weight: 300;
    font-size: 13px;
    letter-spacing: 0.14em;
    line-height: 1.85;
    color: var(--text-muted);
  }

  &__hint {
    position: relative;
    margin: 12px 0 0;
    font-size: 12px;
    letter-spacing: 0.12em;
    color: rgba(176, 30, 58, 0.85);
  }

  &__actions {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 26px;
  }

  &__btn {
    min-width: 128px;
    height: 42px;
    padding: 0 18px;
    border-radius: 0;
    font-family: var(--font-display);
    font-size: 14px;
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    cursor: pointer;
    transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;

    &.is-primary {
      border: 1px solid rgba(200, 208, 220, 0.55);
      background: rgba(176, 30, 58, 0.22);
      color: var(--text-primary);

      &:hover {
        transform: translateY(-1px);
        border-color: var(--accent-metal);
        background: rgba(176, 30, 58, 0.35);
      }
    }

    &.is-ghost {
      border: 1px solid rgba(200, 208, 220, 0.22);
      background: transparent;
      color: var(--text-muted);

      &:hover {
        border-color: rgba(200, 208, 220, 0.45);
        color: var(--text-primary);
      }
    }
  }
}

@keyframes panelCrack {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.08) skewX(-2deg);
    filter: blur(4px);
  }
  55% {
    opacity: 1;
    filter: blur(0);
  }
  70% {
    transform: translate(calc(-50% + 3px), calc(-50% - 2px)) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    filter: blur(0);
  }
}

@keyframes glitchShift {
  0%,
  100% {
    transform: translate(0, 0);
    opacity: 0.55;
  }
  33% {
    transform: translate(-2px, 1px);
    opacity: 0.85;
  }
  66% {
    transform: translate(2px, -1px);
    opacity: 0.4;
  }
}
</style>

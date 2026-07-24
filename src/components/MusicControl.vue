<template>
  <div class="music-control" :class="{ 'is-playing': playing }" @click="$emit('toggle')">
    <div class="music-control__rings" aria-hidden="true">
      <span /><span /><span />
    </div>
    <div class="music-control__core">
      <svg v-if="playing" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.02-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MusicControl',
  props: {
    playing: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss" scoped>
.music-control {
  position: fixed;
  right: 22px;
  bottom: 28px;
  z-index: 80;
  width: 54px;
  height: 54px;
  cursor: pointer;
  color: var(--accent-metal);

  &__rings {
    position: absolute;
    inset: 0;

    span {
      position: absolute;
      inset: 0;
      border: 1px solid rgba(200, 208, 220, 0.35);
      border-radius: 50%;
      opacity: 0;
    }
  }

  &__core {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(5, 7, 12, 0.78);
    border: 1px solid var(--metal-line);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 20px rgba(176, 30, 58, 0.18);
    backdrop-filter: blur(10px);
    transition: transform 0.3s ease, border-color 0.3s ease;
  }

  &:hover .music-control__core {
    transform: scale(1.06);
    border-color: var(--accent-metal);
  }

  &.is-playing .music-control__rings span {
    animation: ripples calc(var(--beat) * 4) ease-out infinite;
  }

  &.is-playing .music-control__rings span:nth-child(2) {
    animation-delay: calc(var(--beat) * 1.33);
  }

  &.is-playing .music-control__rings span:nth-child(3) {
    animation-delay: calc(var(--beat) * 2.66);
  }
}

@keyframes ripples {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  100% {
    transform: scale(1.85);
    opacity: 0;
  }
}
</style>

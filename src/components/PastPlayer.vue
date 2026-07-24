<template>
  <section class="past-player">
    <video
      ref="video"
      class="past-player__video"
      :src="currentSrc"
      playsinline
      preload="auto"
      @ended="onEnded"
      @timeupdate="onTime"
      @loadedmetadata="onMeta"
    />

    <div class="past-player__veil" />
    <div class="past-player__scan" aria-hidden="true" />

    <div class="past-player__hud">
      <p class="past-player__eyebrow">ARCHIVE · PAST ONLY</p>
      <p class="past-player__status">完整回放中 · 请勿中断</p>
      <div class="past-player__progress" aria-hidden="true">
        <span :style="{ width: progressWidth }" />
      </div>
      <p class="past-player__count">{{ String(index + 1).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }}</p>
    </div>
  </section>
</template>

<script>
import { videoList } from '@/utils/videos'

export default {
  name: 'PastPlayer',
  data() {
    return {
      index: 0,
      localProgress: 0,
      duration: 1
    }
  },
  computed: {
    total() {
      return videoList.length
    },
    currentSrc() {
      return videoList[this.index] ? videoList[this.index].src : ''
    },
    progressWidth() {
      if (!this.total) return '0%'
      const base = this.index / this.total
      const piece = this.localProgress / this.total
      return `${Math.min(100, (base + piece) * 100)}%`
    }
  },
  mounted() {
    this.$nextTick(() => this.playCurrent())
  },
  methods: {
    playCurrent() {
      const video = this.$refs.video
      if (!video || !this.currentSrc) {
        this.$emit('all-done')
        return
      }
      this.localProgress = 0
      try {
        video.currentTime = 0
      } catch (e) {
        /* ignore */
      }
      const playPromise = video.play()
      if (playPromise && playPromise.then) {
        playPromise.catch(() => {
          /* autoplay may require prior click — parent already clicked */
        })
      }
    },
    onMeta() {
      const video = this.$refs.video
      this.duration = video && video.duration ? video.duration : 1
    },
    onTime() {
      const video = this.$refs.video
      if (!video || !video.duration) return
      this.localProgress = video.currentTime / video.duration
    },
    onEnded() {
      if (this.index >= this.total - 1) {
        this.$emit('all-done')
        return
      }
      this.index += 1
      this.$nextTick(() => this.playCurrent())
    }
  }
}
</script>

<style lang="scss" scoped>
.past-player {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #05070c;
  overflow: hidden;

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.82) contrast(1.08) brightness(0.92);
    animation: frameIn 0.7s ease both;
  }

  &__veil {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 70% 55% at 50% 45%, transparent 0%, rgba(5, 7, 12, 0.35) 70%, rgba(5, 7, 12, 0.78) 100%),
      linear-gradient(180deg, rgba(5, 7, 12, 0.35), transparent 30%, rgba(5, 7, 12, 0.55));
  }

  &__scan {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.18;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.25) 0,
      rgba(0, 0, 0, 0.25) 1px,
      transparent 1px,
      transparent 4px
    );
  }

  &__hud {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    padding: 28px 28px 36px;
    text-align: center;
  }

  &__eyebrow {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.42em;
    text-indent: 0.42em;
    color: var(--accent-metal);
  }

  &__status {
    margin: 10px 0 0;
    font-weight: 300;
    font-size: 12px;
    letter-spacing: 0.28em;
    color: rgba(200, 212, 228, 0.45);
  }

  &__progress {
    margin: 18px auto 0;
    width: min(280px, 55vw);
    height: 1px;
    background: rgba(200, 208, 220, 0.18);
    overflow: hidden;

    span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, rgba(176, 30, 58, 0.35), rgba(200, 208, 220, 0.85));
      transition: width 0.2s linear;
    }
  }

  &__count {
    margin: 12px 0 0;
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 0.36em;
    color: rgba(200, 212, 228, 0.35);
  }
}

@keyframes frameIn {
  from {
    opacity: 0;
    filter: saturate(0.5) contrast(1.3) brightness(1.2);
  }
  to {
    opacity: 1;
    filter: saturate(0.82) contrast(1.08) brightness(0.92);
  }
}
</style>

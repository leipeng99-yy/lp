<template>
  <section class="past-player" :class="{ 'is-muted-fx': disorderHint }">
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
      <p class="past-player__status">可拖动进度 · 快进回望</p>

      <div class="past-player__seek">
        <input
          class="past-player__range"
          type="range"
          min="0"
          :max="duration || 1"
          step="0.05"
          :value="currentTime"
          @input="onSeek"
        />
      </div>

      <div class="past-player__meta">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ String(index + 1).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>

      <div class="past-player__overall">
        <span :style="{ width: overallWidth }" />
      </div>
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
      currentTime: 0,
      duration: 1,
      nearEndEmitted: false,
      disorderHint: false
    }
  },
  computed: {
    total() {
      return videoList.length
    },
    currentSrc() {
      return videoList[this.index] ? videoList[this.index].src : ''
    },
    overallWidth() {
      if (!this.total) return '0%'
      const base = this.index / this.total
      const piece = (this.duration ? this.currentTime / this.duration : 0) / this.total
      return `${Math.min(100, (base + piece) * 100)}%`
    }
  },
  mounted() {
    this.$nextTick(() => this.playCurrent())
  },
  methods: {
    formatTime(sec) {
      const s = Math.max(0, Math.floor(sec || 0))
      const m = Math.floor(s / 60)
      const r = s % 60
      return `${m}:${String(r).padStart(2, '0')}`
    },
    playCurrent() {
      const video = this.$refs.video
      if (!video || !this.currentSrc) {
        this.$emit('all-done')
        return
      }
      this.currentTime = 0
      this.nearEndEmitted = false
      this.disorderHint = false
      try {
        video.playbackRate = 1
        video.currentTime = 0
      } catch (e) {
        /* ignore */
      }
      const playPromise = video.play()
      if (playPromise && playPromise.then) {
        playPromise.catch(() => {})
      }
    },
    onMeta() {
      const video = this.$refs.video
      this.duration = video && video.duration ? video.duration : 1
    },
    onTime() {
      const video = this.$refs.video
      if (!video || !video.duration) return
      this.currentTime = video.currentTime
      this.duration = video.duration

      // 快播完所有回忆：进入最后一段且过半 → 触发收束紊乱
      if (
        !this.nearEndEmitted &&
        this.index >= this.total - 1 &&
        video.currentTime / video.duration >= 0.48
      ) {
        this.nearEndEmitted = true
        this.disorderHint = true
        try {
          video.pause()
        } catch (e) {
          /* ignore */
        }
        this.$emit('near-complete')
      }
    },
    onSeek(e) {
      const video = this.$refs.video
      if (!video) return
      const next = Number(e.target.value)
      try {
        video.currentTime = next
        this.currentTime = next
        if (video.paused) {
          const p = video.play()
          if (p && p.catch) p.catch(() => {})
        }
      } catch (err) {
        /* ignore */
      }
    },
    onEnded() {
      if (this.index >= this.total - 1) {
        if (!this.nearEndEmitted) {
          this.nearEndEmitted = true
          this.$emit('near-complete')
        }
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

  &.is-muted-fx .past-player__video {
    filter: saturate(0.5) contrast(1.2) brightness(0.7);
  }

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.82) contrast(1.08) brightness(0.92);
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
    opacity: 0.16;
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
    padding: 24px 28px 32px;
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

  &__seek {
    margin: 18px auto 0;
    width: min(420px, 78vw);
  }

  &__range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 2px;
    border-radius: 0;
    background: rgba(200, 208, 220, 0.22);
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 0;
      background: #e8eef5;
      border: 1px solid rgba(176, 30, 58, 0.55);
      box-shadow: 0 0 10px rgba(176, 30, 58, 0.35);
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 0;
      background: #e8eef5;
      border: 1px solid rgba(176, 30, 58, 0.55);
      cursor: pointer;
    }
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    width: min(420px, 78vw);
    margin: 10px auto 0;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.18em;
    color: rgba(200, 212, 228, 0.4);
  }

  &__overall {
    margin: 14px auto 0;
    width: min(280px, 55vw);
    height: 1px;
    background: rgba(200, 208, 220, 0.14);
    overflow: hidden;

    span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, rgba(176, 30, 58, 0.35), rgba(200, 208, 220, 0.85));
    }
  }
}
</style>

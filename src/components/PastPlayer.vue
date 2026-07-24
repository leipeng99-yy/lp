<template>
  <section class="past-player" :class="{ 'is-mobile': isMobile }">
    <div class="past-player__stage">
      <video
        ref="v0"
        class="past-player__video"
        :class="{ 'is-active': activeSlot === 0 }"
        playsinline
        webkit-playsinline
        preload="metadata"
        @ended="onEnded"
        @timeupdate="onTime"
        @loadedmetadata="onSlotMeta(0)"
      />
      <video
        ref="v1"
        class="past-player__video"
        :class="{ 'is-active': activeSlot === 1 }"
        playsinline
        webkit-playsinline
        preload="metadata"
        @ended="onEnded"
        @timeupdate="onTime"
        @loadedmetadata="onSlotMeta(1)"
      />
    </div>

    <div class="past-player__veil" />
    <div v-if="!isMobile" class="past-player__grain" aria-hidden="true" />

    <!-- 回忆节点时间线 -->
    <aside class="past-player__rail" aria-label="回忆时间线">
      <div class="past-player__rail-line" />
      <button
        v-for="(item, i) in nodes"
        :key="item.id"
        type="button"
        class="past-player__node"
        :class="{
          'is-past': i < index,
          'is-current': i === index,
          'is-future': i > index
        }"
        :style="{ '--i': i }"
        :aria-label="item.label"
        @click="jumpToNode(i)"
      >
        <span class="past-player__node-dot" />
        <span class="past-player__node-label">{{ item.node }}</span>
      </button>
    </aside>

    <div class="past-player__hud">
      <p class="past-player__eyebrow">ARCHIVE · MEMORY NODES</p>
      <p class="past-player__current">{{ currentLabel }}</p>
      <p class="past-player__status">沿时间线回望 · 点节点或拖动进度</p>

      <div class="past-player__seek">
        <input
          class="past-player__range"
          type="range"
          min="0"
          :max="totalDuration || 1"
          step="0.05"
          :value="timelinePos"
          :disabled="!ready"
          @input="onSeek"
        />
      </div>

      <div class="past-player__meta">
        <span>{{ formatTime(timelinePos) }}</span>
        <span>{{ String(index + 1).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }}</span>
        <span>{{ formatTime(totalDuration) }}</span>
      </div>
    </div>
  </section>
</template>

<script>
import { videoList, ESTIMATED_DURATION } from '@/utils/videos'
import { isMobileDevice } from '@/utils/device'

const CROSSFADE_MS = 280

export default {
  name: 'PastPlayer',
  data() {
    return {
      index: 0,
      activeSlot: 0,
      slotIndex: [-1, -1],
      durations: videoList.map(() => ESTIMATED_DURATION),
      ready: false,
      timelinePos: 0,
      crossing: false,
      nextArmed: false,
      isMobile: isMobileDevice()
    }
  },
  computed: {
    total() {
      return videoList.length
    },
    nodes() {
      return videoList
    },
    currentLabel() {
      const item = videoList[this.index]
      return item ? item.label : ''
    },
    totalDuration() {
      return this.durations.reduce((s, d) => s + (d || ESTIMATED_DURATION), 0)
    },
    offsets() {
      const list = []
      let acc = 0
      for (let i = 0; i < this.durations.length; i++) {
        list.push(acc)
        acc += this.durations[i] || ESTIMATED_DURATION
      }
      return list
    }
  },
  mounted() {
    this.ready = true
    this.loadInto(this.activeSlot, 0, true).then(() => {
      const active = this.getSlot(this.activeSlot)
      if (active) active.volume = 1
      this.playSlot(this.activeSlot)
      this.armNext()
    })
  },
  beforeDestroy() {
    this.getSlot(0) && this.getSlot(0).pause()
    this.getSlot(1) && this.getSlot(1).pause()
  },
  methods: {
    formatTime(sec) {
      const s = Math.max(0, Math.floor(sec || 0))
      const m = Math.floor(s / 60)
      const r = s % 60
      return `${m}:${String(r).padStart(2, '0')}`
    },
    getSlot(slot) {
      return slot === 0 ? this.$refs.v0 : this.$refs.v1
    },
    otherSlot(slot) {
      return slot === 0 ? 1 : 0
    },
    onSlotMeta(slot) {
      const video = this.getSlot(slot)
      const idx = this.slotIndex[slot]
      if (!video || idx < 0 || !video.duration || Number.isNaN(video.duration)) return
      this.$set(this.durations, idx, video.duration)
    },
    loadInto(slot, index, fromStart) {
      const video = this.getSlot(slot)
      const item = videoList[index]
      if (!video || !item) return Promise.resolve()
      return new Promise((resolve) => {
        const onReady = () => {
          try {
            if (fromStart) video.currentTime = 0
            video.playbackRate = 1
            video.volume = slot === this.activeSlot ? 1 : 0
            if (video.duration && !Number.isNaN(video.duration)) {
              this.$set(this.durations, index, video.duration)
            }
          } catch (e) {
            /* ignore */
          }
          this.$set(this.slotIndex, slot, index)
          resolve()
        }
        if (this.slotIndex[slot] === index && video.src) {
          onReady()
          return
        }
        video.src = item.src
        if (video.readyState >= 1) onReady()
        else video.addEventListener('loadedmetadata', onReady, { once: true })
      })
    },
    playSlot(slot) {
      const video = this.getSlot(slot)
      if (!video) return
      const p = video.play()
      if (p && p.catch) p.catch(() => {})
    },
    armNext() {
      if (this.index >= this.total - 1) {
        this.nextArmed = false
        return
      }
      const next = this.index + 1
      const slot = this.otherSlot(this.activeSlot)
      this.loadInto(slot, next, true).then(() => {
        this.nextArmed = true
      })
    },
    onTime() {
      if (this.crossing) return
      const video = this.getSlot(this.activeSlot)
      if (!video || !video.duration) return
      const offset = this.offsets[this.index] || 0
      this.timelinePos = offset + video.currentTime
      const total = this.totalDuration || 1
      this.$emit('timeline', {
        pos: this.timelinePos,
        total,
        ratio: Math.min(1, this.timelinePos / total),
        index: this.index
      })
    },
    onEnded(e) {
      const active = this.getSlot(this.activeSlot)
      if (e && e.target !== active) return
      if (this.crossing) return

      if (this.index >= this.total - 1) {
        this.timelinePos = this.totalDuration
        this.$emit('all-done')
        return
      }
      this.crossTo(this.index + 1)
    },
    jumpToNode(i) {
      if (!this.ready || this.crossing) return
      if (i === this.index) {
        const video = this.getSlot(this.activeSlot)
        try {
          video.currentTime = 0
          if (video.paused) this.playSlot(this.activeSlot)
        } catch (e) {
          /* ignore */
        }
        return
      }
      this.crossTo(i, 0)
    },
    crossTo(nextIndex, seekInClip) {
      if (nextIndex < 0 || nextIndex >= this.total) return
      if (this.crossing) return
      this.crossing = true

      const fromSlot = this.activeSlot
      const toSlot = this.otherSlot(fromSlot)
      const fromVideo = this.getSlot(fromSlot)
      const toVideo = this.getSlot(toSlot)
      const fadeMs = this.isMobile ? 200 : CROSSFADE_MS

      const finish = () => {
        this.index = nextIndex
        this.activeSlot = toSlot
        this.crossing = false
        this.nextArmed = false
        if (fromVideo) {
          try {
            fromVideo.volume = 0
            fromVideo.pause()
          } catch (e) {
            /* ignore */
          }
        }
        if (toVideo) toVideo.volume = 1
        this.armNext()
      }

      this.loadInto(toSlot, nextIndex, seekInClip == null).then(() => {
        try {
          toVideo.currentTime = seekInClip == null ? 0 : seekInClip
          toVideo.volume = 0
        } catch (e) {
          /* ignore */
        }
        this.playSlot(toSlot)
        this.activeSlot = toSlot

        const steps = this.isMobile ? 4 : 6
        let i = 0
        const fade = () => {
          i += 1
          const t = i / steps
          try {
            if (fromVideo) fromVideo.volume = Math.max(0, 1 - t)
            if (toVideo) toVideo.volume = Math.min(1, t)
          } catch (e) {
            /* ignore */
          }
          if (i < steps) window.setTimeout(fade, Math.floor(fadeMs / steps))
          else finish()
        }
        fade()
      })
    },
    onSeek(e) {
      if (!this.ready || !this.totalDuration) return
      const t = Math.max(0, Math.min(this.totalDuration - 0.05, Number(e.target.value)))
      this.timelinePos = t

      let targetIndex = 0
      let local = t
      for (let i = 0; i < this.durations.length; i++) {
        const start = this.offsets[i] || 0
        const end = start + (this.durations[i] || ESTIMATED_DURATION)
        if (t >= start && (t < end || i === this.durations.length - 1)) {
          targetIndex = i
          local = Math.min(
            Math.max(0, t - start),
            Math.max(0, (this.durations[i] || ESTIMATED_DURATION) - 0.05)
          )
          break
        }
      }

      if (targetIndex === this.index && !this.crossing) {
        const video = this.getSlot(this.activeSlot)
        try {
          video.currentTime = local
          video.volume = 1
          if (video.paused) this.playSlot(this.activeSlot)
        } catch (err) {
          /* ignore */
        }
        return
      }

      this.crossTo(targetIndex, local)
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

  &__stage {
    position: absolute;
    inset: 0;
  }

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.28s ease;
    pointer-events: none;

    &.is-active {
      opacity: 1;
      z-index: 1;
    }
  }

  &:not(.is-mobile) &__video {
    filter: saturate(0.88) contrast(1.06) brightness(0.94);
  }

  &__veil {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background:
      radial-gradient(ellipse 70% 55% at 50% 42%, transparent 0%, rgba(5, 7, 12, 0.28) 72%, rgba(5, 7, 12, 0.72) 100%),
      linear-gradient(180deg, rgba(5, 7, 12, 0.28), transparent 28%, rgba(5, 7, 12, 0.5));
  }

  &__grain {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__rail {
    position: absolute;
    z-index: 4;
    right: 18px;
    top: 14%;
    bottom: 28%;
    width: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
  }

  &__rail-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
    background: linear-gradient(
      180deg,
      transparent,
      rgba(200, 208, 220, 0.35) 12%,
      rgba(200, 208, 220, 0.35) 88%,
      transparent
    );
  }

  &__node {
    position: relative;
    z-index: 1;
    width: 36px;
    height: 22px;
    padding: 0;
    border: 0;
    background: transparent;
    color: rgba(200, 212, 228, 0.35);
    cursor: pointer;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;

    &.is-past {
      color: rgba(200, 208, 220, 0.72);

      .past-player__node-dot {
        background: rgba(200, 208, 220, 0.75);
        box-shadow: none;
      }
    }

    &.is-current {
      color: var(--text-primary);

      .past-player__node-dot {
        background: #e8eef5;
        box-shadow: 0 0 12px rgba(176, 30, 58, 0.55);
        transform: scale(1.35);
        animation: nodePulse 1.8s ease-in-out infinite;
      }
    }

    &.is-future .past-player__node-dot {
      background: transparent;
      border: 1px solid rgba(200, 208, 220, 0.35);
    }
  }

  &__node-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    transition: transform 0.35s ease, background 0.35s ease, box-shadow 0.35s ease;
  }

  &__node-label {
    font-family: var(--font-display);
    font-size: 9px;
    letter-spacing: 0.12em;
    line-height: 1;
    opacity: 0.85;
  }

  &__hud {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    padding: 20px 28px 30px;
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

  &__current {
    margin: 10px 0 0;
    font-family: var(--font-display);
    font-size: 15px;
    letter-spacing: 0.28em;
    text-indent: 0.28em;
  }

  &__status {
    margin: 8px 0 0;
    font-weight: 300;
    font-size: 12px;
    letter-spacing: 0.22em;
    color: rgba(200, 212, 228, 0.42);
  }

  &__seek {
    margin: 18px auto 0;
    width: min(460px, 78vw);
  }

  &__range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 2px;
    background: rgba(200, 208, 220, 0.2);
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 11px;
      height: 11px;
      border-radius: 0;
      background: #e8eef5;
      border: 1px solid rgba(176, 30, 58, 0.5);
      box-shadow: 0 0 12px rgba(176, 30, 58, 0.28);
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 11px;
      height: 11px;
      border-radius: 0;
      background: #e8eef5;
      border: 1px solid rgba(176, 30, 58, 0.5);
      cursor: pointer;
    }
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    width: min(460px, 78vw);
    margin: 10px auto 0;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.18em;
    color: rgba(200, 212, 228, 0.38);
  }

  &.is-mobile {
    .past-player__rail {
      right: 8px;
      top: 12%;
      bottom: 32%;
      width: 28px;
    }

    .past-player__node-label {
      display: none;
    }

    .past-player__node {
      width: 28px;
      height: 16px;
    }

    .past-player__hud {
      padding: 16px 16px 22px;
    }

    .past-player__status {
      font-size: 11px;
      letter-spacing: 0.14em;
    }
  }
}

@keyframes nodePulse {
  0%,
  100% {
    transform: scale(1.25);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.45);
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .past-player__rail {
    right: 8px;
    top: 12%;
    bottom: 32%;
  }

  .past-player__node-label {
    display: none;
  }
}
</style>

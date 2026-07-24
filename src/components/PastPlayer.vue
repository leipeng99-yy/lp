<template>
  <section class="past-player">
    <div class="past-player__stage">
      <video
        ref="v0"
        class="past-player__video"
        :class="{ 'is-active': activeSlot === 0 }"
        muted
        playsinline
        preload="auto"
        @ended="onEnded"
        @timeupdate="onTime"
      />
      <video
        ref="v1"
        class="past-player__video"
        :class="{ 'is-active': activeSlot === 1 }"
        muted
        playsinline
        preload="auto"
        @ended="onEnded"
        @timeupdate="onTime"
      />
    </div>

    <div class="past-player__veil" />
    <div class="past-player__grain" aria-hidden="true" />

    <div class="past-player__hud">
      <p class="past-player__eyebrow">ARCHIVE · ALONG THE TIMELINE</p>
      <p class="past-player__status">沿时间线回望 · 可拖动总进度</p>

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
import { videoList } from '@/utils/videos'

const CROSSFADE_MS = 320

export default {
  name: 'PastPlayer',
  data() {
    return {
      index: 0,
      activeSlot: 0,
      slotIndex: [-1, -1],
      durations: [],
      ready: false,
      timelinePos: 0,
      crossing: false,
      nextArmed: false,
      probing: false
    }
  },
  computed: {
    total() {
      return videoList.length
    },
    totalDuration() {
      return this.durations.reduce((s, d) => s + (d || 0), 0)
    },
    offsets() {
      const list = []
      let acc = 0
      for (let i = 0; i < this.durations.length; i++) {
        list.push(acc)
        acc += this.durations[i] || 0
      }
      return list
    }
  },
  mounted() {
    this.probeDurations().then(() => {
      this.ready = true
      this.$emit('track-change', 0)
      this.loadInto(this.activeSlot, 0, true).then(() => {
        this.playSlot(this.activeSlot)
        this.armNext()
      })
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
    probeDurations() {
      this.probing = true
      const tasks = videoList.map(
        (item) =>
          new Promise((resolve) => {
            const el = document.createElement('video')
            el.preload = 'metadata'
            el.muted = true
            el.src = item.src
            const done = (d) => {
              el.removeAttribute('src')
              el.load()
              resolve(d && !Number.isNaN(d) ? d : 6)
            }
            el.addEventListener('loadedmetadata', () => done(el.duration), { once: true })
            el.addEventListener('error', () => done(6), { once: true })
            window.setTimeout(() => done(6), 8000)
          })
      )
      return Promise.all(tasks).then((durs) => {
        this.durations = durs
        this.probing = false
      })
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
    crossTo(nextIndex, seekInClip) {
      if (nextIndex < 0 || nextIndex >= this.total) return
      if (this.crossing) return
      this.crossing = true

      const fromSlot = this.activeSlot
      const toSlot = this.otherSlot(fromSlot)
      const fromVideo = this.getSlot(fromSlot)
      const toVideo = this.getSlot(toSlot)

      const finish = () => {
        this.index = nextIndex
        this.activeSlot = toSlot
        this.crossing = false
        this.nextArmed = false
        this.$emit('track-change', nextIndex)
        if (fromVideo) {
          try {
            fromVideo.pause()
          } catch (e) {
            /* ignore */
          }
        }
        this.armNext()
      }

      this.loadInto(toSlot, nextIndex, seekInClip == null).then(() => {
        try {
          toVideo.currentTime = seekInClip == null ? 0 : seekInClip
        } catch (e) {
          /* ignore */
        }
        this.playSlot(toSlot)
        window.setTimeout(finish, CROSSFADE_MS)
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
        const end = start + (this.durations[i] || 0)
        if (t >= start && (t < end || i === this.durations.length - 1)) {
          targetIndex = i
          local = Math.min(Math.max(0, t - start), Math.max(0, (this.durations[i] || 0) - 0.05))
          break
        }
      }

      if (targetIndex === this.index && !this.crossing) {
        const video = this.getSlot(this.activeSlot)
        try {
          video.currentTime = local
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
    transition: opacity 0.32s ease;
    filter: saturate(0.88) contrast(1.06) brightness(0.94);
    pointer-events: none;

    &.is-active {
      opacity: 1;
      z-index: 1;
    }
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

  &__hud {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    padding: 24px 28px 34px;
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
    letter-spacing: 0.26em;
    color: rgba(200, 212, 228, 0.42);
  }

  &__seek {
    margin: 20px auto 0;
    width: min(460px, 82vw);
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
    width: min(460px, 82vw);
    margin: 12px auto 0;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.18em;
    color: rgba(200, 212, 228, 0.38);
  }
}
</style>

<template>
  <section class="past-player" :class="{ 'is-mobile': isMobile, 'is-whipping': whipping }">
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

    <!-- 回忆走马灯 -->
    <div class="past-player__marquee" aria-label="回忆走马灯">
      <div class="past-player__marquee-fade past-player__marquee-fade--left" />
      <div class="past-player__marquee-fade past-player__marquee-fade--right" />
      <div
        ref="track"
        class="past-player__marquee-track"
        :style="{ transform: `translate3d(${marqueeX}px, 0, 0)` }"
      >
        <button
          v-for="(item, i) in nodes"
          :key="item.id"
          type="button"
          class="past-player__card"
          :class="{
            'is-past': i < index,
            'is-current': i === index,
            'is-future': i > index
          }"
          :aria-label="item.label"
          @click="jumpToNode(i)"
        >
          <div class="past-player__card-frame">
            <img v-if="thumbs[i]" :src="thumbs[i]" alt="" class="past-player__card-img" />
            <div v-else class="past-player__card-placeholder">
              <span>{{ item.node }}</span>
            </div>
            <div class="past-player__card-veil" />
          </div>
          <p class="past-player__card-label">{{ item.label }}</p>
        </button>
      </div>
    </div>

    <div class="past-player__hud">
      <p class="past-player__eyebrow">ARCHIVE · MEMORY PARADE</p>
      <p class="past-player__current">{{ currentLabel }}</p>
      <p class="past-player__status">走马灯回望 · 点选记忆或拖动进度</p>

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
      isMobile: isMobileDevice(),
      thumbs: videoList.map(() => ''),
      thumbQueue: [],
      thumbBusy: false,
      localProgress: 0,
      whipping: false,
      viewportW: typeof window !== 'undefined' ? window.innerWidth : 1000,
      whipTimer: null
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
    },
    cardStep() {
      return this.isMobile ? 84 : 118
    },
    marqueeX() {
      const center = this.viewportW / 2
      const cardCenter = this.index * this.cardStep + this.cardStep / 2
      // 段内微漂移，像时间在走
      const drift = this.localProgress * this.cardStep * 0.22
      return Math.round(center - cardCenter - drift)
    }
  },
  watch: {
    index(val) {
      this.queueThumbsAround(val)
      this.triggerWhip()
    }
  },
  mounted() {
    this.onResize = () => {
      this.viewportW = window.innerWidth
    }
    window.addEventListener('resize', this.onResize)
    this.ready = true
    this.queueThumbsAround(0)
    this.loadInto(this.activeSlot, 0, true).then(() => {
      const active = this.getSlot(this.activeSlot)
      if (active) active.volume = 1
      this.playSlot(this.activeSlot)
      this.armNext()
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    if (this.whipTimer) clearTimeout(this.whipTimer)
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
    triggerWhip() {
      this.whipping = true
      if (this.whipTimer) clearTimeout(this.whipTimer)
      this.whipTimer = setTimeout(() => {
        this.whipping = false
      }, 520)
    },
    queueThumbsAround(center) {
      const radius = this.isMobile ? 2 : 4
      const order = []
      for (let d = 0; d <= radius; d++) {
        const a = center - d
        const b = center + d
        if (a >= 0 && a < this.total && !this.thumbs[a]) order.push(a)
        if (d > 0 && b >= 0 && b < this.total && !this.thumbs[b]) order.push(b)
      }
      this.thumbQueue = this.thumbQueue.concat(order.filter((i) => !this.thumbQueue.includes(i)))
      this.pumpThumbs()
    },
    pumpThumbs() {
      if (this.thumbBusy || !this.thumbQueue.length) return
      const next = this.thumbQueue.shift()
      if (this.thumbs[next]) {
        this.pumpThumbs()
        return
      }
      this.thumbBusy = true
      this.captureThumb(next)
        .catch(() => {})
        .finally(() => {
          this.thumbBusy = false
          this.pumpThumbs()
        })
    },
    captureThumb(index) {
      const item = videoList[index]
      if (!item) return Promise.resolve()
      return new Promise((resolve) => {
        const el = document.createElement('video')
        el.muted = true
        el.playsInline = true
        el.preload = 'metadata'
        el.src = item.src
        let done = false
        const finish = (url) => {
          if (done) return
          done = true
          if (url) this.$set(this.thumbs, index, url)
          el.removeAttribute('src')
          el.load()
          resolve()
        }
        const failTimer = window.setTimeout(() => finish(''), 6000)
        el.addEventListener(
          'loadeddata',
          () => {
            try {
              const t = el.duration && !Number.isNaN(el.duration) ? Math.min(0.9, el.duration * 0.12) : 0.4
              el.currentTime = t
            } catch (e) {
              window.clearTimeout(failTimer)
              finish('')
            }
          },
          { once: true }
        )
        el.addEventListener(
          'seeked',
          () => {
            try {
              const w = this.isMobile ? 120 : 180
              const h = this.isMobile ? 68 : 102
              const canvas = document.createElement('canvas')
              canvas.width = w
              canvas.height = h
              const ctx = canvas.getContext('2d')
              ctx.drawImage(el, 0, 0, w, h)
              window.clearTimeout(failTimer)
              finish(canvas.toDataURL('image/jpeg', 0.72))
            } catch (e) {
              window.clearTimeout(failTimer)
              finish('')
            }
          },
          { once: true }
        )
        el.addEventListener(
          'error',
          () => {
            window.clearTimeout(failTimer)
            finish('')
          },
          { once: true }
        )
      })
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
      this.localProgress = video.currentTime / video.duration
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
      this.triggerWhip()

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
        this.localProgress = 0
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
      radial-gradient(ellipse 70% 55% at 50% 38%, transparent 0%, rgba(5, 7, 12, 0.28) 72%, rgba(5, 7, 12, 0.78) 100%),
      linear-gradient(180deg, rgba(5, 7, 12, 0.25), transparent 26%, rgba(5, 7, 12, 0.72) 78%);
  }

  &__grain {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__marquee {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 118px;
    z-index: 4;
    height: 118px;
    overflow: hidden;
    pointer-events: none;
  }

  &__marquee-fade {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 18%;
    z-index: 2;
    pointer-events: none;

    &--left {
      left: 0;
      background: linear-gradient(90deg, rgba(5, 7, 12, 0.95), transparent);
    }

    &--right {
      right: 0;
      background: linear-gradient(270deg, rgba(5, 7, 12, 0.95), transparent);
    }
  }

  &__marquee-track {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 8px;
    will-change: transform;
    transition: transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: auto;
  }

  &.is-whipping &__marquee-track {
    transition-duration: 0.42s;
    transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  &__card {
    flex: 0 0 auto;
    width: 104px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;
    transform: scale(0.82) translateY(6px);
    opacity: 0.42;
    filter: brightness(0.65) saturate(0.7);
    transition:
      transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.45s ease,
      filter 0.45s ease;
  }

  &__card.is-past {
    opacity: 0.55;
    filter: brightness(0.75) saturate(0.55);
  }

  &__card.is-future {
    opacity: 0.34;
    transform: scale(0.78) translateY(8px) rotateY(-8deg);
  }

  &__card.is-current {
    opacity: 1;
    transform: scale(1.08) translateY(0);
    filter: brightness(1) saturate(0.95);
    z-index: 2;
  }

  &__card-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border: 1px solid rgba(200, 208, 220, 0.22);
    background: #0a0d14;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  &__card.is-current &__card-frame {
    border-color: rgba(200, 208, 220, 0.55);
    box-shadow:
      0 0 0 1px rgba(176, 30, 58, 0.28),
      0 12px 28px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  &__card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__card-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      linear-gradient(135deg, rgba(176, 30, 58, 0.18), transparent 55%),
      #10141e;
    font-family: var(--font-display);
    font-size: 14px;
    letter-spacing: 0.2em;
    color: rgba(200, 212, 228, 0.55);
  }

  &__card-veil {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 40%, rgba(5, 7, 12, 0.55));
    pointer-events: none;
  }

  &__card-label {
    margin: 8px 0 0;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.16em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: rgba(200, 212, 228, 0.55);
  }

  &__card.is-current &__card-label {
    color: var(--text-primary);
  }

  &__hud {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    padding: 12px 28px 26px;
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
    margin: 8px 0 0;
    font-family: var(--font-display);
    font-size: 15px;
    letter-spacing: 0.28em;
    text-indent: 0.28em;
  }

  &__status {
    margin: 6px 0 0;
    font-weight: 300;
    font-size: 12px;
    letter-spacing: 0.2em;
    color: rgba(200, 212, 228, 0.42);
  }

  &__seek {
    margin: 14px auto 0;
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
    .past-player__marquee {
      bottom: 108px;
      height: 88px;
    }

    .past-player__card {
      width: 72px;
    }

    .past-player__card-label {
      font-size: 9px;
      margin-top: 5px;
      letter-spacing: 0.08em;
    }

    .past-player__hud {
      padding: 8px 16px 18px;
    }

    .past-player__status {
      font-size: 11px;
      letter-spacing: 0.12em;
    }

    .past-player__marquee-track {
      gap: 10px;
    }
  }
}

@media (max-width: 720px) {
  .past-player__marquee {
    bottom: 108px;
    height: 88px;
  }

  .past-player__card {
    width: 72px;
  }
}
</style>

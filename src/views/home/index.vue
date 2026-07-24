<template>
  <div class="home">
    <transition name="gate">
      <section v-if="phase === 'gate'" class="enter-gate" @click="enterExperience">
        <div class="enter-gate__grain" />
        <div class="enter-gate__axis" aria-hidden="true" />
        <p class="enter-gate__eyebrow">TEMPORAL ENTRY</p>
        <h1 class="enter-gate__title">时间愿意为你停一秒。</h1>
        <p class="enter-gate__lead">轻触，即是许可</p>
        <span class="enter-gate__pulse" />
      </section>
    </transition>

    <TemporalDisorder
      v-if="phase === 'openingDisorder' || phase === 'askPast'"
      mode="open"
      :dim="phase === 'askPast'"
      :active="disorderActive"
      :sparse="phase === 'askPast'"
      eyebrow="TEMPORAL DRIFT"
      title="此刻，轴线失温。"
      lead="过去与现在，叠在同一帧里。"
      @stutter="onMusicStutter"
    />

    <DisorderDialog
      v-if="phase === 'askPast'"
      :visible="dialogVisible"
      mode="ask"
      eyebrow="TEMPORAL QUERY"
      title="是否进入尚未愈合的时间？"
      body="倒流有代价。留下，亦是一种选择。"
      :hint="harassHint"
      primary-text="进入过去"
      secondary-text="留在此刻"
      :position="dialogPos"
      @primary="acceptPast"
      @secondary="refusePast"
    />

    <ShatterOverlay
      :visible="phase === 'shatterToPast'"
      mode="past"
      eyebrow="CROSSING THE AXIS"
      title="时间正在让路。"
      subtitle="请跟住这一道缝隙。"
    />

    <PastPlayer
      v-if="phase === 'playPast'"
      @track-change="onVideoTrackChange"
      @all-done="onAllVideosDone"
    />

    <TemporalDisorder
      v-if="phase === 'endDisorder'"
      mode="close"
      :active="true"
      :sparse="false"
      eyebrow="ECHO FADING"
      title="回声正在散尽。"
      lead="记忆不被允许久留。"
      @stutter="onMusicStutter"
    />

    <ShatterOverlay
      :visible="phase === 'signalBreak'"
      mode="break"
      eyebrow="LINK THINNING"
      title="穿梭将提前终止。"
      subtitle="过去无法被永久占用。"
    />

    <SignalDisconnect v-if="phase === 'askStay'" />

    <DisorderDialog
      v-if="phase === 'askStay'"
      :visible="dialogVisible"
      mode="stay"
      eyebrow="FINAL QUERY"
      title="是否试图停留？"
      body="你可以回答。时间不必听从。"
      :hint="stayHint"
      primary-text="停留在过去"
      secondary-text="返回现在"
      :fake-anchoring="fakeAnchoring"
      :position="dialogPos"
      @primary="chooseStay"
      @secondary="chooseReturn"
    />

    <ShatterOverlay
      :visible="phase === 'collapseForce' && showCollapseShatter"
      mode="collapse"
      eyebrow="FORCED RETURN"
      title="时间收回许可。"
      subtitle="没有人能把昨日据为己有。"
    />

    <ForceReturn v-if="phase === 'collapseForce' && !showCollapseShatter" />

    <SealedFinale v-if="phase === 'sealedNow'" />

    <audio
      ref="audio"
      :src="currentTrack"
      preload="auto"
      @ended="onTrackEnded"
      @pause="onMusicPause"
      @loadeddata="onAudioLoaded"
    />
  </div>
</template>

<script>
import TemporalDisorder from '@/components/TemporalDisorder.vue'
import DisorderDialog from '@/components/DisorderDialog.vue'
import ShatterOverlay from '@/components/ShatterOverlay.vue'
import PastPlayer from '@/components/PastPlayer.vue'
import SignalDisconnect from '@/components/SignalDisconnect.vue'
import ForceReturn from '@/components/ForceReturn.vue'
import SealedFinale from '@/components/SealedFinale.vue'
import { playlist } from '@/utils/playlist'

const HARASS_HINTS = [
  '拒绝并不能稳住轴线。',
  '过去仍在另一侧等候。',
  '失温不会自行平复。',
  '你越迟疑，裂缝越清晰。'
]

export default {
  name: 'Home',
  components: {
    TemporalDisorder,
    DisorderDialog,
    ShatterOverlay,
    PastPlayer,
    SignalDisconnect,
    ForceReturn,
    SealedFinale
  },
  data() {
    return {
      phase: 'gate',
      dialogVisible: false,
      dialogPos: { x: 50, y: 46 },
      harassHint: '',
      stayHint: '',
      fakeAnchoring: false,
      showCollapseShatter: true,
      disorderActive: true,
      trackIndex: 0,
      musicUnlocked: false,
      forceResume: true,
      fadingMusic: false,
      timers: []
    }
  },
  computed: {
    currentTrack() {
      if (!playlist.length) return ''
      return playlist[this.trackIndex % playlist.length]
    }
  },
  beforeDestroy() {
    this.clearTimers()
    this.forceResume = false
  },
  methods: {
    queue(fn, ms) {
      const id = window.setTimeout(fn, ms)
      this.timers.push(id)
      return id
    },
    clearTimers() {
      this.timers.forEach((id) => clearTimeout(id))
      this.timers = []
    },
    enterExperience() {
      this.musicUnlocked = true
      this.forceResume = true
      this.trackIndex = 0
      this.phase = 'openingDisorder'
      this.disorderActive = true
      this.$nextTick(() => {
        this.ensureMusic()
        this.queue(() => {
          this.phase = 'askPast'
          this.spawnAskDialog()
        }, 4200)
      })
    },
    ensureMusic() {
      const audio = this.$refs.audio
      if (!audio || !this.musicUnlocked) return
      if (!this.fadingMusic) audio.volume = 1
      try {
        if (!this.fadingMusic) audio.playbackRate = 1
      } catch (e) {
        /* ignore */
      }
      const p = audio.play()
      if (p && p.catch) p.catch(() => {})
    },
    onAudioLoaded() {
      if (this.musicUnlocked) this.ensureMusic()
    },
    onTrackEnded() {
      if (!playlist.length) return
      // 回放阶段：与视频绑定，曲终则循环本轨
      if (this.phase === 'playPast') {
        const audio = this.$refs.audio
        if (audio) {
          try {
            audio.currentTime = 0
          } catch (e) {
            /* ignore */
          }
        }
        this.ensureMusic()
        return
      }
      this.trackIndex = (this.trackIndex + 1) % playlist.length
      this.$nextTick(() => this.ensureMusic())
    },
    onMusicPause() {
      if (!this.forceResume || !this.musicUnlocked || this.fadingMusic) return
      this.queue(() => this.ensureMusic(), 40)
    },
    fadeToTrack(index) {
      if (!playlist.length) return
      const next = ((index % playlist.length) + playlist.length) % playlist.length
      if (next === this.trackIndex) {
        this.ensureMusic()
        return
      }
      const audio = this.$refs.audio
      if (!audio) {
        this.trackIndex = next
        return
      }
      this.fadingMusic = true
      const startVol = audio.volume
      const steps = 6
      let i = 0
      const stepDown = () => {
        i += 1
        audio.volume = Math.max(0, startVol * (1 - i / steps))
        if (i < steps) {
          this.queue(stepDown, 35)
        } else {
          this.trackIndex = next
          this.$nextTick(() => {
            audio.volume = 0
            this.ensureMusic()
            let j = 0
            const stepUp = () => {
              j += 1
              audio.volume = Math.min(1, j / steps)
              if (j < steps) this.queue(stepUp, 40)
              else {
                this.fadingMusic = false
                audio.volume = 1
              }
            }
            stepUp()
          })
        }
      }
      stepDown()
    },
    onVideoTrackChange(index) {
      this.fadeToTrack(index)
    },
    onMusicStutter(payload) {
      const audio = this.$refs.audio
      if (!audio || !this.musicUnlocked || this.fadingMusic) return
      try {
        if (payload && payload.hard) {
          const prev = audio.volume
          audio.volume = 0
          audio.playbackRate = 0.35
          window.setTimeout(() => {
            if (!this.$refs.audio || this.fadingMusic) return
            this.$refs.audio.volume = prev || 1
            this.$refs.audio.playbackRate = 1.8
            this.ensureMusic()
            window.setTimeout(() => {
              if (this.$refs.audio && !this.fadingMusic) this.$refs.audio.playbackRate = 1
            }, 140)
          }, 90 + Math.random() * 80)
        } else {
          audio.playbackRate = 1
          if (!this.fadingMusic) audio.volume = 1
        }
      } catch (e) {
        /* ignore */
      }
    },
    randomPos() {
      return {
        x: 24 + Math.random() * 52,
        y: 28 + Math.random() * 44
      }
    },
    spawnAskDialog() {
      if (this.phase !== 'askPast') return
      this.dialogPos = this.randomPos()
      this.harassHint = HARASS_HINTS[Math.floor(Math.random() * HARASS_HINTS.length)]
      this.dialogVisible = true
      this.queue(() => {
        if (this.phase !== 'askPast') return
        this.dialogVisible = false
        this.queue(() => this.spawnAskDialog(), 500 + Math.random() * 500)
      }, 2600 + Math.random() * 1400)
    },
    refusePast() {
      this.clearTimers()
      this.dialogVisible = false
      this.queue(() => {
        if (this.phase === 'askPast') this.spawnAskDialog()
      }, 600 + Math.random() * 600)
    },
    acceptPast() {
      this.clearTimers()
      this.dialogVisible = false
      this.disorderActive = false
      this.phase = 'shatterToPast'
      this.ensureMusic()
      this.queue(() => {
        this.phase = 'playPast'
      }, 2800)
    },
    onAllVideosDone() {
      // 最后一个视频完整结束后再紊乱
      this.phase = 'endDisorder'
      this.ensureMusic()
      this.queue(() => {
        this.phase = 'signalBreak'
        this.queue(() => {
          this.phase = 'askStay'
          this.stayHint = ''
          this.fakeAnchoring = false
          this.dialogPos = { x: 50, y: 48 }
          this.dialogVisible = true
        }, 2000)
      }, 3400)
    },
    chooseStay() {
      this.clearTimers()
      this.fakeAnchoring = true
      this.stayHint = '正在尝试锚定……'
      this.queue(() => this.beginCollapse(), 1300)
    },
    chooseReturn() {
      this.clearTimers()
      this.stayHint = '时间已做出决定。'
      this.queue(() => this.beginCollapse(), 700)
    },
    beginCollapse() {
      this.clearTimers()
      this.dialogVisible = false
      this.fakeAnchoring = false
      this.stayHint = ''
      this.phase = 'collapseForce'
      this.showCollapseShatter = true
      this.queue(() => {
        this.showCollapseShatter = false
      }, 1500)
      this.queue(() => {
        this.phase = 'sealedNow'
      }, 5000)
    }
  }
}
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background: #05070c;
  color: var(--text-primary);
  overflow: hidden;
}

.enter-gate {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  background:
    radial-gradient(ellipse 55% 40% at 50% 42%, rgba(176, 30, 58, 0.16), transparent 65%),
    #05070c;
  padding: 0 28px;

  &__grain {
    position: absolute;
    inset: 0;
    opacity: 0.07;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__axis {
    position: absolute;
    left: 50%;
    top: 16%;
    bottom: 22%;
    width: 1px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, transparent, rgba(200, 208, 220, 0.35), transparent);
    opacity: 0.5;
    pointer-events: none;
  }

  &__eyebrow {
    position: relative;
    margin: 0 0 20px;
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 0.5em;
    text-indent: 0.5em;
    color: var(--accent-metal);
  }

  &__title {
    position: relative;
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(32px, 7vw, 60px);
    letter-spacing: 0.18em;
    text-indent: 0.18em;
    line-height: 1.35;
  }

  &__lead {
    position: relative;
    margin: 24px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.32em;
    color: var(--text-muted);
  }

  &__pulse {
    position: relative;
    margin-top: 52px;
    width: 9px;
    height: 9px;
    border: 1px solid var(--metal-line);
    animation: gatePulse 2s ease-in-out infinite;
  }
}

.gate-leave-active {
  transition: opacity 0.75s ease, transform 0.75s ease;
}

.gate-leave-to {
  opacity: 0;
  transform: scale(1.03);
}

@keyframes gatePulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
    box-shadow: 0 0 16px rgba(176, 30, 58, 0.4);
  }
}
</style>

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
      title="是否回到尚未愈合的时间？"
      body="倒流有代价。留下，亦是一种选择。"
      :hint="harassHint"
      primary-text="回到过去"
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
      subtitle="正在回到过去。"
    />

    <PastPlayer
      v-if="phase === 'playPast'"
      @timeline="onTimeline"
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
      ref="bgm"
      :src="bgmSrc"
      loop
      preload="auto"
      @pause="onMusicPause"
      @loadeddata="onAudioLoaded"
    />
    <audio
      ref="voice"
      :src="voiceSrc"
      preload="auto"
      @ended="onVoiceEnded"
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
import bgmSrc from '@/assets/music/chenhunxian.mp3'
import voiceSrc from '@/assets/music/voice-return.mp3'

const HARASS_HINTS = [
  '拒绝并不能稳住轴线。',
  '过去仍在另一侧等候。',
  '失温不会自行平复。',
  '你越迟疑，裂缝越清晰。'
]

const BGM_LOW_VOL = 0.16
const BGM_PEAK_VOL = 0.72
const BGM_IDLE_VOL = 0.55

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
      bgmSrc,
      voiceSrc,
      musicUnlocked: false,
      forceResume: true,
      fadingMusic: false,
      voicePlaying: false,
      timelineRatio: 0,
      timers: []
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
    volumeForTimeline(ratio) {
      const r = Math.max(0, Math.min(1, ratio || 0))
      if (r < 0.68) return BGM_LOW_VOL + r * 0.08
      const t = (r - 0.68) / 0.32
      const eased = t * t
      return BGM_LOW_VOL + 0.08 + eased * (BGM_PEAK_VOL - BGM_LOW_VOL - 0.08)
    },
    enterExperience() {
      this.musicUnlocked = true
      this.forceResume = true
      this.phase = 'openingDisorder'
      this.disorderActive = true
      this.$nextTick(() => {
        this.ensureMusic(BGM_IDLE_VOL)
        this.queue(() => {
          this.phase = 'askPast'
          this.spawnAskDialog()
        }, 4200)
      })
    },
    ensureMusic(vol) {
      const audio = this.$refs.bgm
      if (!audio || !this.musicUnlocked || this.voicePlaying) return
      let target = vol
      if (typeof target !== 'number') {
        target = this.phase === 'playPast' ? this.volumeForTimeline(this.timelineRatio) : BGM_IDLE_VOL
      }
      if (!this.fadingMusic) audio.volume = target
      try {
        if (!this.fadingMusic) audio.playbackRate = 1
      } catch (e) {
        /* ignore */
      }
      const p = audio.play()
      if (p && p.catch) p.catch(() => {})
    },
    onTimeline(payload) {
      if (this.phase !== 'playPast' || this.fadingMusic || this.voicePlaying) return
      this.timelineRatio = payload && payload.ratio != null ? payload.ratio : 0
      const audio = this.$refs.bgm
      if (!audio) return
      audio.volume = this.volumeForTimeline(this.timelineRatio)
    },
    onAudioLoaded() {
      if (this.musicUnlocked && !this.voicePlaying) this.ensureMusic()
    },
    onMusicPause() {
      if (!this.forceResume || !this.musicUnlocked || this.fadingMusic || this.voicePlaying) return
      this.queue(() => this.ensureMusic(), 40)
    },
    onMusicStutter(payload) {
      const audio = this.$refs.bgm
      if (!audio || !this.musicUnlocked || this.fadingMusic || this.voicePlaying) return
      const base =
        this.phase === 'playPast' ? this.volumeForTimeline(this.timelineRatio) : BGM_IDLE_VOL
      try {
        if (payload && payload.hard) {
          audio.volume = 0
          audio.playbackRate = 0.35
          window.setTimeout(() => {
            if (!this.$refs.bgm || this.fadingMusic || this.voicePlaying) return
            this.$refs.bgm.volume = base
            this.$refs.bgm.playbackRate = 1.8
            this.ensureMusic(base)
            window.setTimeout(() => {
              if (this.$refs.bgm && !this.fadingMusic) this.$refs.bgm.playbackRate = 1
            }, 140)
          }, 90 + Math.random() * 80)
        } else {
          audio.playbackRate = 1
          if (!this.fadingMusic) audio.volume = base
        }
      } catch (e) {
        /* ignore */
      }
    },
    fadeVolume(el, from, to, ms, done) {
      if (!el) {
        if (done) done()
        return
      }
      const steps = 16
      const stepMs = Math.max(40, Math.floor(ms / steps))
      let i = 0
      el.volume = from
      const tick = () => {
        i += 1
        const x = i / steps
        const eased = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
        el.volume = Math.max(0, Math.min(1, from + (to - from) * eased))
        if (i < steps) this.queue(tick, stepMs)
        else if (done) done()
      }
      tick()
    },
    startReturnVoice() {
      const bgm = this.$refs.bgm
      const voice = this.$refs.voice
      if (!voice) {
        this.phase = 'sealedNow'
        return
      }
      this.voicePlaying = true
      this.fadingMusic = true
      this.forceResume = false

      const beginVoice = () => {
        this.queue(() => {
          try {
            voice.currentTime = 0
            voice.volume = 0
          } catch (e) {
            /* ignore */
          }
          const p = voice.play()
          if (p && p.catch) p.catch(() => {})
          this.fadeVolume(voice, 0, 1, 1600, () => {
            this.fadingMusic = false
          })
        }, 450)
      }

      if (bgm) {
        this.fadeVolume(bgm, bgm.volume, 0, 2000, () => {
          try {
            bgm.pause()
          } catch (e) {
            /* ignore */
          }
          beginVoice()
        })
      } else {
        beginVoice()
      }
    },
    onVoiceEnded() {
      this.voicePlaying = false
      this.phase = 'sealedNow'
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
      this.ensureMusic(BGM_IDLE_VOL)
      this.queue(() => {
        this.phase = 'playPast'
        this.timelineRatio = 0
        this.ensureMusic(BGM_LOW_VOL)
      }, 2800)
    },
    onAllVideosDone() {
      this.phase = 'endDisorder'
      const audio = this.$refs.bgm
      if (audio && !this.voicePlaying) {
        this.fadeVolume(audio, audio.volume, BGM_PEAK_VOL, 900)
      }
      this.queue(() => {
        this.phase = 'signalBreak'
        this.queue(() => {
          this.phase = 'askStay'
          this.stayHint = ''
          this.fakeAnchoring = false
          this.dialogPos = { x: 50, y: 48 }
          this.dialogVisible = true
        }, 2800)
      }, 4200)
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

      // 破碎拉长 → 强制坍塌 → 再丝滑切入配音
      this.queue(() => {
        this.showCollapseShatter = false
      }, 3800)

      this.queue(() => {
        this.startReturnVoice()
      }, 7800)

      this.queue(() => {
        if (this.phase !== 'sealedNow') this.phase = 'sealedNow'
      }, 60000)
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

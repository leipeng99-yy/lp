<template>
  <div class="home">
    <!-- 一次轻触解锁强制配乐（浏览器策略） -->
    <transition name="gate">
      <section v-if="phase === 'gate'" class="enter-gate" @click="enterExperience">
        <div class="enter-gate__grain" />
        <p class="enter-gate__eyebrow">TEMPORAL ENTRY</p>
        <h1 class="enter-gate__title">时空将发生紊乱</h1>
        <p class="enter-gate__lead">轻触进入 · 配乐将持续至终点</p>
        <span class="enter-gate__pulse" />
      </section>
    </transition>

    <TemporalDisorder
      v-if="phase === 'openingDisorder' || phase === 'askPast'"
      mode="open"
      :dim="phase === 'askPast'"
      :active="disorderActive"
      eyebrow="TEMPORAL DRIFT · SIGNAL UNSTABLE"
      title="时空正在失序。"
      lead="轴线正在撕裂。请屏息。"
      @stutter="onMusicStutter"
    />

    <DisorderDialog
      v-if="phase === 'askPast'"
      :visible="dialogVisible"
      mode="ask"
      eyebrow="TEMPORAL QUERY"
      title="是否允许时间倒流？"
      body="当前轴线已紊乱。留下，或回到尚未愈合之处。"
      :hint="harassHint"
      primary-text="回到过去"
      secondary-text="暂留此处"
      :position="dialogPos"
      @primary="acceptPast"
      @secondary="refusePast"
    />

    <ShatterOverlay
      :visible="phase === 'shatterToPast'"
      mode="past"
      eyebrow="REWINDING · DO NOT HOLD ON"
      title="轴线断裂。"
      subtitle="请别眨眼——记忆正穿过你。"
    />

    <PastPlayer
      v-if="phase === 'playPast'"
      @near-complete="onNearComplete"
    />

    <TemporalDisorder
      v-if="phase === 'endDisorder'"
      mode="close"
      :active="true"
      eyebrow="LINK LOST · COLLAPSE IMMINENT"
      title="信号正在溃散。"
      lead="回忆即将被时间收回。"
      @stutter="onMusicStutter"
    />

    <ShatterOverlay
      :visible="phase === 'signalBreak'"
      mode="break"
      eyebrow="LINK LOST · COLLAPSE IMMINENT"
      title="信号正在溃散。"
      subtitle="此次穿梭将被提前终止。"
    />

    <SignalDisconnect v-if="phase === 'askStay'" />

    <DisorderDialog
      v-if="phase === 'askStay'"
      :visible="dialogVisible"
      mode="stay"
      eyebrow="FINAL QUERY"
      title="是否选择停留在过去？"
      body="你可以回答。但答案，已不再重要。"
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
      eyebrow="FORCED RETURN · NOW"
      title="时空坍塌。"
      subtitle="时间收回许可。"
    />

    <ForceReturn v-if="phase === 'collapseForce' && !showCollapseShatter" />

    <SealedFinale v-if="phase === 'sealedNow'" />

    <audio
      ref="audio"
      :src="currentTrack"
      preload="auto"
      @ended="onTrackEnded"
      @pause="onMusicPause"
      @loadeddata="ensureMusic"
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
  '拒绝并不能稳住时空。',
  '过去仍在叩门。',
  '紊乱不会自行平息。',
  '你越迟疑，裂隙越深。'
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
      this.phase = 'openingDisorder'
      this.disorderActive = true
      this.$nextTick(() => {
        this.ensureMusic()
        // 开场紊乱后出现弹框
        this.queue(() => {
          this.phase = 'askPast'
          this.spawnAskDialog()
        }, 3800)
      })
    },
    ensureMusic() {
      const audio = this.$refs.audio
      if (!audio || !this.musicUnlocked) return
      audio.volume = 1
      try {
        audio.playbackRate = 1
      } catch (e) {
        /* ignore */
      }
      const p = audio.play()
      if (p && p.catch) p.catch(() => {})
    },
    onTrackEnded() {
      if (!playlist.length) return
      this.trackIndex = (this.trackIndex + 1) % playlist.length
      this.$nextTick(() => this.ensureMusic())
    },
    onMusicPause() {
      // 永远不能暂停：被系统打断也立刻拉回
      if (!this.forceResume || !this.musicUnlocked) return
      this.queue(() => this.ensureMusic(), 40)
    },
    onMusicStutter(payload) {
      const audio = this.$refs.audio
      if (!audio || !this.musicUnlocked) return
      try {
        if (payload && payload.hard) {
          audio.volume = 0
          audio.playbackRate = 0.25 + Math.random() * 0.35
          window.setTimeout(() => {
            if (!this.$refs.audio) return
            this.$refs.audio.volume = 1
            this.$refs.audio.playbackRate = 1.6 + Math.random() * 1.8
            this.ensureMusic()
            window.setTimeout(() => {
              if (this.$refs.audio) this.$refs.audio.playbackRate = 1
            }, 120)
          }, 70 + Math.random() * 120)
        } else if (payload && payload.soft) {
          audio.playbackRate = 2.4 + Math.random() * 1.6
          window.setTimeout(() => {
            if (this.$refs.audio) this.$refs.audio.playbackRate = 1
          }, 90)
        } else {
          audio.playbackRate = 1
          audio.volume = 1
        }
      } catch (e) {
        /* ignore */
      }
    },
    randomPos() {
      return {
        x: 22 + Math.random() * 56,
        y: 24 + Math.random() * 52
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
        this.queue(() => this.spawnAskDialog(), 380 + Math.random() * 420)
      }, 2200 + Math.random() * 1600)
    },
    refusePast() {
      this.clearTimers()
      this.dialogVisible = false
      this.queue(() => {
        if (this.phase === 'askPast') this.spawnAskDialog()
      }, 500 + Math.random() * 700)
    },
    acceptPast() {
      this.clearTimers()
      this.dialogVisible = false
      this.disorderActive = false
      this.phase = 'shatterToPast'
      this.ensureMusic()
      this.queue(() => {
        this.phase = 'playPast'
      }, 3000)
    },
    onNearComplete() {
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
        }, 2200)
      }, 3600)
    },
    chooseStay() {
      this.clearTimers()
      this.fakeAnchoring = true
      this.stayHint = '正在尝试锚定……'
      this.queue(() => this.beginCollapse(), 1400)
    },
    chooseReturn() {
      this.clearTimers()
      this.stayHint = '时间收回许可。'
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
      }, 1600)
      this.queue(() => {
        this.phase = 'sealedNow'
      }, 5200)
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
    radial-gradient(ellipse 55% 40% at 50% 42%, rgba(176, 30, 58, 0.18), transparent 65%),
    #05070c;
  padding: 0 28px;

  &__grain {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__eyebrow {
    position: relative;
    margin: 0 0 18px;
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 0.48em;
    text-indent: 0.48em;
    color: var(--accent-metal);
  }

  &__title {
    position: relative;
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(36px, 8vw, 68px);
    letter-spacing: 0.2em;
    text-indent: 0.2em;
  }

  &__lead {
    position: relative;
    margin: 22px 0 0;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 0.28em;
    color: var(--text-muted);
  }

  &__pulse {
    position: relative;
    margin-top: 48px;
    width: 10px;
    height: 10px;
    border: 1px solid var(--metal-line);
    animation: gatePulse 1.8s ease-in-out infinite;
  }
}

.gate-leave-active {
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.gate-leave-to {
  opacity: 0;
  transform: scale(1.04);
}

@keyframes gatePulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.35);
    box-shadow: 0 0 18px rgba(176, 30, 58, 0.45);
  }
}
</style>

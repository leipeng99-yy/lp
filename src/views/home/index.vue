<template>
  <div class="home">
    <ChaosFlash v-if="showChaos" :dim="phase === 'askPast'" />

    <DisorderDialog
      v-if="phase === 'askPast'"
      :visible="dialogVisible"
      mode="ask"
      :eyebrow="'TEMPORAL QUERY'"
      :title="'是否允许时间倒流？'"
      :body="'当前轴线已紊乱。留下，或回到尚未愈合之处。'"
      :hint="harassHint"
      :primary-text="'回到过去'"
      :secondary-text="'暂留此处'"
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

    <PastPlayer v-if="phase === 'playPast'" @all-done="onPastDone" />

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
      :eyebrow="'FINAL QUERY'"
      :title="'是否选择停留在过去？'"
      :body="'你可以回答。但答案，已不再重要。'"
      :hint="stayHint"
      :primary-text="'停留在过去'"
      :secondary-text="'返回现在'"
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

    <MusicControl v-if="musicReady" :playing="playing" @toggle="toggleMusic" />
    <audio ref="audio" :src="musicSrc" loop preload="auto" />
  </div>
</template>

<script>
import ChaosFlash from '@/components/ChaosFlash.vue'
import DisorderDialog from '@/components/DisorderDialog.vue'
import ShatterOverlay from '@/components/ShatterOverlay.vue'
import PastPlayer from '@/components/PastPlayer.vue'
import SignalDisconnect from '@/components/SignalDisconnect.vue'
import ForceReturn from '@/components/ForceReturn.vue'
import SealedFinale from '@/components/SealedFinale.vue'
import MusicControl from '@/components/MusicControl.vue'
import musicSrc from '@/assets/music/bgm.mp3'

const HARASS_HINTS = [
  '拒绝并不能稳住时空。',
  '过去仍在叩门。',
  '紊乱不会自行平息。',
  '你越迟疑，裂隙越深。'
]

export default {
  name: 'Home',
  components: {
    ChaosFlash,
    DisorderDialog,
    ShatterOverlay,
    PastPlayer,
    SignalDisconnect,
    ForceReturn,
    SealedFinale,
    MusicControl
  },
  data() {
    return {
      phase: 'chaosFlash',
      // chaosFlash | askPast | shatterToPast | playPast | signalBreak | askStay | collapseForce | sealedNow
      dialogVisible: false,
      dialogPos: { x: 50, y: 46 },
      harassHint: '',
      stayHint: '',
      fakeAnchoring: false,
      showCollapseShatter: true,
      musicSrc,
      playing: false,
      musicReady: false,
      timers: []
    }
  },
  computed: {
    showChaos() {
      return this.phase === 'chaosFlash' || this.phase === 'askPast'
    }
  },
  mounted() {
    this.queue(() => {
      this.phase = 'askPast'
      this.spawnAskDialog()
    }, 3200)
  },
  beforeDestroy() {
    this.clearTimers()
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
      // 不点「回到过去」也会换位再问
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
      this.phase = 'shatterToPast'
      this.musicReady = true
      this.playMusic()
      this.queue(() => {
        this.phase = 'playPast'
      }, 3000)
    },
    onPastDone() {
      this.phase = 'signalBreak'
      this.queue(() => {
        this.phase = 'askStay'
        this.stayHint = ''
        this.fakeAnchoring = false
        this.dialogPos = { x: 50, y: 48 }
        this.dialogVisible = true
      }, 2400)
    },
    chooseStay() {
      this.clearTimers()
      this.fakeAnchoring = true
      this.stayHint = '正在尝试锚定……'
      this.queue(() => {
        this.beginCollapse()
      }, 1400)
    },
    chooseReturn() {
      this.clearTimers()
      this.stayHint = '时间收回许可。'
      this.queue(() => {
        this.beginCollapse()
      }, 700)
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
    },
    playMusic() {
      const audio = this.$refs.audio
      if (!audio) return
      const playPromise = audio.play()
      if (playPromise && playPromise.then) {
        playPromise
          .then(() => {
            this.playing = true
          })
          .catch(() => {
            this.playing = false
          })
      } else {
        this.playing = !audio.paused
      }
    },
    toggleMusic() {
      const audio = this.$refs.audio
      if (!audio) return
      if (audio.paused) {
        audio.play().then(() => {
          this.playing = true
        })
      } else {
        audio.pause()
        this.playing = false
      }
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
</style>

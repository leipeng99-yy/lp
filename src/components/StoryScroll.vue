<template>
  <section class="story-scroll">
    <article
      v-for="(chapter, index) in chapters"
      :key="chapter.id"
      class="story-scroll__chapter"
      :class="{ 'is-visible': visibleMap[chapter.id] }"
      :ref="'chapter-' + chapter.id"
      :data-id="chapter.id"
    >
      <div
        class="story-scroll__bg"
        :style="{
          backgroundImage: `url(${chapter.image})`,
          transform: `translate3d(0, ${offsets[chapter.id] || 0}px, 0) scale(1.12)`
        }"
      />
      <div class="story-scroll__shade" />
      <div class="story-scroll__copy">
        <p class="story-scroll__index">{{ String(index + 1).padStart(2, '0') }}</p>
        <h2 class="story-scroll__title">{{ chapter.title }}</h2>
        <p class="story-scroll__text">{{ chapter.text }}</p>
      </div>
    </article>
  </section>
</template>

<script>
import { getPhoto } from '@/utils/photos'

export default {
  name: 'StoryScroll',
  data() {
    return {
      visibleMap: {},
      offsets: {},
      observer: null,
      chapters: [
        {
          id: 'meet',
          title: '初见',
          text: '世界很大，偏偏遇见了你。',
          image: getPhoto(3)
        },
        {
          id: 'spark',
          title: '心动',
          text: '一瞬间，所有风景都有了名字。',
          image: getPhoto(18)
        },
        {
          id: 'walk',
          title: '同行',
          text: '平凡的日子，因为你而滚烫。',
          image: getPhoto(42)
        },
        {
          id: 'vow',
          title: '约定',
          text: '把余生交给彼此，把热爱交给时间。',
          image: getPhoto(58)
        },
        {
          id: 'glow',
          title: '炽热',
          text: '这一场爱，足够照亮整座城市。',
          image: getPhoto(76)
        }
      ]
    }
  },
  mounted() {
    this.initObserver()
    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.onScroll()
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.onScroll)
    if (this.observer) this.observer.disconnect()
  },
  methods: {
    initObserver() {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const id = entry.target.getAttribute('data-id')
            if (entry.isIntersecting) {
              this.$set(this.visibleMap, id, true)
            }
          })
        },
        { threshold: 0.35 }
      )

      this.chapters.forEach((chapter) => {
        const el = this.$refs['chapter-' + chapter.id]
        const node = Array.isArray(el) ? el[0] : el
        if (node) this.observer.observe(node)
      })
    },
    onScroll() {
      const vh = window.innerHeight
      this.chapters.forEach((chapter) => {
        const el = this.$refs['chapter-' + chapter.id]
        const node = Array.isArray(el) ? el[0] : el
        if (!node) return
        const rect = node.getBoundingClientRect()
        const progress = (vh / 2 - (rect.top + rect.height / 2)) / vh
        this.$set(this.offsets, chapter.id, progress * 60)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.story-scroll {
  position: relative;
  z-index: 1;

  &__chapter {
    position: relative;
    height: 100vh;
    min-height: 640px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }

  &__bg {
    position: absolute;
    inset: -10% 0;
    background-size: cover;
    background-position: center;
    will-change: transform;
    filter: saturate(0.7) brightness(0.62) contrast(1.1) hue-rotate(-8deg);
  }

  &__shade {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(5, 7, 12, 0.2) 0%, rgba(5, 7, 12, 0.35) 40%, rgba(5, 7, 12, 0.9) 100%),
      radial-gradient(ellipse 80% 50% at 20% 80%, rgba(176, 30, 58, 0.22), transparent 60%);
  }

  &__copy {
    position: relative;
    z-index: 2;
    width: min(680px, 88vw);
    padding: 0 8vw 14vh;
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &__chapter.is-visible .story-scroll__copy {
    opacity: 1;
    transform: translateY(0);
  }

  &__index {
    margin: 0 0 14px;
    font-family: var(--font-display);
    font-size: 14px;
    letter-spacing: 0.4em;
    color: var(--accent-metal);
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(42px, 9vw, 76px);
    letter-spacing: 0.18em;
    line-height: 1.05;
  }

  &__text {
    margin: 18px 0 0;
    max-width: 28em;
    font-weight: 300;
    font-size: clamp(15px, 2.2vw, 18px);
    letter-spacing: 0.16em;
    line-height: 1.8;
    color: var(--text-muted);
  }
}

@media (max-width: 640px) {
  .story-scroll__chapter {
    min-height: 100svh;
  }

  .story-scroll__copy {
    padding-bottom: 12vh;
  }
}
</style>

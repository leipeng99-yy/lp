const videoModules = require.context('@/assets/videos', false, /\.mp4$/)

function sortKey(path) {
  const match = path.match(/(\d+)\.mp4$/)
  return match ? Number(match[1]) : 0
}

export const videoList = videoModules
  .keys()
  .sort((a, b) => sortKey(a) - sortKey(b))
  .map((key, index) => {
    const id = index + 1
    return {
      id,
      src: videoModules(key),
      label: `记忆 · ${String(id).padStart(2, '0')}`,
      node: String(id).padStart(2, '0')
    }
  })

export function getVideo(index) {
  if (!videoList.length) return ''
  const i = ((index % videoList.length) + videoList.length) % videoList.length
  return videoList[i].src
}

/** 估算时长，避免开场探测 13 路 video */
export const ESTIMATED_DURATION = 8

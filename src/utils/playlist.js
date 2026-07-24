const modules = require.context('@/assets/music', false, /track\d+\.mp3$/)

function sortKey(path) {
  const match = path.match(/track(\d+)\.mp3$/)
  return match ? Number(match[1]) : 0
}

export const playlist = modules
  .keys()
  .sort((a, b) => sortKey(a) - sortKey(b))
  .map((key) => modules(key))

const modules = require.context('@/assets/photos', false, /\.jpg$/i)

function sortKey(path) {
  const match = path.match(/(\d+)([a-c])\.jpg$/i)
  if (!match) return path
  return Number(match[1]) * 10 + (match[2].toLowerCase().charCodeAt(0) - 97)
}

export const photoList = modules
  .keys()
  .sort((a, b) => sortKey(a) - sortKey(b))
  .map((key) => {
    const name = key.replace(/^\.\//, '')
    const match = name.match(/(\d+)([a-c])\.jpg$/i)
    const clip = match ? Number(match[1]) : 0
    return {
      src: modules(key),
      name,
      clip
    }
  })

export function photosEarly() {
  return photoList.filter((p) => p.clip >= 1 && p.clip <= 4)
}

export function photosMid() {
  return photoList.filter((p) => p.clip >= 5 && p.clip <= 9)
}

export function photosLate() {
  return photoList.filter((p) => p.clip >= 10 && p.clip <= 13)
}

export function pick(list) {
  if (!list || !list.length) return photoList[0] && photoList[0].src
  return list[Math.floor(Math.random() * list.length)].src
}

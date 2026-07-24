const modules = require.context('@/assets/photos', false, /\.jpg$/i)

function sortKey(path) {
  const match = path.match(/(\d+)([a-c])\.jpg$/i)
  if (!match) return path
  return Number(match[1]) * 10 + (match[2].toLowerCase().charCodeAt(0) - 97)
}

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
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

// 回声 / 坍塌各用一半，互不重复
const split = shuffle(photoList.map((p) => p.src))
const mid = Math.ceil(split.length / 2)
export const echoPhotos = split.slice(0, mid)
export const collapsePhotos = split.slice(mid)

/** 池内不放回抽取，用尽后重新洗牌（仍不碰另一段的图） */
export function createPicker(pool) {
  const source = pool && pool.length ? pool.slice() : photoList.map((p) => p.src)
  let bag = shuffle(source)
  return function pickNext() {
    if (!bag.length) bag = shuffle(source)
    return bag.pop()
  }
}

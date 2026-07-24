const ctx = require.context('@/assets/imgs', false, /\.jpg$/)

function parseIndex(key) {
  const match = key.match(/img2 \((\d+)\)\.jpg$/)
  return match ? Number(match[1]) : 0
}

export const photoList = ctx
  .keys()
  .map((key) => ({
    id: parseIndex(key),
    src: ctx(key)
  }))
  .sort((a, b) => a.id - b.id)

export function getPhoto(id) {
  const found = photoList.find((p) => p.id === id)
  return found ? found.src : photoList[0].src
}

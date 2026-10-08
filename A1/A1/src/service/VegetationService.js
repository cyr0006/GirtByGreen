export default {
  getVegetationCover() {
    return fetch('/data/vegetation-cover-2018.geojson').then((r) => r.json())
  },
}

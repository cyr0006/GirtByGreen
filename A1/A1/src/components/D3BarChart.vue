<template>
  <div ref="containerEl" class="d3-bar-chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import { useD3Tooltip } from '@/composables/useD3Tooltip'

// A plain count-by-label bar chart (horizontal or vertical), click-to-select.
// Clicking the already-selected bar clears the selection (toggle).
const props = defineProps({
  data: { type: Array, required: true }, // [{ label, count }]
  selected: { type: String, default: null },
  orientation: { type: String, default: 'vertical' }, // 'vertical' | 'horizontal'
  color: { type: String, default: '#15803d' },
})
const emit = defineEmits(['select'])

const containerEl = ref(null)
const { show, hide } = useD3Tooltip()
let resizeObserver = null

function render() {
  const container = containerEl.value
  if (!container) return

  d3.select(container).selectAll('*').remove()

  const data = props.data
  if (!data.length) return

  const total = d3.sum(data, (d) => d.count) || 1
  const width = container.clientWidth || 320
  const horizontal = props.orientation === 'horizontal'
  const height = horizontal ? Math.max(140, data.length * 32 + 16) : 260
  const margin = horizontal
    ? { top: 4, right: 36, bottom: 4, left: 112 }
    : { top: 8, right: 8, bottom: 48, left: 32 }

  const innerWidth = Math.max(10, width - margin.left - margin.right)
  const innerHeight = Math.max(10, height - margin.top - margin.bottom)

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  const maxCount = d3.max(data, (d) => d.count) || 1

  function opacityFor(d) {
    return !props.selected || d.label === props.selected ? 1 : 0.35
  }
  function tooltipHtml(d) {
    const pct = ((d.count / total) * 100).toFixed(1)
    return `<strong>${d.label}</strong><br>${d.count} project${d.count === 1 ? '' : 's'} (${pct}%)`
  }
  function wire(selection) {
    selection
      .style('cursor', 'pointer')
      .on('click', (_event, d) => emit('select', d.label))
      .on('mousemove', (event, d) => show(tooltipHtml(d), event))
      .on('mouseleave', hide)
  }

  if (horizontal) {
    const y = d3.scaleBand().domain(data.map((d) => d.label)).range([0, innerHeight]).padding(0.28)
    const x = d3.scaleLinear().domain([0, maxCount]).nice().range([0, innerWidth])

    g.append('g').call(d3.axisLeft(y).tickSize(0)).select('.domain').remove()
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(4))
    xAxis.select('.domain').remove()

    const bars = g.append('g').selectAll('rect').data(data, (d) => d.label).join('rect')
    wire(bars)
      .attr('y', (d) => y(d.label))
      .attr('x', 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.count))
      .attr('rx', 3)
      .attr('fill', props.color)
      .attr('opacity', opacityFor)

    g.append('g')
      .selectAll('text')
      .data(data, (d) => d.label)
      .join('text')
      .attr('y', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('x', (d) => x(d.count) + 6)
      .attr('dy', '0.35em')
      .attr('font-size', 11)
      .attr('fill', 'currentColor')
      .attr('pointer-events', 'none')
      .text((d) => d.count)
  } else {
    const x = d3.scaleBand().domain(data.map((d) => d.label)).range([0, innerWidth]).padding(0.28)
    const y = d3.scaleLinear().domain([0, maxCount]).nice().range([innerHeight, 0])

    g.append('g').call(d3.axisLeft(y).ticks(4)).select('.domain').remove()
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-25)')
      .style('text-anchor', 'end')
      .attr('font-size', 10)

    const bars = g.append('g').selectAll('rect').data(data, (d) => d.label).join('rect')
    wire(bars)
      .attr('x', (d) => x(d.label))
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerHeight - y(d.count))
      .attr('rx', 3)
      .attr('fill', props.color)
      .attr('opacity', opacityFor)
  }
}

onMounted(() => {
  render()
  resizeObserver = new ResizeObserver(() => render())
  resizeObserver.observe(containerEl.value)
})
onUnmounted(() => resizeObserver?.disconnect())
watch(() => [props.data, props.selected, props.orientation, props.color], render, { deep: true })
</script>

<style scoped>
.d3-bar-chart {
  width: 100%;
}
</style>

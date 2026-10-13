<template>
  <div ref="containerEl" class="d3-time-series"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import { useD3Tooltip } from '@/composables/useD3Tooltip'

// Monthly counts as an area+line chart, with a drag-to-select (brush) date
// range. Months with no data are zero-filled so the line stays continuous.
const props = defineProps({
  data: { type: Array, required: true }, // [{ month: 'YYYY-MM', count }]
  selectedRange: { type: Array, default: null }, // [startMonth, endMonth] | null
  color: { type: String, default: '#15803d' },
  fill: { type: String, default: 'rgba(21, 128, 61, 0.15)' },
})
const emit = defineEmits(['brush'])

const containerEl = ref(null)
const { show, hide } = useD3Tooltip()
let resizeObserver = null

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function monthToDate(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

function fillMonths(data) {
  const present = data.filter((d) => d.month)
  if (!present.length) return []
  const sorted = [...present].sort((a, b) => a.month.localeCompare(b.month))
  const byMonth = new Map(sorted.map((d) => [d.month, d.count]))
  const cursor = monthToDate(sorted[0].month)
  const end = monthToDate(sorted[sorted.length - 1].month)
  const out = []
  while (cursor <= end) {
    const key = monthKey(cursor)
    out.push({ month: key, date: new Date(cursor), count: byMonth.get(key) || 0 })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out
}

function render() {
  const container = containerEl.value
  if (!container) return

  d3.select(container).selectAll('*').remove()

  const filled = fillMonths(props.data)
  if (!filled.length) return

  const width = container.clientWidth || 320
  const height = 260
  const margin = { top: 10, right: 16, bottom: 26, left: 32 }
  const innerWidth = Math.max(10, width - margin.left - margin.right)
  const innerHeight = Math.max(10, height - margin.top - margin.bottom)

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3
    .scaleTime()
    .domain(d3.extent(filled, (d) => d.date))
    .range([0, innerWidth])
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(filled, (d) => d.count) || 1])
    .nice()
    .range([innerHeight, 0])

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(Math.min(filled.length, 6)).tickFormat(d3.timeFormat('%b %Y')))
    .select('.domain')
    .remove()
  g.append('g').call(d3.axisLeft(y).ticks(4)).select('.domain').remove()

  const area = d3
    .area()
    .x((d) => x(d.date))
    .y0(innerHeight)
    .y1((d) => y(d.count))
    .curve(d3.curveMonotoneX)
  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.count))
    .curve(d3.curveMonotoneX)

  g.append('path').datum(filled).attr('fill', props.fill).attr('d', area)
  g.append('path')
    .datum(filled)
    .attr('fill', 'none')
    .attr('stroke', props.color)
    .attr('stroke-width', 2)
    .attr('d', line)

  g.selectAll('circle')
    .data(filled)
    .join('circle')
    .attr('cx', (d) => x(d.date))
    .attr('cy', (d) => y(d.count))
    .attr('r', 3)
    .attr('fill', props.color)
    .style('cursor', 'pointer')
    .on('mousemove', (event, d) => {
      const label = d3.timeFormat('%B %Y')(d.date)
      show(`<strong>${label}</strong><br>${d.count} project${d.count === 1 ? '' : 's'}`, event)
    })
    .on('mouseleave', hide)

  // Drag across the chart to filter by date range. `sourceEvent` is only set
  // for a real user gesture - it's absent when we programmatically restore
  // the selection below, which stops that restore from re-emitting 'brush'
  // and looping.
  const brush = d3
    .brushX()
    .extent([
      [0, 0],
      [innerWidth, innerHeight],
    ])
    .on('end', (event) => {
      if (!event.sourceEvent) return
      if (!event.selection) {
        emit('brush', null)
        return
      }
      const [x0, x1] = event.selection.map((px) => x.invert(px))
      emit('brush', [monthKey(x0), monthKey(x1)])
    })

  const brushG = g.append('g').attr('class', 'brush').call(brush)

  if (props.selectedRange) {
    const [startKey, endKey] = props.selectedRange
    const start = monthToDate(startKey)
    const end = monthToDate(endKey)
    end.setMonth(end.getMonth() + 1) // select through the end of that month
    brushG.call(brush.move, [x(start), x(end)])
  }
}

onMounted(() => {
  render()
  resizeObserver = new ResizeObserver(() => render())
  resizeObserver.observe(containerEl.value)
})
onUnmounted(() => resizeObserver?.disconnect())
watch(() => [props.data, props.selectedRange, props.color], render, { deep: true })
</script>

<style scoped>
.d3-time-series {
  width: 100%;
}
</style>

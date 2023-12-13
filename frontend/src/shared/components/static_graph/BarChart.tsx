// Libraries
import React, {useEffect, useRef, useState} from 'react'
import {Bar} from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import _ from 'lodash'

// Types
import {Axes, FluxTable, StaticLegendPositionType} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'
import {ColorString} from 'src/types/colors'

// Utils
import {fastMap} from 'src/utils/fast'
import {getLineColorsHexes} from 'src/shared/constants/graphColorPalettes'

import {
  convertToStaticGraphMinMaxValue,
  formatStaticGraphValue,
} from 'src/shared/utils/staticGraph'

// Constants
import {
  LEGEND_POSITION,
  STATIC_GRAPH_OPTIONS,
} from 'src/shared/constants/staticGraph'

// Components
import ChartContainer from 'src/shared/components/static_graph/common/ChartContainer'
import {StaticGraphLegend} from 'src/shared/components/static_graph/common/StaticGraphLegend'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
)

type ScaleType = 'logarithmic' | undefined
type BoundsType = [string, string] | undefined
type MinMaxValueType = number | undefined
interface Props {
  axes: Axes
  cellID: string
  staticGraphStyle: React.CSSProperties
  data: TimeSeriesServerResponse[] | FluxTable[]
  colors: ColorString[]
  xAxisTitle?: string
  yAxisTitle?: string
  staticLegend: boolean
  staticLegendPosition: StaticLegendPositionType
}

const BarChart = ({
  axes,
  staticGraphStyle,
  data,
  colors,
  xAxisTitle,
  yAxisTitle,
  staticLegend,
  staticLegendPosition,
}: Props) => {
  const chartRef = useRef<ChartJS<'bar', [], unknown>>(null)
  const [chartInstance, setChartInstance] = useState<
    ChartJS<'bar', [], unknown>
  >(null)
  const {container, legend} = LEGEND_POSITION[staticLegendPosition]
  const convertData = data[0]['response']['results'][0]['series']
  const axesX = fastMap(convertData, item => _.values(item.tags))
  const columns = convertData[0].columns
  const processedData = fastMap(convertData, item =>
    item.values[0].slice(1).map(value => value)
  )
  const getcolors = getLineColorsHexes(colors, columns.length - 1)
  const datasets = columns.slice(1).map((col, colIndex) => ({
    label: col,
    data: fastMap(processedData, data => data[colIndex]),
    backgroundColor: getcolors[colIndex],
    borderColor: getcolors[colIndex],
    borderWidth: 1,
  }))
  const chartData = {
    labels: axesX,
    datasets,
  }

  const type: ScaleType = axes?.y?.scale === 'log' ? 'logarithmic' : undefined
  const bounds: BoundsType = axes?.y?.bounds
  const min: MinMaxValueType = convertToStaticGraphMinMaxValue(bounds[0])
  const max: MinMaxValueType = convertToStaticGraphMinMaxValue(bounds[1])

  const isValidValue = value => {
    return value !== undefined && value !== ''
  }

  const dynamicOption = {
    ...STATIC_GRAPH_OPTIONS,
    plugins: {
      ...STATIC_GRAPH_OPTIONS.plugins,
    },
    scales: {
      ...STATIC_GRAPH_OPTIONS.scales,
      x: {
        ...STATIC_GRAPH_OPTIONS.scales?.x,
        title: {
          ...STATIC_GRAPH_OPTIONS.scales?.x?.title,
          text: xAxisTitle,
        },
        ticks: {
          ...STATIC_GRAPH_OPTIONS.scales?.x?.ticks,
          callback: function (value) {
            return (
              axes?.x?.prefix + this.getLabelForValue(value) + axes?.x?.suffix
            )
          },
        },
      },
      y: {
        ...STATIC_GRAPH_OPTIONS.scales?.y,
        ...(type && {type}),
        ...(isValidValue(min) && {min}),
        ...(isValidValue(max) && {max}),
        title: {
          ...STATIC_GRAPH_OPTIONS.scales?.y?.title,
          text: yAxisTitle,
        },
        ticks: {
          ...STATIC_GRAPH_OPTIONS.scales?.y?.ticks,
          callback: function (value) {
            return formatStaticGraphValue(axes, value)
          },
        },
      },
    },
  }

  useEffect(() => {
    chartRef.current.resize()
  }, [staticLegend, staticLegendPosition])

  useEffect(() => {
    if (!chartInstance && chartRef.current) {
      setChartInstance(chartRef.current)
    }
  }, [chartRef.current])

  return (
    <div className="dygraph-child">
      <div className="dygraph-child-container" style={{...staticGraphStyle}}>
        <div className="static-graph-container" style={{...container}}>
          <ChartContainer>
            <Bar ref={chartRef} options={dynamicOption} data={chartData} />
          </ChartContainer>
          {staticLegend && chartInstance && (
            <StaticGraphLegend
              chartInstance={chartInstance}
              legendStyle={legend}
              data={chartData}
              colors={colors}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default BarChart

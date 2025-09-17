<template>
  <div class="map-container">
    <div class="map-title">网关设备</div>
    <div id="china-map" ref="chinaMap"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { geoCoordMap } from '@/utils/nation.js' // 导入包含城市经纬度的映射
import chinaGeoJson from '@/views/Layout/component/js/map/china.js'

const chinaMap = ref(null)
let myChart = null

onMounted(() => {
  echarts.registerMap('china', chinaGeoJson)
  window.echarts = echarts
  initMap()
})

onBeforeUnmount(() => {
  // 组件销毁时释放图表实例
  if (myChart) {
    myChart.dispose()
    window.removeEventListener('resize', handleResize)
  }
})

// 处理窗口大小变化
const handleResize = () => {
  if (myChart) {
    myChart.resize()
  }
}

// 初始化地图
const initMap = () => {
  // 初始化 ECharts 实例
  myChart = echarts.init(chinaMap.value, null, {
    renderer: 'canvas',
    useDirtyRect: false,
  })

  // 转换数据格式，用于飞线图
  const convertData = (data) => {
    return data
      .map((item) => {
        const fromCoord = geoCoordMap[item[0].name]
        const toCoord = geoCoordMap[item[1].name]
        if (fromCoord && toCoord) {
          return {
            fromName: item[0].name, // 起点名称
            toName: item[1].name, // 终点名称
            coords: [fromCoord, toCoord], // 起点和终点的坐标
            lineStyle: {
              color: '#f5f1ed', // 默认线条颜色
            },
          }
        }
        return null
      })
      .filter((item) => item !== null) // 过滤掉无效的数据
  }

  // 生成散点数据，设置发起方和接收方的颜色
  const generateScatterData = (data) => {
    const scatterData = []
    data.forEach((item) => {
      scatterData.push({
        name: item[0].name,
        value: geoCoordMap[item[0].name],
        IP: item[0].IP, // IP 地址
        itemStyle: { color: '#ff3300' }, // 发起方为红色
      })
      scatterData.push({
        name: item[1].name,
        value: geoCoordMap[item[1].name],
        IP: item[1].IP, // IP 地址
        itemStyle: { color: '#ffc533' }, // 接收方为蓝色
      })
    })
    return scatterData
  }

  // 定义飞线图的数据
  const data = [
    [
      { name: '长沙', IP: '192.168.1.3' },
      { name: '深圳', value: 50, IP: '45.25.8.154' },
    ],
    [
      { name: '南昌', IP: '192.168.15.15' },
      { name: '深圳', value: 95, IP: '45.25.8.154' },
    ],
    [
      { name: '昆明', IP: '192.168.15.15' },
      { name: '深圳', value: 95, IP: '45.25.8.154' },
    ],
  ]

  // ECharts 配置项
  const option = {
    backgroundColor: 'rgba(5, 10, 23, 0.62)', // 设置背景色
    title: {
      text: ' ',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesType === 'effectScatter') {
          return `${params.data.name} : ${params.data.IP}` // 显示城市名和 IP 地址
        } else if (params.seriesType === 'lines') {
          return `${params.data.fromName} -> ${params.data.toName}` // 显示流向信息
        }
      },
      backgroundColor: 'rgba(0, 15, 40, 0.8)',
      borderColor: 'rgba(0, 224, 219, 0.8)',
      borderWidth: 1,
      textStyle: {
        color: '#1affff',
        fontSize: 12,
      },
      extraCssText: 'box-shadow: 0 0 10px rgba(0, 224, 219, 0.6);',
    },
    geo: {
      map: 'china',
      zoom: 1.2, // 缩放比例调小，确保显示更多内容
      center: [104, 36], // 地图中心点稍微向左上方调整
      roam: true, // 允许地图的平移和缩放
      scaleLimit: {
        min: 0.8, // 最小缩放比例
        max: 5.0, // 最大缩放比例
      },
      selectedMode: 'single', // 允许选中单个区域
      layoutCenter: ['50%', '50%'], // 地图位置居中
      layoutSize: '100%', // 地图大小
      aspectScale: 0.85, // 长宽比
      silent: false, // 不静默，允许交互
      emphasis: {
        focus: 'self', // 聚焦当前区域
        blurScope: 'coordinateSystem', // 模糊其他区域
        disabled: false, // 启用高亮
        label: {
          show: false, // 不显示标签
        },
      },
      itemStyle: {
        normal: {
          areaColor: {
            type: 'linear-gradient',
            x: 0,
            y: 300,
            x2: 0,
            y2: 0,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(2, 12, 23, 0.8)', // 底部颜色
              },
              {
                offset: 1,
                color: 'rgba(2, 12, 23, 0.3)', // 顶部颜色
              },
            ],
            global: true,
          }, // 板块颜色渐变
          borderColor: 'rgb(17,153,194)', // 设置省份边界颜色为荧光蓝
          borderWidth: 0.5, // 设置省份边界宽度
          shadowColor: 'rgba(255,255,255,0.63)', // 设置阴影颜色为白色
          shadowBlur: 5, // 阴影模糊度
        },
        emphasis: {
          areaColor: '#1affff', // 设置鼠标悬浮时的区域颜色为亮蓝色
          borderColor: '#000000', // 鼠标悬停时边界颜色
          borderWidth: 1.5, // 鼠标悬停时边界宽度
          shadowColor: 'rgba(0,224,219,0.8)', // 鼠标悬停时阴影颜色
          shadowBlur: 15, // 鼠标悬停时阴影模糊度
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          opacity: 0.8, // 透明度
        },
      },
    },
    series: [
      {
        type: 'lines', // 系列类型为线图
        zlevel: 2, // 线图所在的图层 zlevel，值越大图层越靠上
        effect: {
          show: true, // 显示特效
          period: 3, // 特效动画周期，值越小动画速度越快
          trailLength: 0.5, // 特效尾迹长度，值越大尾迹越长
          color: '#f1eaea', // 特效颜色
          symbolSize: 3, // 特效符号大小
        },
        lineStyle: {
          normal: {
            color: '#ffffff', // 线的颜色
            width: 0, // 线的宽度
            curveness: 0.2, // 线的弯曲程度，0 表示直线
          },
        },
        data: convertData(data), // 转换后的数据
      },
      {
        type: 'effectScatter', // 系列类型为带有涟漪特效的散点图
        coordinateSystem: 'geo', // 使用地理坐标系
        zlevel: 1, // 散点图所在的图层 zlevel
        rippleEffect: {
          brushType: 'stroke', // 涟漪的绘制方式为描边
        },
        label: {
          normal: {
            show: true, // 显示标签
            position: 'right', // 标签位置在右侧
            formatter: '{b}', // 标签格式化，显示城市名称
          },
        },
        symbolSize: 8, // 标记点的大小
        data: generateScatterData(data), // 生成的散点数据
      },
    ],
  }

  // 使用配置项和数据显示图表
  myChart.setOption(option)

  // 添加鼠标滚轮缩放事件
  const handleWheel = (event) => {
    // 防止页面滚动
    event.preventDefault()

    // 计算缩放比例
    const delta = (event.wheelDelta || -event.detail) > 0 ? 1.2 : 0.8

    try {
      // 获取当前视图
      const viewOption = myChart.getOption()
      if (!viewOption || !viewOption.geo || !viewOption.geo[0]) {
        console.error('无法获取地图配置')
        return
      }

      const currentZoom = viewOption.geo[0].zoom || 1.0

      // 计算新的缩放级别，确保在允许的范围内
      const newZoom = Math.max(0.8, Math.min(5.0, currentZoom * delta))

      // 获取鼠标在容器中的位置
      const rect = chinaMap.value.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // 应用新的缩放级别
      myChart.setOption(
        {
          geo: {
            zoom: newZoom,
            center: newZoom > currentZoom ? undefined : viewOption.geo[0].center,
          },
        },
        true,
      )

      console.log(`缩放级别: ${newZoom.toFixed(2)}`)
    } catch (error) {
      console.error('缩放处理错误:', error)
    }
  }

  // 添加多种事件监听，确保兼容性
  chinaMap.value.addEventListener('mousewheel', handleWheel, { passive: false })
  chinaMap.value.addEventListener('DOMMouseScroll', handleWheel, { passive: false }) // Firefox
  chinaMap.value.addEventListener('wheel', handleWheel, { passive: false }) // 标准

  // 添加地图交互事件
  myChart.on('georoam', function (params) {
    // 可以在这里添加缩放或平移时的自定义行为
    const viewOption = myChart.getOption()
    const currentZoom = viewOption.geo[0].zoom

    // 根据缩放级别调整视觉效果
    if (currentZoom > 2) {
      // 高缩放级别时增强边界显示
      myChart.setOption({
        geo: {
          itemStyle: {
            normal: {
              borderWidth: 1.0,
              shadowBlur: 8,
            },
          },
        },
      })
    } else {
      // 恢复默认效果
      myChart.setOption({
        geo: {
          itemStyle: {
            normal: {
              borderWidth: 0.5,
              shadowBlur: 5,
            },
          },
        },
      })
    }
  })

  // 添加鼠标悬停效果增强
  myChart.on('mouseover', { seriesType: 'effectScatter' }, function (params) {
    // 高亮显示当前点
    myChart.dispatchAction({
      type: 'highlight',
      seriesIndex: 1,
      dataIndex: params.dataIndex,
    })
  })

  // 添加鼠标移出效果
  myChart.on('mouseout', { seriesType: 'effectScatter' }, function (params) {
    // 取消高亮显示
    myChart.dispatchAction({
      type: 'downplay',
      seriesIndex: 1,
      dataIndex: params.dataIndex,
    })
  })

  // 添加窗口大小变化时重新调整图表大小的监听器
  window.addEventListener('resize', handleResize)
}
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.map-title {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: #1affff;
  font-size: 1.5rem;
  z-index: 1;
  text-shadow: 0 0 10px rgba(26, 255, 255, 0.6);
  font-weight: bold;
  background-color: rgba(5, 10, 23, 0.5);
  padding: 5px 15px;
  border-radius: 4px;
  border: 1px solid rgba(26, 255, 255, 0.3);
  letter-spacing: 2px;
}

#china-map {
  width: 100%;
  height: 100%;
  background-color: rgba(5, 10, 23, 0.62);
  flex: 1;
  border-radius: 4px;
  box-shadow: inset 0 0 15px rgba(0, 224, 219, 0.2);
  position: relative;
  overflow: hidden;
}
</style>

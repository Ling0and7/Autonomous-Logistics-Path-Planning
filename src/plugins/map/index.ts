import { App, defineComponent, h, onMounted, ref, Ref, PropType } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

const CampusMap = defineComponent({
    props: {
        center: {
            type: Array as unknown as PropType<[number, number]>,
            default: () => [120.3699, 30.3195],
            validator: (v: unknown): v is [number, number] => {
                return Array.isArray(v) && v.length === 2
                    && typeof v[0] === 'number' && typeof v[1] === 'number';
            }
        },
        zoom: {
            type: Number,
            default: 16
        }
    },
    setup(props): {
        mapRef: Ref<HTMLDivElement | null>;
        addCarMarker: (carId: string, position: [number, number]) => void;
    } {
        const mapRef = ref<HTMLDivElement | null>(null)
        let map: any = null
        let markers: Record<string, any> = {}

        onMounted(async (): Promise<void> => {
            if (!mapRef.value) return
            // 加载高德地图 SDK
            await AMapLoader.load({
                key: '5bab54fd93eba11f7a3c4edad4a27150',
                version: '2.0',
                plugins: ['AMap.Marker']
            })
            const win = window as any
            map = new win.AMap.Map(mapRef.value, {
                center: props.center,
                zoom: props.zoom
            })
        })

        const addCarMarker = (carId: string, position: [number, number]): void => {
            if (!map) return
            if (markers[carId]) markers[carId].remove()

            const win = window as any
            markers[carId] = new win.AMap.Marker({
                position,
                title: `快递车${carId}`,
                icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
            })
            markers[carId].setMap(map)
        }

        return { mapRef, addCarMarker }
    },
    render() {
        return h('div', {
            ref: 'mapRef',
            style: 'width: 100%; height: 500px; border: 1px solid #ddd;'
        })
    }
})

// 导出插件和组件
export default {
    install(app: App) {
        app.component('CampusMap', CampusMap)
    }
}

export { CampusMap }
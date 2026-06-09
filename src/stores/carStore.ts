import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义车辆类型（统一类型约束，保留原有结构）
export interface Car {
    id: string
    status: 'running' | 'idle' | 'error' // 运行中/闲置/故障
    battery: number // 电量（0-100）
    position: [number, number] // 经纬度位置（杭州下沙区域）
    currentTask: string // 当前任务（如“配送订单OD-123”）
}

export const useCarStore = defineStore('car', () => {
    // 车辆列表状态：初始数据全部改为杭州下沙坐标（匹配目标地图）
    // carStore.ts 中的车辆数据示例
    const cars = ref<Car[]>([
        { id: 'CAR_001', status: 'running', battery: 85, position: [120.3702, 30.3198], currentTask: '配送订单OD-123' },
        { id: 'CAR_002', status: 'idle', battery: 90, position: [120.3705, 30.3201], currentTask: '无' },
        { id: 'CAR_003', status: 'running', battery: 70, position: [120.3695, 30.3192], currentTask: '配送订单OD-456' }, // 新增车辆，坐标在范围内
        { id: 'CAR_004', status: 'running', battery: 60, position: [120.3710, 30.3205], currentTask: '配送订单OD-789' }  // 新增车辆，坐标在范围内
    ])

    // 🔥 新增：快捷获取所有运行中的车辆（简化地图组件逻辑）
    const getRunningCars = computed(() => {
        return cars.value.filter(car => car.status === 'running')
    })

    // 原有方法：批量更新车辆信息
    const updateCar = (carId: string, updates: Partial<Car>) => {
        const carIndex = cars.value.findIndex(car => car.id === carId)
        if (carIndex !== -1) {
            // 合并原有数据和更新数据（不覆盖未修改的字段）
            cars.value[carIndex] = { ...cars.value[carIndex], ...updates }
        } else {
            console.warn(`车辆${carId}不存在，无法更新`)
        }
    }

    // 原有方法：仅更新车辆状态
    const updateCarStatus = (carId: string, status: Car['status']) => {
        const car = cars.value.find(car => car.id === carId)
        if (car) {
            car.status = status
        } else {
            console.warn(`车辆${carId}不存在，无法更新状态`)
        }
    }

    // 原有方法：新增车辆（默认坐标为杭州下沙）
    const addCar = (newCar: Car) => {
        if (!cars.value.some(car => car.id === newCar.id)) {
            // 兜底：如果新增车辆未传position，默认设为杭州下沙核心坐标
            if (!newCar.position) {
                newCar.position = [120.3702, 30.3198]
            }
            cars.value.push(newCar)
        } else {
            console.warn(`车辆${newCar.id}已存在`)
        }
    }

    // 原有方法：删除车辆
    const removeCar = (carId: string) => {
        const beforeLength = cars.value.length
        cars.value = cars.value.filter(car => car.id !== carId)
        if (beforeLength === cars.value.length) {
            console.warn(`车辆${carId}不存在，无法删除`)
        }
    }
// 新增：删除车辆（按ID）
    const deleteCarById = (carId: string) => {
        cars.value = cars.value.filter(car => car.id !== carId)
    }

    return {
        cars,
        getRunningCars, // 导出新增的运行中车辆快捷方法
        updateCar,
        updateCarStatus,
        addCar,
        removeCar,
        deleteCarById
    }
})
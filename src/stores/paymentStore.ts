import { defineStore } from 'pinia'

// ========== 1. 定义核心类型 ==========
/** 支付模块状态类型 */
interface PaymentState {
    balance: number; // 用户余额
    paymentRecords: PaymentRecord[]; // 支付记录列表
}

/** 支付记录类型 */
interface PaymentRecord {
    payId: string; // 前端模板用的payId
    orderId: string; // 关联订单ID
    amount: number; // 金额（正数=充值，负数=扣款）
    type: 'recharge' | 'payment'; // 类型：充值/消费
    status: 'success' | 'failed'; // 状态：成功/失败
    payTime: string; // 前端模板用的payTime
    payMethod: 'balance' | 'wechat' | 'alipay'; // 支付方式（匹配前端）
}

/** 新增支付记录的入参类型 */
interface AddPaymentRecordParams {
    orderId: string;
    amount: number;
    type: 'recharge' | 'payment';
    status: 'success' | 'failed';
    payMethod: 'balance' | 'wechat' | 'alipay'; // 支付方式
}

// ========== 2. 定义Pinia Store ==========
export const usePaymentStore = defineStore('payment', {
    // 状态初始化
    state: (): PaymentState => ({
        balance: 0, // 初始余额
        paymentRecords: [] // 初始无支付记录
    }),

    // 计算属性（格式化数据）
    getters: {
        /** 格式化余额（保留2位小数，带¥符号） */
        formattedBalance(): string {
            return `¥${this.balance.toFixed(2)}`;
        },

        /** 筛选成功的支付记录 */
        successPaymentRecords(): PaymentRecord[] {
            return this.paymentRecords.filter(record => record.status === 'success');
        },
        getPaymentByOrderId(): (orderId: string) => PaymentRecord | undefined {
            // 返回一个函数，接收 orderId 作为参数，查找匹配的记录
            return (orderId: string) => {
                return this.paymentRecords.find(record => record.orderId === orderId);
            };
        }
    },

    // 业务方法（修改状态）
    actions: {
        /**
         * 初始化余额（从本地存储加载）
         */
        initBalance(): void {
            const savedBalance = localStorage.getItem('userPaymentBalance');
            const savedRecords = localStorage.getItem('userPaymentRecords');

            // 加载余额
            if (savedBalance) {
                this.balance = Number(savedBalance);
            }

            // 加载支付记录
            if (savedRecords) {
                try {
                    this.paymentRecords = JSON.parse(savedRecords);
                } catch (e) {
                    console.error('加载支付记录失败：', e);
                    this.paymentRecords = [];
                }
            }
        },

        /**
         * 充值方法（适配前端：记录支付方式）
         * @param amount 充值金额（必须>0）
         * @param payMethod 支付方式（微信/支付宝）
         */
        recharge(amount: number, payMethod: 'wechat' | 'alipay' = 'wechat'): boolean {
            // 校验金额
            if (amount <= 0) {
                console.error('充值金额必须大于0');
                return false;
            }

            // 修改余额
            this.balance += amount;

            // 新增充值记录（补充支付方式）
            this.addPaymentRecord({
                orderId: `RECHARGE_${Date.now()}`, // 生成充值订单ID
                amount,
                type: 'recharge',
                status: 'success',
                payMethod // 传递支付方式
            });

            // 持久化数据
            this.persistState();
            return true;
        },

        /**
         * 扣款方法（适配前端：记录支付方式）
         * @param amount 扣款金额（必须>0）
         * @param payMethod 支付方式（余额/微信/支付宝）
         * @returns 是否扣款成功（余额不足返回false）
         */
        deduct(amount: number, payMethod: 'balance' | 'wechat' | 'alipay' = 'balance'): boolean {
            // 校验金额
            if (amount <= 0) {
                console.error('扣款金额必须大于0');
                return false;
            }

            // 余额支付时校验余额，非余额支付直接扣（模拟）
            if (payMethod === 'balance' && this.balance < amount) {
                console.error('余额不足');
                return false;
            }

            // 修改余额（仅余额支付时扣减）
            if (payMethod === 'balance') {
                this.balance -= amount;
            }

            // 新增扣款记录（补充支付方式，金额记为负数）
            this.addPaymentRecord({
                orderId: `PAYMENT_${Date.now()}`, // 生成消费订单ID
                amount: -amount, // 扣款金额记为负数
                type: 'payment',
                status: 'success',
                payMethod // 传递支付方式
            });

            // 持久化数据
            this.persistState();
            return true;
        },

        /**
         * 订单支付方法（适配前端直接调用）
         * @param orderId 订单ID
         * @param payMethod 支付方式
         * @param amount 支付金额
         */
        payOrder(orderId: string, payMethod: 'balance' | 'wechat' | 'alipay', amount: number): boolean {
            // 校验参数
            if (!orderId || !payMethod || amount <= 0) {
                console.error('支付参数错误');
                return false;
            }

            // 调用扣款/支付逻辑
            let success = false;
            if (payMethod === 'balance') {
                success = this.deduct(amount, payMethod);
            } else {
                // 微信/支付宝支付：模拟成功（无需扣余额）
                success = true;
                // 记录支付记录
                this.addPaymentRecord({
                    orderId,
                    amount,
                    type: 'payment',
                    status: 'success',
                    payMethod
                });
                this.persistState();
            }

            return success;
        },

        /**
         * 新增支付记录（字段名完全匹配前端）
         * @param p 支付记录参数（类型：AddPaymentRecordParams）
         */
        addPaymentRecord(p: AddPaymentRecordParams): void {
            const newRecord: PaymentRecord = {
                payId: `PAY_${Date.now()}`, // 前端模板用的payId（替换原来的id）
                orderId: p.orderId,
                amount: p.amount,
                type: p.type,
                status: p.status,
                payTime: new Date().toLocaleString(), // 前端模板用的payTime（替换原来的createTime）
                payMethod: p.payMethod // 支付方式
            };

            // 添加到记录列表
            this.paymentRecords.unshift(newRecord); // 最新记录放前面

            // 持久化数据
            this.persistState();
        },

        /**
         * 持久化状态到本地存储（防止数据丢失）
         */
        persistState(): void {
            localStorage.setItem('userPaymentBalance', this.balance.toString());
            localStorage.setItem('userPaymentRecords', JSON.stringify(this.paymentRecords));
        },

        /**
         * 清空支付记录（仅测试用）
         */
        clearRecords(): void {
            this.paymentRecords = [];
            this.persistState();
        }
    }
});
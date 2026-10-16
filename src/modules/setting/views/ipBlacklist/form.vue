<!--
 - MineAdmin is committed to providing solutions for quickly building web applications
 - Please view the LICENSE file that was distributed with this source code,
 - For the full copyright and license information.
 - Thank you very much for using MineAdmin.
 -
 - @Author X.Mo<root@imoi.cn>
 - @Link   https://github.com/mineadmin
-->
<script setup lang="ts">
import type { IpBlacklistVo } from '~/setting/api/ipBlacklist'
import type { MaFormExpose } from '@mineadmin/form'
import { createBatch, save } from '~/setting/api/ipBlacklist'
import { splitIps } from '@/utils/ip.ts'
import getFormItems from './data/getFormItems.tsx'
import useForm from '@/hooks/useForm.ts'
import { ResultCode } from '@/utils/ResultCode.ts'

defineOptions({ name: 'setting:ipBlacklist:form' })

const { formType = 'add', data = null } = defineProps<{
  formType: 'add' | 'edit'
  data?: IpBlacklistVo | null
}>()

const t = useTrans().globalTrans
const banForm = ref<MaFormExpose>()
const model = ref<IpBlacklistVo>({})

// ma-form 挂载后初始化：编辑时把传入的行数据灌进 model（新增时 data 为 null，沿用 getFormItems 里的默认值）
useForm('banForm').then((form: MaFormExpose) => {
  if (data) {
    Object.keys(data).forEach((key: string) => {
      model.value[key] = data[key]
    })
  }
  form.setItems(getFormItems(formType, t, model.value))
  form.setOptions({
    labelWidth: '100px',
  })
})

/**
 * 新增：把多行文本拆成数组后走批量接口（后端自动去重并返回创建 / 跳过明细）；
 * 成功 resolve 交父组件弹窗回调提示，失败 reject 由外部 catch.
 */
function add(): Promise<any> {
  const payload = {
    ips: splitIps(model.value.ip ?? ''),
    ban_reason: model.value.ban_reason ?? '',
    remark: model.value.remark ?? '',
    status: model.value.status ?? 1,
  }

  return new Promise((resolve, reject) => {
    createBatch(payload).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch((err) => {
      reject(err)
    })
  })
}

/**
 * 编辑：整行提交（ip / 封禁原因 / 备注 / 状态），其中 ip 在表单里是禁用的，值保持不变.
 */
function edit(): Promise<any> {
  return new Promise((resolve, reject) => {
    save(model.value.id as number, model.value).then((res: any) => {
      res.code === ResultCode.SUCCESS ? resolve(res) : reject(res)
    }).catch((err) => {
      reject(err)
    })
  })
}

defineExpose({
  add,
  edit,
  maForm: banForm,
})
</script>

<template>
  <ma-form ref="banForm" v-model="model" />
</template>

<style scoped lang="scss">

</style>

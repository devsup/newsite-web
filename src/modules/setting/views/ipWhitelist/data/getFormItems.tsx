/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { MaFormItem } from '@mineadmin/form'
import type { IpWhitelistVo } from '~/setting/api/ipWhitelist.ts'
import MaDictRadio from '@/components/ma-dict-picker/ma-dict-radio.vue'
import { isValidIpOrCidr, splitIps } from '@/utils/ip.ts'

/** 表单配置：新增用多行文本批量录入 IP / 网段，编辑只改单条；备注必填，状态走 system-status 字典 */
export default function getFormItems(formType: 'add' | 'edit' = 'add', t: any, model: IpWhitelistVo): MaFormItem[] {
  // 新增支持批量录入（一行一个），编辑只针对单条记录
  const isBatch = formType === 'add'

  if (isBatch) {
    model.ip = model.ip ?? ''
    model.remark = model.remark ?? ''
    model.status = model.status ?? 1
  }

  return [
    {
      label: () => t('ipWhitelist.ip'),
      prop: 'ip',
      render: 'input',
      renderProps: isBatch
        ? {
            type: 'textarea',
            rows: 6,
            placeholder: t('ipWhitelist.ipBatchPlaceholder'),
            clearable: true,
          }
        : {
            placeholder: t('ipWhitelist.ipPlaceholder'),
            clearable: true,
          },
      itemProps: {
        rules: [
          { required: true, message: t('form.requiredInput', { msg: t('ipWhitelist.ip') }) },
          {
            validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
              if (!value) {
                callback()
                return
              }

              const list = isBatch ? splitIps(value) : [String(value).trim()]
              if (list.length > 0 && list.every(isValidIpOrCidr)) {
                callback()
                return
              }

              callback(new Error(isBatch ? t('ipWhitelist.ipBatchInvalid') : t('ipWhitelist.ipInvalid')))
            },
          },
        ],
      },
    },
    {
      label: () => t('ipWhitelist.remark'),
      prop: 'remark',
      render: 'input',
      renderProps: {
        placeholder: t('ipWhitelist.remarkPlaceholder'),
        clearable: true,
      },
      itemProps: {
        rules: [
          { required: true, message: t('form.requiredInput', { msg: t('ipWhitelist.remark') }) },
        ],
      },
    },
    {
      label: () => t('crud.status'),
      prop: 'status',
      render: () => MaDictRadio,
      renderProps: {
        dictName: 'system-status',
      },
    },
  ]
}

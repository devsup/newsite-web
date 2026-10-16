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
import type { IpBlacklistVo } from '~/setting/api/ipBlacklist.ts'
import MaDictRadio from '@/components/ma-dict-picker/ma-dict-radio.vue'
import { isValidIpOrCidr, splitIps } from '@/utils/ip.ts'

/** 表单配置：新增用多行文本批量录入 IP / 网段，编辑只改单条且 IP 不可修改（与参考站点一致）；封禁原因必填 */
export default function getFormItems(formType: 'add' | 'edit' = 'add', t: any, model: IpBlacklistVo): MaFormItem[] {
  // 新增支持批量录入（一行一个），编辑只针对单条记录
  const isBatch = formType === 'add'

  if (isBatch) {
    model.ip = model.ip ?? ''
    model.ban_reason = model.ban_reason ?? ''
    model.remark = model.remark ?? ''
    model.status = model.status ?? 1
  }

  return [
    {
      label: () => t('ipBlacklist.ip'),
      prop: 'ip',
      render: 'input',
      renderProps: isBatch
        ? {
            type: 'textarea',
            rows: 6,
            placeholder: t('ipBlacklist.ipBatchPlaceholder'),
            clearable: true,
          }
        : {
            placeholder: t('ipBlacklist.ipPlaceholder'),
            // 编辑时 IP 不允许修改（改 IP 等于换一条封禁记录，应删除后重加）——照参考站点
            disabled: true,
          },
      itemProps: {
        rules: [
          { required: true, message: t('form.requiredInput', { msg: t('ipBlacklist.ip') }) },
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

              callback(new Error(isBatch ? t('ipBlacklist.ipBatchInvalid') : t('ipBlacklist.ipInvalid')))
            },
          },
        ],
      },
    },
    {
      label: () => t('ipBlacklist.banReason'),
      prop: 'ban_reason',
      render: 'input',
      renderProps: {
        placeholder: t('ipBlacklist.banReasonPlaceholder'),
        clearable: true,
      },
      itemProps: {
        rules: [
          { required: true, message: t('form.requiredInput', { msg: t('ipBlacklist.banReason') }) },
        ],
      },
    },
    {
      label: () => t('crud.remark'),
      prop: 'remark',
      render: 'input',
      renderProps: {
        placeholder: t('form.pleaseInput', { msg: t('crud.remark') }),
        clearable: true,
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

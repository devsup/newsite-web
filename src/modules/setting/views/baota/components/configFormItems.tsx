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
import type { BaoTaConfigVo } from '~/setting/api/baota.ts'

import MaDictRadio from '@/components/ma-dict-picker/ma-dict-radio.vue'

/**
 * API 配置表单字段。
 *
 * 密钥框在编辑时**不回填**（列表接口本来就不返回密钥，留空即「不修改」），
 * 这一点由 placeholder 明确告知用户，避免他以为密钥丢了。
 * 地址的正则只做「像不像一个 http(s) 地址」的前端预检，真正的强校验在后端 ApiUrlRule。
 */
export default function getConfigFormItems(formType: 'add' | 'edit', t: any, model: BaoTaConfigVo): MaFormItem[] {
  if (formType === 'add') {
    model.status = model.status ?? 1
    model.weight = model.weight ?? 0
  }

  return [
    {
      label: () => t('baota.configName'),
      prop: 'name',
      render: 'input',
      renderProps: {
        placeholder: t('baota.configNamePlaceholder'),
        clearable: true,
      },
      itemProps: {
        rules: [
          { required: true, message: t('form.requiredInput', { msg: t('baota.configName') }) },
        ],
      },
    },
    {
      label: () => t('baota.apiUrl'),
      prop: 'api_url',
      render: 'input',
      renderProps: {
        placeholder: t('baota.apiUrlPlaceholder'),
        clearable: true,
      },
      itemProps: {
        rules: [
          { required: true, message: t('form.requiredInput', { msg: t('baota.apiUrl') }) },
          {
            pattern: /^https?:\/\/[^\s/]+/i,
            message: t('baota.apiUrlPlaceholder'),
            trigger: 'blur',
          },
        ],
      },
    },
    {
      label: () => t('baota.apiKey'),
      prop: 'api_key',
      render: 'input',
      renderProps: {
        type: 'textarea',
        rows: 3,
        placeholder: formType === 'add' ? t('baota.apiKeyPlaceholder') : t('baota.apiKeyEditPlaceholder'),
      },
      itemProps: {
        rules: formType === 'add'
          ? [{ required: true, message: t('form.requiredInput', { msg: t('baota.apiKey') }) }]
          : [],
      },
    },
    {
      label: () => t('baota.weight'),
      prop: 'weight',
      render: 'inputNumber',
      renderProps: {
        min: 0,
        max: 9999,
        controlsPosition: 'right',
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
    {
      label: () => t('crud.remark'),
      prop: 'remark',
      render: 'input',
      renderProps: {
        type: 'textarea',
        rows: 2,
        clearable: true,
      },
    },
  ]
}

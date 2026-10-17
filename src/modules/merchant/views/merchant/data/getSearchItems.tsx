import type { MaSearchItem } from '@mineadmin/search'
import type { MerchantOptions } from '~/merchant/api/merchant'

import MaDictSelect from '@/components/ma-dict-picker/ma-dict-select.vue'

/** 商户搜索：ID / 名称 / 展示类型 / 区域 / 类目 / 状态 / 跳转链接 */
export default function getSearchItems(t: any, options: MerchantOptions): MaSearchItem[] {
  return [
    { label: () => t('ID'), prop: 'id', render: 'input' },
    { label: () => t('merchantInfo.name'), prop: 'name', render: 'input' },
    {
      label: () => t('merchantInfo.showType'),
      prop: 'show_type',
      render: 'select',
      renderProps: {
        clearable: true,
        filterable: true,
        options: options.showTypes.map(item => ({ label: item.name, value: item.value })),
      },
    },
    {
      label: () => t('merchantInfo.categoryArea'),
      prop: 'category_area',
      render: 'select',
      renderProps: {
        clearable: true,
        filterable: true,
        options: options.areas.map(item => ({ label: item.internal_name, value: item.id })),
      },
    },
    {
      label: () => t('merchantInfo.categoryType'),
      prop: 'category_type',
      render: 'select',
      renderProps: {
        clearable: true,
        filterable: true,
        options: options.categoryTypes.map(item => ({ label: item.name, value: item.id })),
      },
    },
    {
      label: () => t('crud.status'),
      prop: 'status',
      render: () => MaDictSelect,
      renderProps: {
        clearable: true,
        placeholder: '',
        dictName: 'system-status',
      },
    },
    { label: () => t('merchantInfo.jumpUrl'), prop: 'jump_url', render: 'input' },
  ]
}

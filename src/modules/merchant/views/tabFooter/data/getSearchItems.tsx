import type { MaSearchItem } from '@mineadmin/search'
import MaDictSelect from '@/components/ma-dict-picker/ma-dict-select.vue'

/** 底部Tab搜索：ID 精确、名称模糊、状态字典 */
export default function getSearchItems(t: any): MaSearchItem[] {
  return [
    { label: () => t('ID'), prop: 'id', render: 'input' },
    { label: () => t('tabFooter.name'), prop: 'name', render: 'input' },
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
  ]
}

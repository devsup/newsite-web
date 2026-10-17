import type { Ref } from 'vue'

/**
 * 表格相关的小工具.
 *
 * 只放「每个列表页都会用到、又不好塞进组件」的逻辑，避免各页面各写一份。
 */

/**
 * 清空 MaProTable 的选中状态.
 *
 * 只把页面里的 `selections` 置空是不够的：pro-table 内部缓存了上一次选中的行，
 * 刷新后会自动按缓存恢复勾选（表现为「批量操作完还勾着」），所以还要直接调用
 * el-table 实例的 clearSelection()。
 *
 * @param tableRef MaProTable 的 ref
 * @param selectionRef 页面的选中数组 ref，传入时一并置空
 */
export function clearTableSelection(tableRef: any, selectionRef?: Ref<any[]>): void {
  if (selectionRef) {
    selectionRef.value = []
  }

  const table = tableRef?.value?.getTableRef?.()?.getElTableRef?.()
  // 不同版本的 getElTableRef() 可能返回实例，也可能返回 ref，这里都兼容
  const instance = (table as any)?.value ?? table
  instance?.clearSelection?.()
}

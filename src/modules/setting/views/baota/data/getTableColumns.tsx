/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { MaProTableColumns } from '@mineadmin/pro-table'
import type { UseDialogExpose } from '@/hooks/useDialog.ts'

import { ElTag } from 'element-plus'
import { Status } from '@/constants/status.ts'

/**
 * 渲染 SSL 摘要标签。
 *
 * 剩余天数越少颜色越警示（≤15 天红、≤30 天橙），已过期单独提示；
 * 面板未部署证书时返回的 ssl 是空对象，此时显示灰色「未部署」而不是空白单元格。
 */
function renderSslTag(row: any, t: any) {
  const days = row?.ssl_endtime
  if (days === null || days === undefined || days === '') {
    return <ElTag type="info">{t('baota.sslNoCert')}</ElTag>
  }

  const numeric = Number(days)
  if (Number.isNaN(numeric) || numeric <= 0) {
    return <ElTag type="danger">{t('baota.sslExpired')}</ElTag>
  }

  const type = numeric <= 15 ? 'danger' : (numeric <= 30 ? 'warning' : 'success')
  return <ElTag type={type}>{t('baota.sslRemaining', { day: numeric })}</ElTag>
}

/**
 * 网站列表列。
 *
 * 比参考站点多展示了站点目录、PHP 版本、证书剩余天数与创建时间——
 * 这几个字段面板本来就在同一个接口里返回了，列表里不展示就只能逐个点进弹窗看。
 */
export default function getTableColumns(
  t: any,
  domainDialog: UseDialogExpose,
  sslDialog: UseDialogExpose,
): MaProTableColumns[] {
  return [
    { label: () => t('baota.siteId'), prop: 'id', width: '90px' },
    { label: () => t('baota.siteName'), prop: 'name', minWidth: '180px' },
    { label: () => t('baota.siteRemark'), prop: 'ps', minWidth: '110px' },
    { label: () => t('baota.domainCount'), prop: 'domain_count', width: '100px' },
    { label: () => t('baota.phpVersion'), prop: 'php_version', width: '110px' },
    {
      label: () => t('baota.siteStatus'),
      prop: 'status',
      width: '100px',
      cellRender: ({ row }) => (
        <div class="flex-center">
          {
            Number(row.status) === Status.ENABLED
              ? <ElTag type="success">{t('baota.running')}</ElTag>
              : <ElTag type="info">{t('baota.stopped')}</ElTag>
          }
        </div>
      ),
    },
    {
      label: () => t('baota.sslCert'),
      prop: 'ssl_endtime',
      minWidth: '150px',
      cellRender: ({ row }) => (
        <div class="flex-center">{renderSslTag(row, t)}</div>
      ),
    },
    { label: () => t('crud.createTime'), prop: 'addtime', width: '170px' },
    {
      type: 'operation',
      label: () => t('crud.operation'),
      width: '200px',
      operationConfigure: {
        type: 'tile',
        actions: [
          {
            name: 'domains',
            icon: 'material-symbols:public',
            text: () => t('baota.domains'),
            // 打开域名管理弹窗：把站点 ID 与站点名交给弹窗，弹窗内部自己去面板取域名列表
            onClick: ({ row }) => {
              domainDialog.setTitle(t('baota.domainManagerTitle', { name: row.name }))
              domainDialog.open({ siteId: row.id, webname: row.name })
            },
          },
          {
            name: 'ssl',
            icon: 'material-symbols:lock-outline',
            text: () => t('baota.sslConfig'),
            onClick: ({ row }) => {
              sslDialog.setTitle(t('baota.sslConfigTitle', { name: row.name }))
              sslDialog.open({ siteId: row.id, webname: row.name })
            },
          },
        ],
      },
    },
  ] as MaProTableColumns[]
}

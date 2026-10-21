/**
 * MineAdmin is committed to providing solutions for quickly building web applications
 * Please view the LICENSE file that was distributed with this source code,
 * For the full copyright and license information.
 * Thank you very much for using MineAdmin.
 *
 * @Author X.Mo<root@imoi.cn>
 * @Link   https://github.com/mineadmin
 */
import type { Resources } from '#/global'
import { uploadLocal } from '@/utils/uploadLocal.ts'
import { useMessage } from '@/hooks/useMessage.ts'

/**
 * 统一的资源上传处理：无论成功还是失败都给用户一个提示。
 * 之前成功只刷新列表、失败直接抛错，界面上毫无反馈，用户会误以为「不能上传」。
 */
async function handleResourceUpload(files: FileList, args: Resources.Args) {
  const msg = useMessage()
  const list = Array.from(files ?? [])
  if (list.length === 0) {
    return
  }

  let uploaded = 0
  const errors: string[] = []

  // 串行上传：后端调试环境只有 1 个 HTTP worker，并发会排队到超时；同时单个失败不影响后面的文件
  for (const file of list) {
    try {
      await uploadLocal({ file })
      ++uploaded
    }
    catch (e: any) {
      errors.push(`${file.name}：${e?.message || '上传失败'}`)
    }
  }

  if (uploaded > 0) {
    msg.success(list.length > 1 ? `成功上传 ${uploaded} 个文件` : '上传成功')
    args?.getResourceList?.()
  }

  if (errors.length > 0) {
    msg.error(errors.length === 1 ? errors[0] : `${errors.length} 个文件上传失败，如「${errors[0]}」`)
  }
}

const resourceDefaultButtons: Resources.Button[] = [
  {
    name: 'local-image-upload',
    label: '图片上传',
    icon: 'solar:upload-square-broken',
    upload: handleResourceUpload,
    uploadConfig: {
      // 只允许图片（不含 SVG：SVG 可内嵌脚本，后端也会拒绝）
      accept: '.jpg,.jpeg,.png,.gif,.webp,.bmp,.avif',
      multiple: true,
    },
    order: 0,
  },
  {
    name: 'local-file-upload',
    label: '文件上传',
    icon: 'hugeicons:file-upload',
    upload: handleResourceUpload,
    uploadConfig: {
      // 资源库只收媒体文件：视频 + 音频（文档/压缩包由后端白名单拒绝）
      accept: '.mp4,.mov,.avi,.mkv,.webm,.flv,.m4v,.3gp,.wmv,.mpeg,.mpg,.mp3,.wav,.aac,.flac,.m4a,.ogg,.wma,.opus',
      multiple: true,
    },
    order: 1,
  },
]

const useResourceStore = defineStore(
  'useResourceStore',
  () => {
    const resourceButtons = ref<Resources.Button[]>([])

    const getButton = (name: string): Resources.Button | undefined => {
      return resourceButtons.value.find(item => item.name === name)
    }

    const addButton = (button: Resources.Button): boolean => {
      if (getButton(button.name)) {
        return false
      }
      else {
        resourceButtons.value.push(button)
        return true
      }
    }

    const removeButton = (name: string) => {
      resourceButtons.value = resourceButtons.value.filter(item => item.name !== name)
    }

    const getAllButton = () => {
      return resourceButtons.value
    }

    resourceDefaultButtons.forEach(item => addButton(item))

    return {
      addButton,
      removeButton,
      getButton,
      getAllButton,
    }
  },
)

export default useResourceStore

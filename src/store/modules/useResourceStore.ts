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
function handleResourceUpload(files: FileList, args: Resources.Args) {
  const msg = useMessage()
  const options = { file: files[0] }

  uploadLocal(options)
    .then(() => {
      msg.success('上传成功')
      args?.getResourceList?.()
    })
    .catch((e: any) => {
      msg.error(e?.message || '上传失败，请重试')
    })
}

const resourceDefaultButtons: Resources.Button[] = [
  {
    name: 'local-image-upload',
    label: '图片上传',
    icon: 'solar:upload-square-broken',
    upload: handleResourceUpload,
    uploadConfig: {
      accept: 'image/*',
      limit: 1,
    },
    order: 0,
  },
  {
    name: 'local-file-upload',
    label: '文件上传',
    icon: 'hugeicons:file-upload',
    upload: handleResourceUpload,
    uploadConfig: {
      // 文档 + 压缩包 + 视频 + 音频（后端不限类型，只是选择器按这里过滤，别漏了视频）
      accept: '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.pdf,.zip,.rar,.7z,.mp4,.mov,.avi,.mkv,.webm,.flv,.m4v,.mp3,.wav,.aac,.flac,.m4a',
      limit: 1,
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

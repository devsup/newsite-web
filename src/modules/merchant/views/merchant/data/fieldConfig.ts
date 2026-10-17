/**
 * 商户表单动态字段配置。
 *
 * 只描述「字段长什么样、是否必填、占几列」，渲染由 MerchantForm 统一完成；
 * 新增展示 / 弹窗模板时改这里即可，不需要复制一大段模板代码。
 */
export type MerchantFieldType = 'input' | 'textarea' | 'number' | 'image' | 'images'

export interface MerchantFieldConfig {
  key: string
  /** i18n key，指向 merchantInfo 命名空间下的文案 */
  labelKey: string
  type: MerchantFieldType
  required?: boolean
  /** 占满两列（长文本 / 多图） */
  full?: boolean
  /** 多图数量上限 */
  limit?: number
  /** 每个文件下面带一个文本输入框（视频图片列表要给每张图配「视频链接地址」） */
  withText?: boolean
  /** 文本框占位提示的 i18n key */
  textPlaceholderKey?: string
}

/** 展示信息：show_type → 字段集合 */
export const SHOW_FIELDS: Record<number, MerchantFieldConfig[]> = {
  1: [
    { key: 'carousel_image', labelKey: 'merchantInfo.showInfo.carouselImage', type: 'image', required: true, full: true },
  ],
  2: [
    { key: 'btn_text', labelKey: 'merchantInfo.showInfo.btnText', type: 'input', required: true },
  ],
  3: [
    { key: 'product_image', labelKey: 'merchantInfo.showInfo.productImage', type: 'image', required: true },
    { key: 'product_name', labelKey: 'merchantInfo.showInfo.productName', type: 'input', required: true },
    { key: 'product_label', labelKey: 'merchantInfo.showInfo.productLabel', type: 'input', required: true },
    { key: 'product_price', labelKey: 'merchantInfo.showInfo.productPrice', type: 'number', required: true },
    { key: 'sell_number', labelKey: 'merchantInfo.showInfo.sellNumber', type: 'number', required: true },
  ],
  4: [
    { key: 'live_image', labelKey: 'merchantInfo.showInfo.liveImage', type: 'image', required: true },
    { key: 'online_number', labelKey: 'merchantInfo.showInfo.onlineNumber', type: 'input', required: true },
    { key: 'anchor_age', labelKey: 'merchantInfo.showInfo.anchorAge', type: 'input', required: true },
  ],
  5: [
    { key: 'app_icon', labelKey: 'merchantInfo.showInfo.appIcon', type: 'image', required: true },
    { key: 'app_name', labelKey: 'merchantInfo.showInfo.appName', type: 'input', required: true },
    { key: 'app_label', labelKey: 'merchantInfo.showInfo.appLabel', type: 'input', required: true },
    { key: 'app_intro', labelKey: 'merchantInfo.showInfo.appIntro', type: 'input', required: true },
    { key: 'btn_text', labelKey: 'merchantInfo.showInfo.btnText', type: 'input', required: true },
  ],
  6: [
    { key: 'app_icon', labelKey: 'merchantInfo.showInfo.appIcon', type: 'image', required: true },
    { key: 'app_name', labelKey: 'merchantInfo.showInfo.appName', type: 'input', required: true },
    { key: 'btn_text', labelKey: 'merchantInfo.showInfo.btnText', type: 'input', required: true },
  ],
  7: [
    { key: 'app_icon', labelKey: 'merchantInfo.showInfo.appIcon', type: 'image', required: true },
    { key: 'app_name', labelKey: 'merchantInfo.showInfo.appName', type: 'input', required: true },
  ],
  8: [
    { key: 'graphic_image', labelKey: 'merchantInfo.showInfo.graphicImage', type: 'image', required: true },
    { key: 'graphic_image_list', labelKey: 'merchantInfo.showInfo.graphicImageList', type: 'images', required: true, full: true, limit: 10 },
    { key: 'person_name', labelKey: 'merchantInfo.showInfo.personName', type: 'input', required: true },
    { key: 'person_age', labelKey: 'merchantInfo.showInfo.personAge', type: 'input', required: true },
    { key: 'person_label', labelKey: 'merchantInfo.showInfo.personLabel', type: 'input', required: true },
    { key: 'person_intro', labelKey: 'merchantInfo.showInfo.personIntro', type: 'textarea', full: true },
    { key: 'service_intro', labelKey: 'merchantInfo.showInfo.serviceIntro', type: 'textarea', full: true },
    { key: 'service_feedback', labelKey: 'merchantInfo.showInfo.serviceFeedback', type: 'textarea', full: true },
  ],
  9: [
    // 图文成对：每张图配一个「视频链接地址」，数据结构 { url, text }[]
    { key: 'video_image_list', labelKey: 'merchantInfo.showInfo.videoImageList', type: 'images', required: true, full: true, limit: 10, withText: true, textPlaceholderKey: 'merchantInfo.showInfo.videoUrl' },
    { key: 'person_name', labelKey: 'merchantInfo.showInfo.personName', type: 'input', required: true },
    { key: 'person_label', labelKey: 'merchantInfo.showInfo.personLabel', type: 'input', required: true },
    { key: 'person_code', labelKey: 'merchantInfo.showInfo.personCode', type: 'input', required: true },
    { key: 'btn_text', labelKey: 'merchantInfo.showInfo.btnText', type: 'input', required: true },
    { key: 'person_intro', labelKey: 'merchantInfo.showInfo.personIntro', type: 'textarea', full: true },
  ],
  10: [
    { key: 'ad_image', labelKey: 'merchantInfo.showInfo.adImage', type: 'image', required: true, full: true },
  ],
  11: [
    { key: 'ad_image', labelKey: 'merchantInfo.showInfo.adImage', type: 'image', required: true, full: true },
  ],
}

/** 弹窗信息：layer_type → 字段集合 */
export const LAYER_FIELDS: Record<number, MerchantFieldConfig[]> = {
  1: [
    { key: 'down_icon', labelKey: 'merchantInfo.popup.downIcon', type: 'image' },
  ],
  2: [
    { key: 'detail_image', labelKey: 'merchantInfo.popup.detailImage', type: 'image' },
    { key: 'down_icon', labelKey: 'merchantInfo.popup.downIcon', type: 'image' },
    { key: 'btn_text', labelKey: 'merchantInfo.popup.btnText', type: 'input' },
    { key: 'layer_remark', labelKey: 'merchantInfo.popup.layerRemark', type: 'textarea', full: true },
  ],
  3: [
    { key: 'app_icon', labelKey: 'merchantInfo.popup.appIcon', type: 'image' },
    { key: 'detail_image', labelKey: 'merchantInfo.popup.detailImage', type: 'image' },
    { key: 'down_icon', labelKey: 'merchantInfo.popup.downIcon', type: 'image' },
    { key: 'btn_text', labelKey: 'merchantInfo.popup.btnText', type: 'input' },
    { key: 'layer_remark', labelKey: 'merchantInfo.popup.layerRemark', type: 'textarea', full: true },
  ],
  4: [
    { key: 'down_icon', labelKey: 'merchantInfo.popup.downIcon', type: 'image' },
    { key: 'layer_title', labelKey: 'merchantInfo.popup.layerTitle', type: 'input' },
    { key: 'btn_text', labelKey: 'merchantInfo.popup.btnText', type: 'input' },
    { key: 'layer_remark', labelKey: 'merchantInfo.popup.layerRemark', type: 'textarea', full: true },
  ],
}

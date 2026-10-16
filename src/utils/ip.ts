/**
 * IP / CIDR 校验与解析工具（IP 白名单、IP 黑名单共用）.
 *
 * 后端才是权威校验（app/Library/Setting/IpCidrRule.php），这里只做提交前的前端提示。
 */

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/

const IPV6_REGEX = /^(?:(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:){1,7}:|(?:[0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:){1,5}(?::[0-9a-f]{1,4}){1,2}|(?:[0-9a-f]{1,4}:){1,4}(?::[0-9a-f]{1,4}){1,3}|(?:[0-9a-f]{1,4}:){1,3}(?::[0-9a-f]{1,4}){1,4}|(?:[0-9a-f]{1,4}:){1,2}(?::[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:(?::[0-9a-f]{1,4}){1,6}|:(?:(?::[0-9a-f]{1,4}){1,7}|:))$/i

export function isIpv4(value: string): boolean {
  return IPV4_REGEX.test(value)
}

export function isIpv6(value: string): boolean {
  return IPV6_REGEX.test(value)
}

export function isIp(value: string): boolean {
  return isIpv4(value) || isIpv6(value)
}

/** 支持单 IP（IPv4 / IPv6）与 CIDR 网段，如 192.168.1.5、10.0.0.0/24、::1、fe80::/10 */
export function isValidIpOrCidr(value: string): boolean {
  const input = value.trim()
  if (input === '') {
    return false
  }

  if (!input.includes('/')) {
    return isIp(input)
  }

  const [ip, prefix, ...rest] = input.split('/')
  if (rest.length > 0 || !isIp(ip) || !/^\d+$/.test(prefix)) {
    return false
  }

  const maxPrefix = ip.includes(':') ? 128 : 32
  return Number(prefix) <= maxPrefix
}

/** 把批量输入按换行 / 逗号 / 分号 / 空格拆成 IP 列表 */
export function splitIps(value: string): string[] {
  return String(value ?? '')
    .split(/[\s,，;；]+/)
    .map(item => item.trim())
    .filter(Boolean)
}

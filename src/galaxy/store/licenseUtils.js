// src/galaxy/store/licenseUtils.js

const copyleftLicenses = [
  'GPL', 'AGPL', 'LGPL', 'MPL', 'EUPL'
];

const compatibilityMatrix = {
  'MIT': ['MIT', 'APACHE-2.0', 'BSD-3-CLAUSE', 'ISC'],
  'APACHE-2.0': ['MIT', 'APACHE-2.0', 'BSD-3-CLAUSE', 'ISC'],
  'GPL-3.0': ['MIT', 'APACHE-2.0', 'BSD-3-CLAUSE', 'ISC', 'GPL-2.0', 'GPL-3.0', 'LGPL-3.0'],
  'AGPL-3.0': ['MIT', 'APACHE-2.0', 'BSD-3-CLAUSE', 'ISC', 'GPL-3.0', 'AGPL-3.0']
};

/**
 * 安全地将输入转换为大写字符串
 * 处理 null, undefined, 数组 ["MIT"] 等情况
 */
function safeUpper(val) {
    if (!val) return '';
    if (Array.isArray(val)) {
        return val.length > 0 ? String(val[0]).toUpperCase() : '';
    }
    return String(val).toUpperCase();
}

export function isCopyleft(license) {
  const upperLicense = safeUpper(license);
  if (!upperLicense) return false;
  return copyleftLicenses.some(cl => upperLicense.includes(cl));
}

export function canBeUsedBy(modelLicense, projectLicense) {
    // 使用 safeUpper 处理输入，避免 .toUpperCase() 报错
    const upperModelLicense = safeUpper(modelLicense);
    const upperProjectLicense = safeUpper(projectLicense);

    if (!upperModelLicense || !upperProjectLicense || upperModelLicense === 'N/A' || upperModelLicense === 'UNKNOWN') {
        return true; 
    }

    const allowed = compatibilityMatrix[upperProjectLicense];
    if (allowed) {
      // 检查前缀匹配
      return allowed.some(l => upperModelLicense.startsWith(l));
    }

    // 备用逻辑
    if (isCopyleft(upperProjectLicense)) {
      // 简单判断：如果项目是 Copyleft，模型也必须是 Copyleft 且包含相同的主协议名
      const baseProjectLicense = upperProjectLicense.split('-')[0];
      return isCopyleft(upperModelLicense) && upperModelLicense.includes(baseProjectLicense);
    }
    
    // 默认宽松许可证只能使用宽松许可证
    return !isCopyleft(upperModelLicense);
}

export function isLicenseCompatible(childLicense, parentLicense) {
    return canBeUsedBy(parentLicense, childLicense);
}
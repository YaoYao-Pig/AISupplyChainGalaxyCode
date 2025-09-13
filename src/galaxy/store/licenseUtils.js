// src/galaxy/store/licenseUtils.js

const copyleftLicenses = [
  'GPL', 'AGPL', 'LGPL', 'MPL', 'EUPL'
];

// 一个更清晰的兼容性矩阵。Key是项目许可证的大写形式。
// Value是一个数组，包含其可以兼容使用的模型许可证（同样为大写）。
const compatibilityMatrix = {
  'MIT': ['MIT', 'APACHE-2.0', 'BSD-3-CLAUSE', 'ISC'],
  'APACHE-2.0': ['MIT', 'APACHE-2.0', 'BSD-3-CLAUSE', 'ISC'],
  'GPL-3.0': ['MIT', 'APACHE-2.0', 'BSD-3-CLAUSE', 'ISC', 'GPL-2.0', 'GPL-3.0', 'LGPL-3.0'],
  'AGPL-3.0': ['MIT', 'APACHE-2.0', 'BSD-3-CLAUSE', 'ISC', 'GPL-3.0', 'AGPL-3.0']
};

export function isCopyleft(license) {
  if (!license) return false;
  const upperLicense = license.toUpperCase();
  return copyleftLicenses.some(cl => upperLicense.includes(cl));
}

export function canBeUsedBy(modelLicense, projectLicense) {
    if (!modelLicense || !projectLicense || modelLicense === 'N/A' || modelLicense === 'Unknown') {
        return true; 
    }

    const upperProjectLicense = projectLicense.toUpperCase();
    const upperModelLicense = modelLicense.toUpperCase();

    const allowed = compatibilityMatrix[upperProjectLicense];
    if (allowed) {
      return allowed.some(l => upperModelLicense.startsWith(l));
    }

    // 备用逻辑：如果项目许可证不在矩阵中，则采用严格的同类协议兼容规则
    if (isCopyleft(upperProjectLicense)) {
      return isCopyleft(upperModelLicense) && upperModelLicense.includes(upperProjectLicense.split('-')[0]);
    }
    
    // 默认宽松许可证只能使用宽松许可证
    return !isCopyleft(upperModelLicense);
}

export function isLicenseCompatible(childLicense, parentLicense) {
    return canBeUsedBy(parentLicense, childLicense);
}
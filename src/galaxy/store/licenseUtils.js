// src/galaxy/store/licenseUtils.js

// ------------------------------------------------------------------
// ⚠️ 核心业务逻辑：许可证兼容性判断函数 (占位符实现)
// 您需要根据真实的许可证规则来完善这里的逻辑。
// 当前的规则是：只有两个许可证完全相同时才算兼容。
// ------------------------------------------------------------------
export function isLicenseCompatible(childLicense, parentLicense) {
    if (!childLicense || !parentLicense) return true;
    if (parentLicense === 'N/A' || parentLicense === 'Unknown') return true;
  
    return childLicense === parentLicense;
  }
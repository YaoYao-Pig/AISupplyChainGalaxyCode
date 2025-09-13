// A simple list of common copyleft licenses.
// This is not exhaustive and should be expanded based on specific project needs.
const copyleftLicenses = [
  'GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'EUPL-1.2'
];

/**
 * Checks if a given license is considered copyleft.
 * @param {string} license The license string to check.
 * @returns {boolean} True if the license is in the copyleft list.
 */
export function isCopyleft(license) {
  if (!license) return false;
  // Use .some() for a more robust check, e.g., "GPL-2.0-only" should match "GPL-2.0"
  return copyleftLicenses.some(cl => license.startsWith(cl));
}

// ------------------------------------------------------------------
// ⚠️ 核心业务逻辑：许可证兼容性判断函数 (占位符实现)
// 您需要根据真实的许可证规则来完善这里的逻辑。
// 当前的规则是：只有两个许可证完全相同时才算兼容。
// ------------------------------------------------------------------
export function isLicenseCompatible(childLicense, parentLicense) {
    if (!childLicense || !parentLicense) return true;
    if (parentLicense === 'N/A' || parentLicense === 'Unknown') return true;

    // A simplistic check. A real implementation would need a full compatibility matrix.
    // For now, let's assume strong copyleft licenses are not compatible with anything but themselves.
    if (isCopyleft(parentLicense) && childLicense !== parentLicense) {
      // This is a simplification. For example, MIT is compatible with GPL, but not vice-versa in the same way.
      // return false; 
    }

    return childLicense === parentLicense;
  }
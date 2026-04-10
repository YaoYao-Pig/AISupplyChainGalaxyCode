function isMeaningfulLicense(value) {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim();
  if (!normalized) return false;

  const lower = normalized.toLowerCase();
  return lower !== 'none' && lower !== 'other' && lower !== 'unknown' && lower !== 'null' && lower !== 'undefined' && lower !== 'n/a';
}

export default function resolveNodeLicense(nodeData, compliance, fallback = 'N/A') {
  const safeNodeData = nodeData || {};
  const tags = Array.isArray(safeNodeData.tags) ? safeNodeData.tags : [];
  const licenseTag = tags.find(tag => typeof tag === 'string' && tag.startsWith('license:'));

  if (licenseTag) {
    return licenseTag.substring('license:'.length);
  }

  if (isMeaningfulLicense(safeNodeData.license_name)) {
    return String(safeNodeData.license_name).trim();
  }

  if (isMeaningfulLicense(safeNodeData.license)) {
    return String(safeNodeData.license).trim();
  }

  if (isMeaningfulLicense(safeNodeData.fixed_license)) {
    return String(safeNodeData.fixed_license).trim();
  }

  if (compliance && isMeaningfulLicense(compliance.fixed_license)) {
    return String(compliance.fixed_license).trim();
  }

  return fallback;
}

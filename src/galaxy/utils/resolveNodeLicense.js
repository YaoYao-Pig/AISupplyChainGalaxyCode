function firstValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }
  return value;
}

function normalizeLicenseValue(value) {
  const first = firstValue(value);
  if (first === null || first === undefined) return '';
  return String(first).trim();
}

function isMeaningfulLicense(value) {
  const normalized = normalizeLicenseValue(value);
  if (!normalized) return false;

  const lower = normalized.toLowerCase();
  return lower !== 'none' && lower !== 'other' && lower !== 'unknown' && lower !== 'null' && lower !== 'undefined' && lower !== 'n/a';
}

export default function resolveNodeLicense(nodeData, compliance, fallback = 'N/A') {
  const safeNodeData = nodeData || {};
  const tags = Array.isArray(safeNodeData.tags) ? safeNodeData.tags : [];
  const licenseTag = tags.find(tag => typeof tag === 'string' && tag.startsWith('license:'));
  const licenseFromTag = licenseTag ? licenseTag.substring('license:'.length).trim() : '';

  if (isMeaningfulLicense(licenseFromTag)) {
    return normalizeLicenseValue(licenseFromTag);
  }

  if (isMeaningfulLicense(safeNodeData.license_name)) {
    return normalizeLicenseValue(safeNodeData.license_name);
  }

  if (isMeaningfulLicense(safeNodeData.license)) {
    return normalizeLicenseValue(safeNodeData.license);
  }

  if (isMeaningfulLicense(safeNodeData.fixed_license)) {
    return normalizeLicenseValue(safeNodeData.fixed_license);
  }

  if (compliance && isMeaningfulLicense(compliance.fixed_license)) {
    return normalizeLicenseValue(compliance.fixed_license);
  }

  return fallback;
}

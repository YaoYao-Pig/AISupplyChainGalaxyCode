export default function resolveNodeLicense(nodeData, compliance, fallback = 'N/A') {
  const safeNodeData = nodeData || {};
  const tags = Array.isArray(safeNodeData.tags) ? safeNodeData.tags : [];
  const licenseTag = tags.find(tag => typeof tag === 'string' && tag.startsWith('license:'));

  if (licenseTag) {
    return licenseTag.substring('license:'.length);
  }

  return safeNodeData.license || safeNodeData.fixed_license || (compliance && compliance.fixed_license) || fallback;
}

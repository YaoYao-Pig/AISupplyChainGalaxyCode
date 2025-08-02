// src/galaxy/windows/LicenseReportViewModel.js
// 虽然新的窗口组件直接从store获取数据，但我们仍需一个空的ViewModel来触发窗口系统
export default function LicenseReportViewModel() {
    this.id = 'license-report'; // 唯一的窗口ID
  }
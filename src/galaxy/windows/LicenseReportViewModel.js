// src/galaxy/windows/LicenseReportViewModel.js
// 这个ViewModel很简单，主要用于触发窗口系统
export default function LicenseReportViewModel() {
  this.id = 'license-report-global'; // 使用唯一的窗口ID
  this.title = 'Global License Compliance Report';
  this.class = 'license-report-window';
}
export default LicenseTreemapViewModel;

function LicenseTreemapViewModel(data) {
  this.data = data;
  this.title = 'License Distribution';
  this.class = 'license-window';
  this.id = 'license-distribution'; // 唯一的窗口ID
}
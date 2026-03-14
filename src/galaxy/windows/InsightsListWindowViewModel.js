export default InsightsListWindowViewModel;

function InsightsListWindowViewModel(options) {
  const opts = options || {};
  this.id = opts.id || 'insight-list-window';
  this.class = 'insight-list-window';
  this.className = 'insight-list-window';
  this.title = opts.title || 'Insights';
  this.list = Array.isArray(opts.list) ? opts.list : [];
}

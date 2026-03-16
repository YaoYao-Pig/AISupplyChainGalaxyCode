// src/galaxy/utils/i18n.js

const STORAGE_KEY = 'aiscg.language';
const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = {
  en: true,
  zh: true
};
const CHINESE_REGION_CODES = {
  CN: true,
  HK: true,
  MO: true,
  TW: true
};

const translations = {
  en: {
    'language.label': 'Language',
    'language.english': 'English',
    'language.chinese': '中文',
    'language.autoHint': 'Default language is detected from IP on first visit.',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'welcome.brand': 'MODEL GALAXY / AI SUPPLY CHAIN',
    'welcome.nav.docs': 'DOCS',
    'welcome.nav.explore': 'EXPLORE',
    'welcome.nav.github': 'GITHUB',
    'welcome.title': 'AI Supply Chain Galaxy',
    'welcome.subtitle': 'An interactive galaxy system for lineage tracing, dependency analysis, and risk observation across open-source AI models. It supports graph exploration, node search, path analysis, and documentation-driven collaboration for more stable VibeCoding iterations.',
    'welcome.enterGalaxy': 'Enter Galaxy',
    'welcome.readDocs': 'Read Docs',
    'welcome.viewSource': 'View Source',
    'welcome.feature.visual.title': 'Graph Visualization',
    'welcome.feature.visual.desc': 'Explore models, dependencies, and ecosystem structure in a scalable 3D graph with pan, zoom, and precise focus controls.',
    'welcome.feature.trace.title': 'Supply Chain Traceability',
    'welcome.feature.trace.desc': 'Track inheritance paths from base models to fine-tuned branches and surface compliance or lineage risks earlier.',
    'welcome.feature.collab.title': 'Collaboration Workflow',
    'welcome.feature.collab.desc': 'Use boundary checks and the Think-Execute loop to keep feature delivery understandable, verifiable, and sustainable.',
    'welcome.overview.title': 'Project Overview',
    'welcome.overview.desc': 'Use the homepage to enter the main paths quickly: explore the graph, read docs, and inspect the repository. The docs page supports full Markdown navigation including anchors, tables, code blocks, quotes, task lists, and images.',
    'welcome.stat.navigation': 'Galaxy Navigation',
    'welcome.stat.docs': 'Full Documentation Viewer',
    'welcome.stat.workflow': 'Think-Execute Workflow',
    'welcome.footer': 'AISupplyChainGalaxyCode · Open Source Research Project',
    'galaxy.mobileSwitch': 'Switch Controls',
    'galaxy.helpToast': 'Press H for help | Backspace to go back',
    'galaxy.featureIntro.title': 'Feature Guide',
    'galaxy.featureIntro.desc': 'This round adds a focused insight workflow on top of the graph. Start from the left sidebar after the graph finishes loading.',
    'galaxy.featureIntro.item1': 'Risk Heatmap: color nodes by compliance risk intensity.',
    'galaxy.featureIntro.item2': 'Key Node Ranking: compare high-risk and high-centrality nodes in one list.',
    'galaxy.featureIntro.item3': 'Impact Scope: select a node first, then inspect its downstream blast radius.',
    'galaxy.featureIntro.dismiss': 'Dismiss',
    'leftSidebar.featureGuide.title': 'Insight Guide',
    'leftSidebar.featureGuide.desc': 'New analysis tools are grouped here for fast review and triage.',
    'leftSidebar.featureGuide.item1': 'Risk Heatmap reveals dense compliance hotspots.',
    'leftSidebar.featureGuide.item2': 'Key Node Ranking merges risk and centrality views.',
    'leftSidebar.featureGuide.item3': 'Impact Scope requires a selected node.',
    'leftSidebar.section.dataInsight': 'Data Insight',
    'leftSidebar.section.viewSwitch': 'View Switch',
    'leftSidebar.section.license': 'License',
    'leftSidebar.button.licenseStats': 'License Stats',
    'leftSidebar.button.complianceReport': 'Compliance Report',
    'leftSidebar.button.complianceStats': 'Compliance Stats',
    'leftSidebar.button.riskHeatmap': 'Risk Heatmap',
    'leftSidebar.button.disableRiskHeatmap': 'Disable Risk Heatmap',
    'leftSidebar.button.keyNodeRanking': 'Key Node Ranking',
    'leftSidebar.button.impactScope': 'Impact Scope (Selected)',
    'leftSidebar.button.taskTypeView': 'Task Type View',
    'leftSidebar.button.defaultView': 'Show Default View',
    'leftSidebar.button.highlightCore': 'Highlight Core Models',
    'leftSidebar.button.showAllModels': 'Show All Models',
    'leftSidebar.button.showCommunities': 'Show Communities',
    'leftSidebar.button.highlightConflicts': 'Highlight Conflicts ({count})',
    'leftSidebar.button.toggleTimeline': 'Toggle Timeline',
    'leftSidebar.licenseSimulator': 'License Simulator',
    'leftSidebar.licensePlaceholder': '-- Select a License --',
    'leftSidebar.button.resetView': 'Reset View',
    'leftSidebar.button.simulate': 'Simulate',
    'leftSidebar.warning.selectNode': 'Select a node first.',
    'leftSidebar.window.keyNodes': 'Key Nodes (Risk + Centrality)',
    'leftSidebar.window.impactScope': 'Impact Scope: {name} ({count} nodes)',
    'leftSidebar.window.impactScopeTruncated': 'Impact Scope: {name} ({count}+ nodes)',
    'leftSidebar.tab.guide': 'Guide',
    'leftSidebar.tab.insight': 'Insight',
    'leftSidebar.tab.view': 'Views',
    'leftSidebar.tab.license': 'License',
    'search.placeholder': 'enter a search term',
    'search.results': 'Found {count} matches',
    'search.submit': 'Search',
    'search.pathfinding': 'Compliance Connection Explorer',
    'loading.progress': '{message} - {completed}',
    'chartExplanation.title': 'Chart Interpretation',
    'chartExplanation.xAxis': '<strong>X-Axis:</strong> Model Inheritance Depth. A higher depth means more levels of derivation.',
    'chartExplanation.yAxis': '<strong>Y-Axis:</strong> The top half (<span style="color: #e74c3c">Red</span>) represents models with license conflict risks; the bottom half (<span style="color: #3498db">Blue</span>) represents risk-free models.',
    'chartExplanation.interaction': '<strong>Interaction:</strong>',
    'chartExplanation.interaction.zoom': 'Use the mouse wheel to zoom.',
    'chartExplanation.interaction.pan': 'Click and drag to pan the view.',
    'chartExplanation.interaction.details': 'Click any data point to locate the model in the 3D view.'
  },
  zh: {
    'language.label': '语言',
    'language.english': 'English',
    'language.chinese': '中文',
    'language.autoHint': '首次访问会优先根据 IP 自动判断默认语言。',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'welcome.brand': '模型星系 / AI 供应链',
    'welcome.nav.docs': '文档',
    'welcome.nav.explore': '探索',
    'welcome.nav.github': '源码',
    'welcome.title': 'AI 供应链星系',
    'welcome.subtitle': '面向开源 AI 模型的谱系追踪、依赖分析与风险观测交互系统。支持图谱漫游、节点检索、路径分析和文档化协作，帮助团队更稳定地推进 VibeCoding 迭代。',
    'welcome.enterGalaxy': '进入星系',
    'welcome.readDocs': '阅读文档',
    'welcome.viewSource': '查看源码',
    'welcome.feature.visual.title': '图谱可视化',
    'welcome.feature.visual.desc': '在可扩展的 3D 图谱里观察模型、依赖和生态结构，支持平移、缩放与精确定位。',
    'welcome.feature.trace.title': '供应链溯源',
    'welcome.feature.trace.desc': '从基础模型到微调分支追踪关键继承链，提前暴露潜在合规与谱系风险。',
    'welcome.feature.collab.title': '协作工作流',
    'welcome.feature.collab.desc': '通过模块边界检查与 Think-Execute 循环，让功能迭代更可理解、更可验证、更可持续。',
    'welcome.overview.title': '项目快览',
    'welcome.overview.desc': '主页用于快速进入核心路径：探索图谱、阅读文档、查看仓库。文档页支持完整 Markdown 浏览，包括标题锚点、表格、代码块、引用、任务列表和图片。',
    'welcome.stat.navigation': '星系导航',
    'welcome.stat.docs': '完整文档浏览',
    'welcome.stat.workflow': 'Think-Execute 工作流',
    'welcome.footer': 'AISupplyChainGalaxyCode · 开源研究项目',
    'galaxy.mobileSwitch': '切换控制方式',
    'galaxy.helpToast': '按 H 查看帮助 | Backspace 返回上一步',
    'galaxy.featureIntro.title': '功能介绍',
    'galaxy.featureIntro.desc': '这一轮在图谱左侧补充了一组聚焦分析能力。图谱加载完成后，从左侧栏即可直接使用。',
    'galaxy.featureIntro.item1': '风险热力图：按合规风险强度为节点着色。',
    'galaxy.featureIntro.item2': '关键节点排行：把高风险和高中心性节点放到同一列表里对比。',
    'galaxy.featureIntro.item3': '影响范围：先选中节点，再查看它的下游扩散范围。',
    'galaxy.featureIntro.dismiss': '知道了',
    'leftSidebar.featureGuide.title': '功能说明',
    'leftSidebar.featureGuide.desc': '新加的分析能力统一放在这里，方便快速研判与排查。',
    'leftSidebar.featureGuide.item1': '风险热力图可快速识别高风险热点。',
    'leftSidebar.featureGuide.item2': '关键节点排行融合了风险与中心性视角。',
    'leftSidebar.featureGuide.item3': '影响范围功能需要先选中一个节点。',
    'leftSidebar.section.dataInsight': '数据洞察',
    'leftSidebar.section.viewSwitch': '视图切换',
    'leftSidebar.section.license': '许可证',
    'leftSidebar.button.licenseStats': '许可证统计',
    'leftSidebar.button.complianceReport': '合规报告',
    'leftSidebar.button.complianceStats': '合规统计',
    'leftSidebar.button.riskHeatmap': '风险热力图',
    'leftSidebar.button.disableRiskHeatmap': '关闭风险热力图',
    'leftSidebar.button.keyNodeRanking': '关键节点排行',
    'leftSidebar.button.impactScope': '影响范围（选中节点）',
    'leftSidebar.button.taskTypeView': '任务类型视图',
    'leftSidebar.button.defaultView': '恢复默认视图',
    'leftSidebar.button.highlightCore': '高亮核心模型',
    'leftSidebar.button.showAllModels': '显示全部模型',
    'leftSidebar.button.showCommunities': '显示社区',
    'leftSidebar.button.highlightConflicts': '高亮冲突（{count}）',
    'leftSidebar.button.toggleTimeline': '切换时间线',
    'leftSidebar.licenseSimulator': '许可证模拟器',
    'leftSidebar.licensePlaceholder': '-- 请选择许可证 --',
    'leftSidebar.button.resetView': '重置视图',
    'leftSidebar.button.simulate': '开始模拟',
    'leftSidebar.warning.selectNode': '请先选中一个节点。',
    'leftSidebar.window.keyNodes': '关键节点（风险 + 中心性）',
    'leftSidebar.window.impactScope': '影响范围：{name}（{count} 个节点）',
    'leftSidebar.window.impactScopeTruncated': '影响范围：{name}（{count}+ 个节点）',
    'leftSidebar.tab.guide': '说明',
    'leftSidebar.tab.insight': '洞察',
    'leftSidebar.tab.view': '视图',
    'leftSidebar.tab.license': '许可',
    'search.placeholder': '输入搜索词',
    'search.results': '找到 {count} 个结果',
    'search.submit': '搜索',
    'search.pathfinding': '合规连接探索器',
    'loading.progress': '{message} - {completed}',
    'chartExplanation.title': '图表解读',
    'chartExplanation.xAxis': '<strong>横轴 (X轴):</strong> 模型继承深度。深度越高，说明其衍生的层级越多。',
    'chartExplanation.yAxis': '<strong>纵轴 (Y轴):</strong> 上半部分 (<span style="color: #e74c3c">红色</span>) 代表存在许可证冲突风险的模型，下半部分 (<span style="color: #3498db">蓝色</span>) 代表无风险的模型。',
    'chartExplanation.interaction': '<strong>交互:</strong>',
    'chartExplanation.interaction.zoom': '使用鼠标滚轮进行缩放。',
    'chartExplanation.interaction.pan': '按住并拖拽鼠标来平移。',
    'chartExplanation.interaction.details': '点击数据点可在3D视图中定位。'
  }
};

let currentLanguage = DEFAULT_LANGUAGE;
let initPromise = null;
let listeners = [];

const i18n = {
  t: t,
  getLanguage: getLanguage,
  setLanguage: setLanguage,
  init: init,
  onChange: onChange,
  offChange: offChange,
  detectLanguageByIp: detectLanguageByIp
};

module.exports = i18n;
module.exports.default = i18n;

function t(key, params) {
  const currentTranslations = translations[currentLanguage] || translations[DEFAULT_LANGUAGE];
  const fallbackTranslations = translations[DEFAULT_LANGUAGE] || {};
  const template = currentTranslations[key] || fallbackTranslations[key] || key;
  return format(template, params);
}

function format(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, function (_, token) {
    return params[token] === undefined ? '' : String(params[token]);
  });
}

function getLanguage() {
  return currentLanguage;
}

function setLanguage(language, options) {
  const nextLanguage = SUPPORTED_LANGUAGES[language] ? language : DEFAULT_LANGUAGE;
  const settings = options || {};
  const shouldPersist = settings.persist !== false;
  const shouldNotify = settings.silent !== true;
  const changed = currentLanguage !== nextLanguage;

  currentLanguage = nextLanguage;

  if (shouldPersist) {
    writeStoredLanguage(nextLanguage);
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = nextLanguage;
  }

  if (changed && shouldNotify) {
    listeners.slice().forEach(function (listener) {
      listener(nextLanguage);
    });
  }

  return nextLanguage;
}

function onChange(listener) {
  if (typeof listener !== 'function') return;
  listeners.push(listener);
}

function offChange(listener) {
  listeners = listeners.filter(function (item) {
    return item !== listener;
  });
}

function init() {
  if (initPromise) return initPromise;

  initPromise = resolveInitialLanguage()
    .then(function (language) {
      setLanguage(language, { persist: true, silent: true });
      return currentLanguage;
    })
    .catch(function () {
      setLanguage(detectLanguageByNavigator(), { persist: true, silent: true });
      return currentLanguage;
    });

  return initPromise;
}

function resolveInitialLanguage() {
  const storedLanguage = readStoredLanguage();
  if (storedLanguage) {
    return Promise.resolve(storedLanguage);
  }

  return detectLanguageByIp()
    .then(function (language) {
      return language || detectLanguageByNavigator();
    })
    .catch(function () {
      return detectLanguageByNavigator();
    });
}

function detectLanguageByNavigator() {
  if (typeof navigator === 'undefined' || !navigator.language) {
    return DEFAULT_LANGUAGE;
  }

  const language = navigator.language.split('-')[0];
  return SUPPORTED_LANGUAGES[language] ? language : DEFAULT_LANGUAGE;
}

function detectLanguageByIp() {
  if (typeof fetch !== 'function') {
    return Promise.resolve(null);
  }

  const timeout = new Promise(function (resolve) {
    setTimeout(function () {
      resolve(null);
    }, 2500);
  });

  const request = fetch('https://ipapi.co/json/')
    .then(function (response) {
      if (!response || !response.ok) return null;
      return response.json();
    })
    .then(function (payload) {
      if (!payload) return null;
      const countryCode = String(payload.country_code || payload.country || '').toUpperCase();
      if (!countryCode) return null;
      return CHINESE_REGION_CODES[countryCode] ? 'zh' : 'en';
    })
    .catch(function () {
      return null;
    });

  return Promise.race([request, timeout]);
}

function readStoredLanguage() {
  if (typeof localStorage === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES[stored] ? stored : null;
  } catch (e) {
    return null;
  }
}

function writeStoredLanguage(language) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (e) {
    // Ignore storage failures.
  }
}
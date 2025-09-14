// src/galaxy/utils/i18n.js

const translations = {
    // 英文 (默认)
    en: {
        'chartExplanation.title': 'Chart Interpretation',
        'chartExplanation.xAxis': '<strong>X-Axis:</strong> Model Inheritance Depth. A higher depth means more levels of derivation.',
        'chartExplanation.yAxis': '<strong>Y-Axis:</strong> The top half (<span style="color: #e74c3c">Red</span>) represents models with license conflict risks; the bottom half (<span style="color: #3498db">Blue</span>) represents risk-free models.',
        'chartExplanation.interaction': '<strong>Interaction:</strong>',
        'chartExplanation.interaction.zoom': 'Use the mouse wheel to zoom.',
        'chartExplanation.interaction.pan': 'Click and drag to pan the view.',
        'chartExplanation.interaction.details': 'Click any data point to locate the model in the 3D view.'
    },
    // 中文
    zh: {
        'chartExplanation.title': '图表解读',
        'chartExplanation.xAxis': '<strong>横轴 (X轴):</strong> 模型继承深度。深度越高，说明其衍生的层级越多。',
        'chartExplanation.yAxis': '<strong>纵轴 (Y轴):</strong> 上半部分 (<span style="color: #e74c3c">红色</span>) 代表存在许可证冲突风险的模型，下半部分 (<span style="color: #3498db">蓝色</span>) 代表无风险的模型。',
        'chartExplanation.interaction': '<strong>交互:</strong>',
        'chartExplanation.interaction.zoom': '使用鼠标滚轮进行缩放。',
        'chartExplanation.interaction.pan': '按住并拖拽鼠标来平移。',
        'chartExplanation.interaction.details': '点击数据点可在3D视图中定位。'
    }
};

// 检测浏览器语言，并选择合适的翻译
const lang = navigator.language.split('-')[0]; // 'en', 'zh', etc.
const currentTranslations = translations[lang] || translations.en;
const fallbackTranslations = translations.en;

function t(key) {
    return currentTranslations[key] || fallbackTranslations[key] || key;
}

module.exports = t;
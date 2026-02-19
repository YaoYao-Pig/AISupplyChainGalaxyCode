import React from 'react';
import marked from 'marked';

// 1. 定义全局 CSS 样式（针对 Markdown 内容和滚动条）
// 使用模板字符串定义，方便写多行 CSS
const globalCss = `
  /* 自定义滚动条 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #000; 
  }
  ::-webkit-scrollbar-thumb {
    background: #333; 
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555; 
  }

  /* Markdown 内容样式区域 (.markdown-body 是我们在渲染容器上加的类名) */
  .markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #c9d1d9; /* 柔和的灰白色 */
  }

  /* 标题 */
  .markdown-body h1, .markdown-body h2, .markdown-body h3 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    color: #ffffff; /* 亮白色标题 */
  }

  .markdown-body h1 {
    font-size: 2em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #21262d; /* 标题底部分割线 */
  }

  .markdown-body h2 {
    font-size: 1.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #21262d;
  }

  /* 链接 */
  .markdown-body a {
    color: #58a6ff;
    text-decoration: none;
  }
  .markdown-body a:hover {
    text-decoration: underline;
  }

  /* 段落与列表 */
  .markdown-body p {
    margin-bottom: 16px;
  }
  .markdown-body ul, .markdown-body ol {
    padding-left: 2em;
    margin-bottom: 16px;
  }
  .markdown-body li {
    margin-top: 0.25em;
  }

  /* 代码块 */
  .markdown-body code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(110, 118, 129, 0.4);
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  }
  
  .markdown-body pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #161b22; /* 代码块深色背景 */
    border-radius: 6px;
    border: 1px solid #30363d;
    margin-bottom: 16px;
  }
  .markdown-body pre code {
    background-color: transparent;
    padding: 0;
  }

  /* 引用块 */
  .markdown-body blockquote {
    padding: 0 1em;
    color: #8b949e;
    border-left: 0.25em solid #30363d;
    margin: 0 0 16px 0;
  }
  
  /* 表格 */
  .markdown-body table {
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 16px;
    width: 100%;
  }
  .markdown-body table th, .markdown-body table td {
    padding: 6px 13px;
    border: 1px solid #30363d;
  }
  .markdown-body table th {
    font-weight: 600;
    background-color: #161b22;
  }
`;

// 2. 组件内样式 (Layout)
const styles = {
  container: {
    display: 'flex',
    height: '100vh', // 全屏高度
    backgroundColor: '#0d1117', // Github Dark 背景色
    color: '#c9d1d9',
    overflow: 'hidden' // 防止双滚动条
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#010409', // 侧边栏更深一点
    borderRight: '1px solid #30363d',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0
  },
  sidebarHeader: {
    padding: '24px',
    borderBottom: '1px solid #21262d',
    marginBottom: '10px'
  },
  backLink: {
    fontSize: '12px',
    color: '#8b949e',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '8px',
    letterSpacing: '1px',
    fontWeight: 'bold'
  },
  docList: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '0 16px'
  },
  navItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#8b949e',
    marginBottom: '4px',
    transition: 'all 0.2s ease'
  },
  navItemActive: {
    backgroundColor: '#1f6feb', // 选中高亮蓝
    color: '#ffffff',
    fontWeight: '500'
  },
  mainContent: {
    flexGrow: 1,
    overflowY: 'auto', // 内容区独立滚动
    padding: '40px 60px',
    display: 'flex',
    justifyContent: 'center' // 居中显示文档
  },
  contentInner: {
    maxWidth: '900px', // 限制最大宽度，提升阅读体验
    width: '100%',
    paddingBottom: '100px'
  }
};

export default class DocsPage extends React.Component {
  constructor(props) {
    super(props);
    
    // 自动加载逻辑
    const req = require.context('./docs', false, /\.md$/);
    const docs = req.keys().map(path => ({
      title: path.replace('./', '').replace('.md', '').replace(/_/g, ' '),
      // 这里的 raw! 是双重保险，如果配置文件没生效，这里强制生效
      content: req(path) 
    })).sort((a, b) => a.title.localeCompare(b.title)); // 按文件名排序

    this.state = {
      docs: docs,
      activeIndex: 0
    };
  }

  render() {
    const { docs, activeIndex } = this.state;
    const currentDoc = docs[activeIndex];

    return (
      <div style={styles.container}>
        {/* 注入全局 CSS */}
        <style dangerouslySetInnerHTML={{__html: globalCss}} />

        {/* 左侧侧边栏 */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <a href="#/" style={styles.backLink}>← BACK TO GALAXY</a>
            <div style={{fontSize: '20px', fontWeight: '600', color: '#fff'}}>Documentation</div>
          </div>

          <div style={styles.docList}>
            {docs.map((doc, i) => {
              // 处理简单的 hover 效果（React 0.14 style 不支持 hover，这里主要靠 active 区分）
              const isActive = i === activeIndex;
              const itemStyle = Object.assign({}, styles.navItem, isActive ? styles.navItemActive : {});
              
              return (
                <div 
                  key={i} 
                  style={itemStyle}
                  onClick={() => this.setState({ activeIndex: i })}
                >
                  {doc.title}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div style={styles.mainContent}>
          <div style={styles.contentInner}>
            {currentDoc ? (
               <div 
                 className="markdown-body" // 应用上面定义的 CSS 类
                 dangerouslySetInnerHTML={{ __html: marked(currentDoc.content) }} 
               />
            ) : (
              <div style={{color: '#666', marginTop: '50px', textAlign: 'center'}}>
                No documentation found. Please add .md files to src/docs/
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
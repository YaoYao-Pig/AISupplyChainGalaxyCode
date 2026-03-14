import React from 'react';
import marked from 'marked';

function slugify(text) {
  var base = String(text || '')
    .replace(/<[^>]+>/g, '')
    .replace(/`/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base || 'section';
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
}

function parseDocParamFromHash() {
  if (typeof window === 'undefined' || !window.location || !window.location.hash) return null;

  var hash = window.location.hash;
  var qIndex = hash.indexOf('?');
  if (qIndex < 0) return null;

  var query = hash.slice(qIndex + 1);
  var parts = query.split('&');

  for (var i = 0; i < parts.length; i += 1) {
    var kv = parts[i].split('=');
    if (kv[0] === 'doc' && kv[1]) {
      return safeDecode(kv[1]);
    }
  }

  return null;
}

function createHeadingIndex(markdown) {
  var tokens = marked.lexer(markdown || '', {
    gfm: true,
    tables: true,
    breaks: true,
    smartLists: true
  });

  var list = [];
  var used = {};

  for (var i = 0; i < tokens.length; i += 1) {
    var t = tokens[i];
    if (t.type !== 'heading') continue;

    var idBase = slugify(t.text);
    var n = used[idBase] || 0;
    used[idBase] = n + 1;

    list.push({
      depth: t.depth,
      text: t.text,
      id: n === 0 ? idBase : idBase + '-' + n
    });
  }

  return list;
}

function renderMarkdown(markdown) {
  var used = {};
  var renderer = new marked.Renderer();

  renderer.heading = function(text, level, raw) {
    var idBase = slugify(raw || text);
    var n = used[idBase] || 0;
    used[idBase] = n + 1;
    var id = n === 0 ? idBase : idBase + '-' + n;

    return '<h' + level + ' id="' + id + '">' +
      '<span class="heading-anchor" aria-hidden="true">#</span>' + text +
      '</h' + level + '>';
  };

  renderer.link = function(href, title, text) {
    var safeHref = href || '#';
    var isExternal = /^https?:\/\//i.test(safeHref);
    var target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    var titleAttr = title ? ' title="' + title + '"' : '';
    return '<a href="' + safeHref + '"' + titleAttr + target + '>' + text + '</a>';
  };

  renderer.table = function(header, body) {
    return '<div class="table-wrap"><table><thead>' + header + '</thead><tbody>' + body + '</tbody></table></div>';
  };

  renderer.image = function(href, title, text) {
    var titleAttr = title ? ' title="' + title + '"' : '';
    return '<span class="md-image"><img src="' + href + '" alt="' + (text || '') + '"' + titleAttr + ' /></span>';
  };

  return marked(markdown || '', {
    gfm: true,
    tables: true,
    breaks: true,
    smartLists: true,
    smartypants: true,
    renderer: renderer
  });
}

var globalCss = `
  .docs-root {
    --bg: #0a0f1a;
    --bg-2: #111b2b;
    --line: #2a3b56;
    --text: #d6e5ff;
    --muted: #8ea7cb;
    --accent: #4b8cff;
    --accent-soft: rgba(75, 140, 255, 0.2);
    --card: rgba(13, 23, 38, 0.76);
    min-height: 100vh;
    background:
      radial-gradient(1100px 520px at 10% -8%, rgba(50, 98, 210, 0.25), transparent 58%),
      radial-gradient(900px 440px at 95% -5%, rgba(0, 164, 155, 0.16), transparent 52%),
      linear-gradient(180deg, #090d15 0%, #070a11 100%);
    color: var(--text);
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  }

  .docs-layout {
    display: flex;
    min-height: 100vh;
  }

  .docs-sidebar {
    width: 290px;
    flex-shrink: 0;
    border-right: 1px solid var(--line);
    background: rgba(7, 12, 21, 0.86);
    display: flex;
    flex-direction: column;
  }

  .docs-panel {
    width: 260px;
    flex-shrink: 0;
    border-left: 1px solid var(--line);
    background: rgba(8, 14, 24, 0.76);
    display: flex;
    flex-direction: column;
  }

  .docs-main {
    flex-grow: 1;
    min-width: 0;
    padding: 24px 26px 40px;
    overflow-y: auto;
  }

  .docs-block {
    margin: 0 auto;
    max-width: 980px;
    background: var(--card);
    border: 1px solid rgba(80, 112, 160, 0.26);
    border-radius: 12px;
    padding: 28px 34px;
  }

  .docs-top-link {
    display: inline-block;
    font-size: 12px;
    color: var(--muted);
    text-decoration: none;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }

  .docs-top-link:hover {
    color: #c8dcff;
  }

  .docs-title {
    font-size: 20px;
    font-weight: 700;
    color: #f3f8ff;
    margin-bottom: 14px;
  }

  .docs-search {
    margin: 0 14px 12px;
    border: 1px solid #324b73;
    background: #0d1726;
    color: var(--text);
    border-radius: 8px;
    padding: 10px 11px;
    font-size: 13px;
    outline: none;
  }

  .docs-search:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  .docs-list,
  .toc-list {
    overflow-y: auto;
    padding: 0 10px 16px;
  }

  .docs-item {
    padding: 9px 11px;
    border-radius: 8px;
    margin-bottom: 4px;
    cursor: pointer;
    font-size: 13px;
    color: var(--muted);
    border: 1px solid transparent;
  }

  .docs-item:hover {
    color: #d7e7ff;
    background: rgba(43, 68, 107, 0.2);
  }

  .docs-item.active {
    color: #fff;
    background: rgba(75, 140, 255, 0.22);
    border-color: rgba(85, 144, 245, 0.58);
  }

  .toc-header {
    padding: 16px 14px 10px;
    font-size: 12px;
    color: #9ab0d0;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 8px;
  }

  .toc-item {
    display: block;
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: #8ca5cb;
    font-size: 12px;
    padding: 5px 8px;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 2px;
  }

  .toc-item:hover {
    background: rgba(75, 140, 255, 0.18);
    color: #d8e9ff;
  }

  .docs-empty {
    color: #7f94b8;
    font-size: 13px;
    padding: 0 14px;
  }

  .markdown-body {
    color: #d6e5ff;
    font-size: 15px;
    line-height: 1.8;
    word-wrap: break-word;
  }

  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    color: #f5f9ff;
    line-height: 1.3;
    margin-top: 1.45em;
    margin-bottom: 0.6em;
    scroll-margin-top: 16px;
    position: relative;
  }

  .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #2d4060; padding-bottom: 0.35em; }
  .markdown-body h2 { font-size: 1.55em; border-bottom: 1px solid #2d4060; padding-bottom: 0.28em; }
  .markdown-body h3 { font-size: 1.28em; }
  .markdown-body h4 { font-size: 1.1em; }

  .markdown-body .heading-anchor {
    color: #5f85c5;
    text-decoration: none;
    margin-right: 8px;
    opacity: 0;
    font-size: 0.75em;
    vertical-align: middle;
  }

  .markdown-body h1:hover .heading-anchor,
  .markdown-body h2:hover .heading-anchor,
  .markdown-body h3:hover .heading-anchor,
  .markdown-body h4:hover .heading-anchor,
  .markdown-body h5:hover .heading-anchor,
  .markdown-body h6:hover .heading-anchor {
    opacity: 1;
  }

  .markdown-body p { margin: 0 0 1em; }

  .markdown-body a {
    color: #6fa8ff;
    text-decoration: none;
    border-bottom: 1px dashed rgba(100, 162, 255, 0.5);
  }

  .markdown-body a:hover {
    color: #9bc2ff;
    border-bottom-color: #9bc2ff;
  }

  .markdown-body ul,
  .markdown-body ol {
    padding-left: 1.65em;
    margin: 0 0 1em;
  }

  .markdown-body li { margin: 0.25em 0; }

  .markdown-body hr {
    border: 0;
    border-top: 1px solid #2d4060;
    margin: 1.6em 0;
  }

  .markdown-body blockquote {
    margin: 1em 0;
    padding: 0.1em 1em;
    border-left: 4px solid #4268a8;
    color: #aac0e0;
    background: rgba(66, 104, 168, 0.08);
    border-radius: 0 8px 8px 0;
  }

  .markdown-body code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 0.9em;
    background: rgba(95, 124, 171, 0.28);
    border: 1px solid rgba(98, 133, 186, 0.34);
    border-radius: 6px;
    padding: 0.15em 0.45em;
  }

  .markdown-body pre {
    margin: 1em 0;
    padding: 14px 16px;
    background: #0b1322;
    border: 1px solid #2f4568;
    border-radius: 10px;
    overflow-x: auto;
  }

  .markdown-body pre code {
    border: 0;
    padding: 0;
    background: transparent;
  }

  .markdown-body .table-wrap {
    overflow-x: auto;
    margin: 1.1em 0;
    border: 1px solid #2f4568;
    border-radius: 9px;
  }

  .markdown-body table {
    border-collapse: collapse;
    width: 100%;
    min-width: 560px;
  }

  .markdown-body table th,
  .markdown-body table td {
    border: 1px solid #2f4568;
    padding: 8px 11px;
  }

  .markdown-body table th {
    background: #0f1a2d;
    color: #f2f8ff;
  }

  .markdown-body input[type="checkbox"] {
    margin-right: 8px;
    transform: translateY(1px);
  }

  .markdown-body .md-image {
    display: inline-block;
    max-width: 100%;
    margin: 12px 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #2f4568;
    background: #0b1322;
  }

  .markdown-body .md-image img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  @media (max-width: 1180px) {
    .docs-panel {
      display: none;
    }
  }

  @media (max-width: 860px) {
    .docs-sidebar {
      width: 238px;
    }

    .docs-main {
      padding: 14px 12px 30px;
    }

    .docs-block {
      padding: 16px 14px 24px;
    }
  }

  @media (max-width: 700px) {
    .docs-layout {
      flex-direction: column;
    }

    .docs-sidebar {
      width: auto;
      border-right: none;
      border-bottom: 1px solid var(--line);
      max-height: 42vh;
    }

    .docs-main {
      max-height: none;
      overflow: visible;
    }
  }
`;

var layoutStyles = {
  sideHeader: {
    padding: '18px 14px 12px',
    borderBottom: '1px solid #2a3b56',
    marginBottom: '10px'
  },
  sideTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#f1f7ff',
    fontWeight: '700'
  },
  sideSubtitle: {
    margin: '6px 0 0',
    color: '#8ea7cb',
    fontSize: '12px'
  },
  docHeader: {
    marginBottom: '20px'
  },
  docName: {
    margin: 0,
    color: '#f3f9ff',
    fontSize: '26px',
    fontWeight: '700'
  },
  docHint: {
    marginTop: '8px',
    color: '#90a8cb',
    fontSize: '13px'
  }
};

export default class DocsPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleHashChange = this.handleHashChange.bind(this);
    this.handleDocSearch = this.handleDocSearch.bind(this);

    var req = require.context('./docs', true, /\.md$/);
    var docs = req.keys().map(function(filePath) {
      var normalized = filePath.replace('./', '');
      var title = normalized.replace(/\.md$/i, '').split('/').pop().replace(/_/g, ' ');
      var content = req(filePath);
      var headings = createHeadingIndex(content);

      return {
        filePath: normalized,
        title: title,
        content: content,
        headings: headings,
        id: slugify(normalized.replace(/\.md$/i, ''))
      };
    }).sort(function(a, b) {
      return a.title.localeCompare(b.title);
    });

    var initialIndex = this.resolveInitialDocIndex(docs);

    this.state = {
      docs: docs,
      activeIndex: initialIndex,
      query: ''
    };
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange);
  }

  resolveInitialDocIndex(docs) {
    if (!docs || docs.length === 0) return 0;

    var target = parseDocParamFromHash();
    if (!target) return 0;

    for (var i = 0; i < docs.length; i += 1) {
      if (docs[i].filePath === target || docs[i].id === target || docs[i].title === target) {
        return i;
      }
    }

    return 0;
  }

  handleHashChange() {
    var target = parseDocParamFromHash();
    if (!target) return;

    var docs = this.state.docs;
    for (var i = 0; i < docs.length; i += 1) {
      if (docs[i].filePath === target || docs[i].id === target || docs[i].title === target) {
        if (i !== this.state.activeIndex) {
          this.setState({ activeIndex: i });
        }
        return;
      }
    }
  }

  handleDocSearch(e) {
    this.setState({ query: e.target.value || '' });
  }

  selectDoc(index) {
    var doc = this.state.docs[index];
    if (!doc) return;

    this.setState({ activeIndex: index });
    window.location.hash = '#/docs?doc=' + encodeURIComponent(doc.filePath);

    if (typeof document !== 'undefined' && document.querySelector('.docs-main')) {
      document.querySelector('.docs-main').scrollTop = 0;
    }
  }

  scrollToHeading(id) {
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  render() {
    var docs = this.state.docs;
    var activeIndex = this.state.activeIndex;
    var query = this.state.query;

    var q = query.trim().toLowerCase();
    var filtered = docs.map(function(doc, idx) {
      return { doc: doc, idx: idx };
    }).filter(function(item) {
      if (!q) return true;
      return item.doc.title.toLowerCase().indexOf(q) >= 0 || item.doc.filePath.toLowerCase().indexOf(q) >= 0;
    });

    var currentDoc = docs[activeIndex];
    var markdownHtml = currentDoc ? renderMarkdown(currentDoc.content) : '';

    return (
      <div className="docs-root">
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />

        <div className="docs-layout">
          <aside className="docs-sidebar">
            <div style={layoutStyles.sideHeader}>
              <a href="#/" className="docs-top-link">← BACK TO HOME</a>
              <h1 style={layoutStyles.sideTitle}>Documentation</h1>
              <p style={layoutStyles.sideSubtitle}>Markdown Browser</p>
            </div>

            <input
              className="docs-search"
              value={query}
              onChange={this.handleDocSearch}
              placeholder="搜索文档标题或路径"
            />

            <div className="docs-list">
              {filtered.length === 0 ? (
                <div className="docs-empty">没有匹配文档</div>
              ) : (
                filtered.map(function(item) {
                  var isActive = item.idx === activeIndex;
                  var cls = 'docs-item' + (isActive ? ' active' : '');

                  return (
                    <div
                      key={item.doc.filePath}
                      className={cls}
                      onClick={this.selectDoc.bind(this, item.idx)}
                      title={item.doc.filePath}
                    >
                      {item.doc.title}
                    </div>
                  );
                }, this)
              )}
            </div>
          </aside>

          <main className="docs-main">
            {currentDoc ? (
              <article className="docs-block">
                <header style={layoutStyles.docHeader}>
                  <h2 style={layoutStyles.docName}>{currentDoc.title}</h2>
                  <div style={layoutStyles.docHint}>{currentDoc.filePath}</div>
                </header>

                <div
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: markdownHtml }}
                />
              </article>
            ) : (
              <div className="docs-block">
                <div className="docs-empty">No documentation found. Add markdown files under src/docs/</div>
              </div>
            )}
          </main>

          <aside className="docs-panel">
            <div className="toc-header">On This Page</div>
            <div className="toc-list">
              {!currentDoc || !currentDoc.headings || currentDoc.headings.length === 0 ? (
                <div className="docs-empty">当前文档没有标题目录</div>
              ) : (
                currentDoc.headings.map(function(h, i) {
                  var pad = 8 + (Math.max(0, h.depth - 1) * 12);
                  return (
                    <button
                      key={h.id + '-' + i}
                      className="toc-item"
                      style={{ paddingLeft: pad + 'px' }}
                      onClick={this.scrollToHeading.bind(this, h.id)}
                      title={h.text}
                    >
                      {h.text}
                    </button>
                  );
                }, this)
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }
}


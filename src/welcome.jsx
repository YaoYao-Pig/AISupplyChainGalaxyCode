import React from 'react';

const globalCss = `
  .home-page {
    background:
      radial-gradient(1200px 500px at 20% -10%, rgba(35, 98, 255, 0.28), transparent 60%),
      radial-gradient(900px 460px at 85% 0%, rgba(0, 176, 155, 0.20), transparent 55%),
      linear-gradient(180deg, #070b14 0%, #05070d 45%, #04060a 100%);
  }

  .home-card {
    background: rgba(11, 18, 30, 0.72);
    border: 1px solid rgba(96, 129, 182, 0.28);
    border-radius: 12px;
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.28);
  }

  .home-nav-link:hover {
    color: #cfe0ff !important;
  }

  .home-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(48, 127, 255, 0.35);
  }

  .home-feature:hover {
    border-color: rgba(122, 172, 255, 0.52);
    transform: translateY(-2px);
  }

  @media (max-width: 991px) {
    .home-hero-title {
      font-size: 40px !important;
      line-height: 1.15 !important;
    }

    .home-hero-sub {
      font-size: 17px !important;
    }

    .home-stat-grid > div {
      margin-bottom: 12px;
    }
  }

  @media (max-width: 767px) {
    .home-topbar {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 10px;
      padding: 18px 16px !important;
    }

    .home-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }

    .home-main {
      padding: 24px 16px 40px !important;
    }

    .home-hero-title {
      font-size: 32px !important;
    }
  }
`;

const styles = {
  page: {
    minHeight: '100vh',
    color: '#dbe8ff',
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '22px 36px',
    borderBottom: '1px solid rgba(98, 120, 152, 0.28)',
    backdropFilter: 'blur(4px)'
  },
  brand: {
    color: '#f2f7ff',
    fontSize: '16px',
    letterSpacing: '1.2px',
    fontWeight: '700'
  },
  navWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  navLink: {
    color: '#8fa6cc',
    textDecoration: 'none',
    fontSize: '13px',
    letterSpacing: '0.8px'
  },
  main: {
    padding: '46px 36px 54px',
    maxWidth: '1220px',
    margin: '0 auto'
  },
  hero: {
    padding: '34px 28px',
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    color: '#f7fbff',
    fontSize: '54px',
    lineHeight: '1.1',
    letterSpacing: '0.5px'
  },
  subtitle: {
    marginTop: '18px',
    maxWidth: '860px',
    color: '#afc2e4',
    fontSize: '19px',
    lineHeight: '1.65'
  },
  actions: {
    marginTop: '26px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    display: 'inline-block',
    textDecoration: 'none',
    color: '#fff',
    backgroundColor: '#2e7dff',
    border: '1px solid #2e7dff',
    borderRadius: '8px',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    transition: 'all 0.18s ease'
  },
  ghostBtn: {
    display: 'inline-block',
    textDecoration: 'none',
    color: '#c8d8f5',
    backgroundColor: 'rgba(9, 16, 28, 0.7)',
    border: '1px solid rgba(110, 139, 190, 0.35)',
    borderRadius: '8px',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    transition: 'all 0.18s ease'
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '14px',
    color: '#e6f0ff',
    fontSize: '21px',
    fontWeight: '700'
  },
  featureCard: {
    height: '100%',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid rgba(95, 124, 169, 0.34)',
    backgroundColor: 'rgba(7, 13, 24, 0.78)',
    transition: 'all 0.18s ease'
  },
  featureTitle: {
    marginTop: 0,
    marginBottom: '10px',
    color: '#f3f8ff',
    fontSize: '19px'
  },
  featureDesc: {
    margin: 0,
    color: '#9db2d3',
    lineHeight: '1.75',
    fontSize: '14px'
  },
  panel: {
    marginTop: '22px',
    padding: '22px',
    borderRadius: '12px',
    border: '1px solid rgba(98, 127, 171, 0.3)',
    backgroundColor: 'rgba(8, 13, 22, 0.78)'
  },
  statWrap: {
    marginTop: '14px'
  },
  statCard: {
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid rgba(105, 135, 182, 0.34)',
    backgroundColor: 'rgba(10, 17, 30, 0.9)'
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#eaf2ff',
    marginBottom: '6px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#95aed3'
  },
  footer: {
    textAlign: 'center',
    padding: '18px 12px 24px',
    color: '#6d87ac',
    fontSize: '12px'
  }
};

export default class WelcomePage extends React.Component {
  render() {
    return (
      <div className="home-page" style={styles.page}>
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />

        <div className="home-topbar" style={styles.topbar}>
          <div style={styles.brand}>MODEL GALAXY / AI SUPPLY CHAIN</div>
          <div style={styles.navWrap}>
            <a className="home-nav-link" href="#/docs" style={styles.navLink}>DOCS</a>
            <a className="home-nav-link" href="#/galaxy/my_model_galaxy?cx=0&cy=0&cz=0&l=1" style={styles.navLink}>EXPLORE</a>
            <a className="home-nav-link" href="https://github.com/YaoYao-Pig/AISupplyChainGalaxyCode" target="_blank" rel="noopener noreferrer" style={styles.navLink}>GITHUB</a>
          </div>
        </div>

        <div className="home-main" style={styles.main}>
          <div className="home-card" style={styles.hero}>
            <h1 className="home-hero-title" style={styles.title}>AI Supply Chain Galaxy</h1>
            <p className="home-hero-sub" style={styles.subtitle}>
              对开源 AI 模型进行谱系追踪、依赖分析和风险观测的交互式星系系统。
              支持图谱漫游、节点检索、路径分析和文档化协作，帮助团队更稳定地进行 VibeCoding 迭代。
            </p>

            <div className="home-actions" style={styles.actions}>
              <a className="home-btn" href="#/galaxy/my_model_galaxy?cx=0&cy=0&cz=0&l=1" style={styles.primaryBtn}>进入星系</a>
              <a className="home-btn" href="#/docs" style={styles.ghostBtn}>阅读文档</a>
              <a className="home-btn" href="https://github.com/YaoYao-Pig/AISupplyChainGalaxyCode" target="_blank" rel="noopener noreferrer" style={styles.ghostBtn}>查看源码</a>
            </div>
          </div>

          <div className="row" style={{ marginTop: '4px' }}>
            <div className="col-md-4" style={{ marginBottom: '14px' }}>
              <div className="home-feature" style={styles.featureCard}>
                <h3 style={styles.featureTitle}>图谱可视化</h3>
                <p style={styles.featureDesc}>
                  多层次呈现模型、依赖和生态关系，支持大图场景的平移、缩放与定位。
                </p>
              </div>
            </div>

            <div className="col-md-4" style={{ marginBottom: '14px' }}>
              <div className="home-feature" style={styles.featureCard}>
                <h3 style={styles.featureTitle}>供应链溯源</h3>
                <p style={styles.featureDesc}>
                  从基础模型到微调分支，追踪关键链路并辅助定位潜在合规与继承风险。
                </p>
              </div>
            </div>

            <div className="col-md-4" style={{ marginBottom: '14px' }}>
              <div className="home-feature" style={styles.featureCard}>
                <h3 style={styles.featureTitle}>协作开发</h3>
                <p style={styles.featureDesc}>
                  通过模块边界检查与 Think-Execute 循环，使功能迭代更可控、更可验证。
                </p>
              </div>
            </div>
          </div>

          <div className="home-card" style={styles.panel}>
            <h2 style={styles.sectionTitle}>项目快览</h2>
            <p style={styles.featureDesc}>
              主页用于快速进入业务路径：探索图谱、阅读文档、回到源码。文档页支持完整 Markdown 浏览，
              含标题锚点、目录导航、表格、代码块、引用、任务列表和图片展示。
            </p>

            <div className="row home-stat-grid" style={styles.statWrap}>
              <div className="col-sm-4">
                <div style={styles.statCard}>
                  <div style={styles.statValue}>3D</div>
                  <div style={styles.statLabel}>Galaxy Navigation</div>
                </div>
              </div>
              <div className="col-sm-4">
                <div style={styles.statCard}>
                  <div style={styles.statValue}>MD</div>
                  <div style={styles.statLabel}>Full Documentation Viewer</div>
                </div>
              </div>
              <div className="col-sm-4">
                <div style={styles.statCard}>
                  <div style={styles.statValue}>TE</div>
                  <div style={styles.statLabel}>Think-Execute Workflow</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          AISupplyChainGalaxyCode · Open Source Research Project
        </div>
      </div>
    );
  }
}

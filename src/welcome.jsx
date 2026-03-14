import React from 'react';
import LanguageSwitcher from './galaxy/LanguageSwitcher.jsx';
import i18n from './galaxy/utils/i18n.js';

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
  },
  languageHint: {
    marginTop: '10px',
    color: '#7f96bb',
    fontSize: '12px'
  }
};

export default class WelcomePage extends React.Component {
  constructor(props) {
    super(props);
    this.handleLanguageChange = this.handleLanguageChange.bind(this);
  }

  componentDidMount() {
    i18n.onChange(this.handleLanguageChange);
  }

  componentWillUnmount() {
    i18n.offChange(this.handleLanguageChange);
  }

  handleLanguageChange() {
    this.forceUpdate();
  }

  render() {
    return (
      <div className='home-page' style={styles.page}>
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />

        <div className='home-topbar' style={styles.topbar}>
          <div style={styles.brand}>{i18n.t('welcome.brand')}</div>
          <div style={styles.navWrap}>
            <LanguageSwitcher />
            <a className='home-nav-link' href='#/docs' style={styles.navLink}>{i18n.t('welcome.nav.docs')}</a>
            <a className='home-nav-link' href='#/galaxy/my_model_galaxy?cx=0&cy=0&cz=0&l=1' style={styles.navLink}>{i18n.t('welcome.nav.explore')}</a>
            <a className='home-nav-link' href='https://github.com/YaoYao-Pig/AISupplyChainGalaxyCode' target='_blank' rel='noopener noreferrer' style={styles.navLink}>{i18n.t('welcome.nav.github')}</a>
          </div>
        </div>

        <div className='home-main' style={styles.main}>
          <div className='home-card' style={styles.hero}>
            <h1 className='home-hero-title' style={styles.title}>{i18n.t('welcome.title')}</h1>
            <p className='home-hero-sub' style={styles.subtitle}>{i18n.t('welcome.subtitle')}</p>

            <div className='home-actions' style={styles.actions}>
              <a className='home-btn' href='#/galaxy/my_model_galaxy?cx=0&cy=0&cz=0&l=1' style={styles.primaryBtn}>{i18n.t('welcome.enterGalaxy')}</a>
              <a className='home-btn' href='#/docs' style={styles.ghostBtn}>{i18n.t('welcome.readDocs')}</a>
              <a className='home-btn' href='https://github.com/YaoYao-Pig/AISupplyChainGalaxyCode' target='_blank' rel='noopener noreferrer' style={styles.ghostBtn}>{i18n.t('welcome.viewSource')}</a>
            </div>

            <div style={styles.languageHint}>{i18n.t('language.autoHint')}</div>
          </div>

          <div className='row' style={{ marginTop: '4px' }}>
            <div className='col-md-4' style={{ marginBottom: '14px' }}>
              <div className='home-feature' style={styles.featureCard}>
                <h3 style={styles.featureTitle}>{i18n.t('welcome.feature.visual.title')}</h3>
                <p style={styles.featureDesc}>{i18n.t('welcome.feature.visual.desc')}</p>
              </div>
            </div>

            <div className='col-md-4' style={{ marginBottom: '14px' }}>
              <div className='home-feature' style={styles.featureCard}>
                <h3 style={styles.featureTitle}>{i18n.t('welcome.feature.trace.title')}</h3>
                <p style={styles.featureDesc}>{i18n.t('welcome.feature.trace.desc')}</p>
              </div>
            </div>

            <div className='col-md-4' style={{ marginBottom: '14px' }}>
              <div className='home-feature' style={styles.featureCard}>
                <h3 style={styles.featureTitle}>{i18n.t('welcome.feature.collab.title')}</h3>
                <p style={styles.featureDesc}>{i18n.t('welcome.feature.collab.desc')}</p>
              </div>
            </div>
          </div>

          <div className='home-card' style={styles.panel}>
            <h2 style={styles.sectionTitle}>{i18n.t('welcome.overview.title')}</h2>
            <p style={styles.featureDesc}>{i18n.t('welcome.overview.desc')}</p>

            <div className='row home-stat-grid' style={styles.statWrap}>
              <div className='col-sm-4'>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>3D</div>
                  <div style={styles.statLabel}>{i18n.t('welcome.stat.navigation')}</div>
                </div>
              </div>
              <div className='col-sm-4'>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>MD</div>
                  <div style={styles.statLabel}>{i18n.t('welcome.stat.docs')}</div>
                </div>
              </div>
              <div className='col-sm-4'>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>TE</div>
                  <div style={styles.statLabel}>{i18n.t('welcome.stat.workflow')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.footer}>{i18n.t('welcome.footer')}</div>
      </div>
    );
  }
}
import React from "react";

export default class WelcomePage extends React.Component {
  render() {
    // 纯黑极简风格样式定义
    const styles = {
      pageContainer: {
        backgroundColor: '#000000',
        minHeight: '100vh',
        color: '#e0e0e0',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden'
      },
      // 顶部导航
      topNav: {
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'flex-end',
        fontSize: '14px',
        borderBottom: '1px solid #222'
      },
      navLink: {
        color: '#888',
        textDecoration: 'none',
        marginLeft: '30px',
        transition: 'color 0.3s'
      },
      // 核心区域
      heroSection: {
        textAlign: 'center',
        padding: '80px 20px 60px',
      },
      mainTitle: {
        fontSize: '48px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '20px',
        letterSpacing: '2px'
      },
      subTitle: {
        fontSize: '20px',
        color: '#666',
        fontWeight: '300',
        marginBottom: '50px'
      },
      // 按钮样式
      enterButton: {
        display: 'inline-block',
        padding: '15px 50px',
        fontSize: '18px',
        color: '#000',
        backgroundColor: '#fff',
        border: '1px solid #fff',
        borderRadius: '2px', // 稍微硬朗一点的圆角
        textDecoration: 'none',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        marginTop: '20px'
      },
      // 分栏区域
      featuresSection: {
        padding: '60px 0',
        backgroundColor: '#050505', // 比背景稍亮一点区分区块
        borderTop: '1px solid #1a1a1a',
        borderBottom: '1px solid #1a1a1a',
        flexGrow: 1
      },
      featureCol: {
        textAlign: 'left',
        padding: '20px'
      },
      featureIcon: {
        fontSize: '24px',
        marginBottom: '15px',
        color: '#fff',
        border: '1px solid #333',
        display: 'inline-block',
        width: '50px',
        height: '50px',
        lineHeight: '50px',
        textAlign: 'center',
        borderRadius: '50%'
      },
      featureTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '15px'
      },
      featureDesc: {
        fontSize: '15px',
        lineHeight: '1.8',
        color: '#888'
      },
      footer: {
        textAlign: 'center',
        padding: '30px',
        fontSize: '12px',
        color: '#444'
      }
    };

    return (
      <div style={styles.pageContainer}>
        {/* Top Navigation */}
        <div style={styles.topNav}>
          <a href="#/docs" style={styles.navLink}>DOCUMENTATION</a> {/* 新增入口 */}
          <a href="https://github.com/YaoYao-Pig/AISupplyChainGalaxyCode" target="_blank" style={styles.navLink}>GITHUB</a>
          <a href="https://github.com/YaoYao-Pig" style={styles.navLink}>CONTACT</a>
        </div>

        {/* Hero Title Area */}
        <div style={styles.heroSection}>
          <h1 style={styles.mainTitle}> Model Galaxy </h1>
          <p style={styles.subTitle}>Mapping the Genealogy and Dependencies of Artificial Intelligence</p>
          
          <a href='#/galaxy/my_model_galaxy?cx=0&cy=0&cz=0&l=1' style={styles.enterButton}>
            ENTER GALAXY
          </a>
        </div>

        {/* 3-Column Feature Introduction */}
        <div style={styles.featuresSection}>
          <div className='container'>
            <div className='row'>
              
              {/* Column 1: Visualization */}
              <div className='col-md-4' style={styles.featureCol}>
                <div style={styles.featureIcon}>✦</div>
                <h3 style={styles.featureTitle}>Global Visualization</h3>
                <p style={styles.featureDesc}>
                  Provides a 3D interactive map of the AI ecosystem. 
                  Every node represents a model, visualizing the complex structure of the open-source community like a universe of stars.
                  <br/><br/>
                  <strong>全景可视化：</strong> 将 AI 开源社区构建为三维星系，直观展示海量模型的分布与聚类。
                </p>
              </div>

              {/* Column 2: Supply Chain */}
              <div className='col-md-4' style={styles.featureCol}>
                <div style={styles.featureIcon}>☍</div>
                <h3 style={styles.featureTitle}>Supply Chain Traceability</h3>
                <p style={styles.featureDesc}>
                  Tracks the lineage of models (Base Model -> Fine-tuned Model). 
                  Understand where a model comes from, its dependencies, and potential license risks in the supply chain.
                  <br/><br/>
                  <strong>供应链溯源：</strong> 深度解析模型间的“父子”微调关系，追踪模型血缘，识别供应链上下游依赖。
                </p>
              </div>

              {/* Column 3: Data Driven */}
              <div className='col-md-4' style={styles.featureCol}>
                <div style={styles.featureIcon}>💾</div>
                <h3 style={styles.featureTitle}>Data Driven</h3>
                <p style={styles.featureDesc}>
                  Powered by real-time data from Hugging Face and other open platforms. 
                  We analyze metadata to construct an accurate graph of the evolving AI landscape.
                  <br/><br/>
                  <strong>数据驱动：</strong> 基于 Hugging Face 等平台的实时数据，通过算法构建动态更新的模型演化图谱。
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          &copy; Model Galaxy Project. Open Source & Non-Profit.
        </div>
      </div>
    );
  }
}
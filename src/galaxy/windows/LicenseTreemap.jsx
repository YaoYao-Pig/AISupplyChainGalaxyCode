// src/galaxy/windows/LicenseTreemap.jsx

import React from 'react';
import { treemap, hierarchy } from 'd3-hierarchy';
import { scaleOrdinal, schemeCategory10 } from 'd3-scale';

const maco = require('maco');

module.exports = maco((x) => {
  x.render = function() {
    const { viewModel } = x.props;
    const data = viewModel.data;

    if (!data || !data.children || data.children.length === 0) {
      return <div className="loading-message">Analyzing license data...</div>;
    }

    const width = 480; // 窗口宽度
    const height = 320; // 窗口高度

    // 1. 创建层级数据
    const root = hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    
    // 2. 创建 treemap 布局
    const treemapLayout = treemap()
        .size([width, height])
        .padding(2);

    // 3. 计算布局
    treemapLayout(root);

    // 4. 创建颜色比例尺
    const colorScale = scaleOrdinal(schemeCategory10);

    return (
      <div className="license-treemap-container">
        <svg width={width} height={height}>
          {root.leaves().map((leaf, i) => {
            const leafWidth = leaf.x1 - leaf.x0;
            const leafHeight = leaf.y1 - leaf.y0;

            return (
              <g key={i} transform={`translate(${leaf.x0}, ${leaf.y0})`} className="treemap-leaf">
                <rect
                  width={leafWidth}
                  height={leafHeight}
                  fill={colorScale(leaf.data.name)}
                  stroke="#1a1a1a"
                />
                {/* 只在矩形足够大时显示文字 */}
                {leafWidth > 50 && leafHeight > 25 && (
                  <text
                    x={leafWidth / 2}
                    y={leafHeight / 2}
                    dy=".35em"
                    textAnchor="middle"
                    fill="white"
                    className="treemap-label"
                  >
                    <tspan>{leaf.data.name}</tspan>
                    <tspan x={leafWidth / 2} dy="1.2em" className="treemap-value">
                        {leaf.data.value}
                    </tspan>
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
}, React);

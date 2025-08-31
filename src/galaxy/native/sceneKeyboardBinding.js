// src/galaxy/native/sceneKeyboardBinding.js

import events from '../service/appEvents.js';
import Key from '../utils/key.js';
import detailModel from '../nodeDetails/nodeDetailsStore.js'; // <--- 新增: 导入节点详情状态管理器

function sceneKeyboardBinding(container) {
  var api = {
    destroy: destroy
  };
  var lastShiftKey = false;

  container.addEventListener('keydown', keydown, false);
  container.addEventListener('keyup', keyup, false);
  return api;

  function destroy() {
    container.removeEventListener('keydown', keydown, false);
    container.removeEventListener('keyup', keyup, false);
  }

  function keydown(e) {
    if (e.which === Key.Space) {
      events.toggleSteering.fire();
    } else if (e.which === Key.L) { // L - toggle links
      if (!e.ctrlKey && !e.metaKey) {
        events.toggleLinks.fire();
      }
    } else if (e.which === Key.H || (e.which === Key['/'] && e.shiftKey)) {
      e.stopPropagation();
      events.toggleHelp.fire();
    } else if (e.which === Key.G) { // <--- 新增: 处理 Q 键按下事件
        // 注意：'Q' 键在默认控制中可能用于“向右翻滚”。此处的逻辑会覆盖它。
        const selectedNode = detailModel.getSelectedNode();
        if (selectedNode) {
            // 将来，您可以从 selectedNode.originalProperties.url 或类似字段获取网址
            // let url = selectedNode.originalProperties?.url; // 示例
            let url = null; // 假设现在还没有这个字段

            if (!url) {
                // 如果节点数据中没有网址，使用一个默认的搜索网址
                // 这里用谷歌搜索节点名称作为示例
                url = 'https://huggingface.co/' + selectedNode.name;
            }

            console.log(`Navigating to: ${url}`);
            window.open(url, '_blank'); // 在新标签页中打开网址

            // 阻止默认行为（例如，如果Q键还绑定了其他移动操作）
            e.preventDefault();
            e.stopPropagation();
        }
    }
    else if (e.which === Key.T) { // <-- 在这里添加新的代码块
      events.toggleClusterLabels.fire();
    }

    if (e.shiftKey && !lastShiftKey) {
      lastShiftKey = true;
      events.accelerateNavigation.fire(true);
    }
  }

  function keyup(e) {
    if (lastShiftKey && !e.shiftKey) {
      lastShiftKey = false;
      events.accelerateNavigation.fire(false);
    }
  }
}

export default sceneKeyboardBinding;
import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from './sceneStore.js';

function createTimelineStore() {
    let debounceTimer = null; // 用于存放我们的计时器
    const DEBOUNCE_DELAY = 100; // 100毫秒的延迟

    let state = {
        enabled: false,
        minDate: '',
        maxDate: '',
        currentDate: '',
        allDates: [],
        totalSteps: 0,
        currentIndex: 0
    };

    appEvents.graphDownloaded.on(initialize);

    const api = {
        getState: () => state,
        setCurrentIndex: (index) => {
            if (index === state.currentIndex) return;
            
            // 步骤1: 立即更新UI状态，让滑块本身可以平滑移动
            state.currentIndex = index;
            state.currentDate = formatDate(state.allDates[index]);
            api.fire('changed'); // 通知React组件重绘滑块和日期

            // 步骤2: 使用防抖来触发昂贵的3D场景重绘
            clearTimeout(debounceTimer); // 清除上一个还没来得及执行的计时器
            debounceTimer = setTimeout(() => {
                // 只有当用户停止滑动100毫秒后，这个事件才会被触发
                appEvents.timelineChanged.fire(state.allDates[index]); 
            }, DEBOUNCE_DELAY);
        }
    };
    eventify(api);

    function initialize() {
        const graph = scene.getGraph();
        if (!graph) return;

        const nodeData = graph.getRawData().nodeData;
        const dates = nodeData
            .map(node => node && node.createdAt ? new Date(node.createdAt) : null)
            .filter(date => date && !isNaN(date.getTime()))
            .sort((a, b) => a - b);
        
        if (dates.length < 2) {
            state.enabled = false;
        } else {
            state.enabled = true;
            state.allDates = dates;
            state.minDate = formatDate(dates[0]);
            state.maxDate = formatDate(dates[dates.length - 1]);
            state.totalSteps = dates.length;
            state.currentIndex = dates.length - 1; 
            state.currentDate = state.maxDate;
        }
        api.fire('changed');
    }
    
    function formatDate(date) {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    }

    return api;
}

const timelineStore = createTimelineStore();
export default timelineStore;
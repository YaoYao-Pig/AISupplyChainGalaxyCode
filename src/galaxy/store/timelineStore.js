import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from './sceneStore.js';

function createTimelineStore() {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 100;
    let playInterval = null;

    let state = {
        enabled: false, // <-- 默认关闭
        isPlaying: false, 
        minDate: '',
        maxDate: '',
        currentDate: '',
        allDates: [],
        totalSteps: 0,
        currentIndex: 0
    };

    appEvents.graphDownloaded.on(initialize);
    // --- 新增监听器 ---
    appEvents.toggleTimeline.on(toggleTimeline);
    appEvents.selectNode.on(hideTimeline);
    appEvents.togglePlay.on(togglePlay);

    const api = {
        getState: () => state,
        setCurrentIndex: (index) => {
            if (index === state.currentIndex) return;
            
            state.currentIndex = index;
            state.currentDate = formatDate(state.allDates[index]);
            api.fire('changed'); 

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                appEvents.timelineChanged.fire(state.allDates[index]); 
            }, DEBOUNCE_DELAY);
        }
    };
    eventify(api);

    function play() {
        if (playInterval) return;
        state.isPlaying = true;
        
        playInterval = setInterval(() => {
            const currentDate = state.allDates[state.currentIndex];
            if (!currentDate) return;

            // 计算一个月后的日期
            const targetDate = new Date(currentDate);
            targetDate.setMonth(targetDate.getMonth() + 1);

            // 找到第一个大于或等于目标日期的索引
            let nextIndex = state.allDates.findIndex((date, index) => {
                return index > state.currentIndex && date >= targetDate;
            });
            
            // 如果找不到（说明已经接近末尾），就直接跳到最后
            if (nextIndex === -1) {
                nextIndex = state.totalSteps - 1;
            }

            api.setCurrentIndex(nextIndex);
        }, 2000); // 每2000ms (2秒) 更新一次

        api.fire('changed');
    }

    function pause() {
        clearInterval(playInterval);
        playInterval = null;
        state.isPlaying = false;
        api.fire('changed');
    }
    
    function togglePlay() {
        if (state.isPlaying) {
            pause();
        } else {
            // 如果已经播放到最后，则从头开始
            if (state.currentIndex >= state.totalSteps - 1) {
                api.setCurrentIndex(0);
            }
            play();
        }
    }

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
            // enabled 保持为 false，但数据先准备好
            state.allDates = dates;
            state.minDate = formatDate(dates[0]);
            state.maxDate = formatDate(dates[dates.length - 1]);
            state.totalSteps = dates.length;
            state.currentIndex = dates.length - 1; 
            state.currentDate = state.maxDate;
        }
        api.fire('changed');
    }
    
    // --- 新增函数 ---
    function toggleTimeline() {
        state.enabled = !state.enabled;
        
        // 如果是关闭时间线，则重置视图到显示所有节点的状态
        if (!state.enabled) {
            appEvents.timelineChanged.fire(null); // 传递 null 来重置
        } else {
            // 如果是打开，则根据当前滑块位置更新视图
            appEvents.timelineChanged.fire(state.allDates[state.currentIndex]);
        }
        
        api.fire('changed');
    }

    // --- 新增函数 ---
    function hideTimeline() {
        if (state.enabled) {
            state.enabled = false;
            // 同样，关闭时重置视图
            appEvents.timelineChanged.fire(null);
            api.fire('changed');
        }
    }
    
    function formatDate(date) {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    }

    return api;
}

const timelineStore = createTimelineStore();
export default timelineStore;
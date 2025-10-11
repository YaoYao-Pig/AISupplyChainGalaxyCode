import React from 'react';
import appEvents from './service/appEvents.js';
import timelineStore from './store/timelineStore.js';

module.exports = require('maco')((x) => {
    x.state = timelineStore.getState();

    x.componentDidMount = function() {
        timelineStore.on('changed', updateState);
    };

    x.componentWillUnmount = function() {
        timelineStore.off('changed', updateState);
    };

    const updateState = () => {
        x.setState(timelineStore.getState());
    };

    const handleSliderChange = (e) => {
        const newIndex = parseInt(e.target.value, 10);
        timelineStore.setCurrentIndex(newIndex);
    };
    const handlePlayPauseClick = () => {
        appEvents.togglePlay.fire();
    };
    x.render = function() {
        const { minDate, maxDate, currentDate, totalSteps, currentIndex, enabled, isPlaying  } = x.state;
        if (!enabled) return null;

        const playPauseIcon = isPlaying ? '❚❚' : '▶';
        const playPauseTitle = isPlaying ? 'Pause' : 'Play';

        return (
            <div className="timeline-container">
                                <button 
                    onClick={handlePlayPauseClick} 
                    className="play-pause-btn"
                    title={playPauseTitle}
                >
                    {playPauseIcon}
                </button>
                <div className="timeline-labels">
                    <span>{minDate}</span>
                    <span className="current-date">{currentDate}</span>
                    <span>{maxDate}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max={totalSteps - 1}
                    value={currentIndex}
                    onChange={handleSliderChange}
                    className="timeline-slider"
                />
            </div>
        );
    };
}, React);
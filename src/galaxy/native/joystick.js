import appEvents from '../service/appEvents.js';

export default function createJoystick(container) {
  if (window.orientation === undefined) {
    return { show() {}, hide() {}, destroy() {} };
  }

  const joystickContainer = document.createElement('div');
  joystickContainer.className = 'joystick-container';

  const leftJoystick = createJoystickElement('left');
  const rightJoystick = createJoystickElement('right');

  joystickContainer.appendChild(leftJoystick.element);
  joystickContainer.appendChild(rightJoystick.element);
  container.appendChild(joystickContainer);

  let leftJoystickState = { x: 0, y: 0 };
  let rightJoystickState = { x: 0, y: 0 };

  const handleTouchStart = (e, joystick, state) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystick.element.getBoundingClientRect();
    state.centerX = rect.left + rect.width / 2;
    state.centerY = rect.top + rect.height / 2;
    updateJoystick(touch.clientX, touch.clientY, joystick, state);
  };

  const handleTouchMove = (e, joystick, state, eventName) => {
    e.preventDefault();
    const touch = e.touches[0];
    updateJoystick(touch.clientX, touch.clientY, joystick, state, eventName);
  };

  const handleTouchEnd = (e, joystick, state, eventName) => {
    state.x = 0;
    state.y = 0;
    joystick.thumb.style.transform = `translate(0px, 0px)`;
    appEvents[eventName].fire({ x: 0, y: 0 });
  };

  const updateJoystick = (x, y, joystick, state, eventName) => {
    const dx = x - state.centerX;
    const dy = y - state.centerY;
    const distance = Math.min(joystick.element.clientWidth / 2, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);

    state.x = distance * Math.cos(angle);
    state.y = distance * Math.sin(angle);

    joystick.thumb.style.transform = `translate(${state.x}px, ${state.y}px)`;
    if (eventName) {
      appEvents[eventName].fire({
        x: state.x / (joystick.element.clientWidth / 2),
        y: -state.y / (joystick.element.clientHeight / 2) // Invert Y-axis
      });
    }
  };

  leftJoystick.element.addEventListener('touchstart', (e) => handleTouchStart(e, leftJoystick, leftJoystickState), { passive: false });
  leftJoystick.element.addEventListener('touchmove', (e) => handleTouchMove(e, leftJoystick, leftJoystickState, 'move'), { passive: false });
  leftJoystick.element.addEventListener('touchend', (e) => handleTouchEnd(e, leftJoystick, leftJoystickState, 'move'));

  rightJoystick.element.addEventListener('touchstart', (e) => handleTouchStart(e, rightJoystick, rightJoystickState), { passive: false });
  rightJoystick.element.addEventListener('touchmove', (e) => handleTouchMove(e, rightJoystick, rightJoystickState, 'rotate'), { passive: false });
  rightJoystick.element.addEventListener('touchend', (e) => handleTouchEnd(e, rightJoystick, rightJoystickState, 'rotate'));

  function createJoystickElement(position) {
    const element = document.createElement('div');
    element.className = `joystick ${position}`;
    const thumb = document.createElement('div');
    thumb.className = 'joystick-thumb';
    element.appendChild(thumb);
    return { element, thumb };
  }

  return {
    show() {
      joystickContainer.style.display = 'flex';
    },
    hide() {
      joystickContainer.style.display = 'none';
    },
    destroy() {
      if (joystickContainer.parentNode) {
        container.removeChild(joystickContainer);
      }
    }
  };
}
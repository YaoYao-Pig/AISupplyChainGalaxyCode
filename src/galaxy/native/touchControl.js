import createJoystick from './joystick.js';
import appEvents from '../service/appEvents.js';

export default createTouchControl;

function createTouchControl(renderer) {
  var api = {
    destroy: destroy
  };

  var wasdControls, touchControls, joystickControls;
  var controlMode = 'gyro'; // 'gyro' or 'joystick'

  init();

  return api;

  function init() {
    var container = renderer.getContainer();
    container.addEventListener('touchstart', onTouchStart, false);
    container.addEventListener('touchend', onTouchEnd, false);

    wasdControls = renderer.input();

    // Gyroscope controls
    if (window.orientation !== undefined) {
      var camera = renderer.camera();
      touchControls = require('three.orientation')(camera);
      renderer.onFrame(updateFromDeviceOritentation);
    }

    // Joystick controls
    joystickControls = createJoystick(container.parentNode); 
    joystickControls.hide();

    appEvents.toggleMobileControls.on(toggleControls);
    appEvents.move.on(handleMove);
    appEvents.rotate.on(handleRotate);
  }

  function toggleControls() {
    if (controlMode === 'gyro') {
      controlMode = 'joystick';
      if (touchControls) touchControls.disconnect();
      joystickControls.show();
    } else {
      controlMode = 'gyro';
      if (touchControls) touchControls.connect();
      joystickControls.hide();
    }
  }

  function handleMove(move) {
    if (controlMode !== 'joystick') return;
    wasdControls.moveState.forward = move.y > 0 ? move.y : 0;
    wasdControls.moveState.back = move.y < 0 ? -move.y : 0;
    wasdControls.moveState.left = move.x < 0 ? -move.x : 0;
    wasdControls.moveState.right = move.x > 0 ? move.x : 0;
    wasdControls.updateMovementVector();
  }

  function handleRotate(rotate) {
    if (controlMode !== 'joystick') return;
    wasdControls.moveState.yawLeft = rotate.x < -0.1 ? Math.abs(rotate.x) : 0;
    wasdControls.moveState.yawRight = rotate.x > 0.1 ? rotate.x : 0;
    wasdControls.moveState.pitchUp = rotate.y > 0.1 ? rotate.y : 0;
    wasdControls.moveState.pitchDown = rotate.y < -0.1 ? Math.abs(rotate.y) : 0;
    wasdControls.updateRotationVector();
  }

  function updateFromDeviceOritentation() {
    if (controlMode === 'gyro' && touchControls) {
      touchControls.update();
    }
  }

  function destroy() {
    var container = renderer.getContainer();
    container.removeEventListener('touchstart', onTouchStart, false);
    container.removeEventListener('touchend', onTouchEnd, false);
    if (touchControls) {
      touchControls.disconnect();
      renderer.offFrame(updateFromDeviceOritentation);
    }
    if (joystickControls) {
      joystickControls.destroy();
    }
    appEvents.toggleMobileControls.off(toggleControls);
    appEvents.move.off(handleMove);
    appEvents.rotate.off(handleRotate);
  }

  function onTouchStart(e) {
    if (controlMode !== 'gyro' || !e.touches) return;

    if (e.touches.length > 0) {
      wasdControls.moveState.forward = (e.touches.length === 1);
      wasdControls.moveState.back = (e.touches.length === 2);
      wasdControls.updateMovementVector();
    }
  }

  function onTouchEnd(e) {
    if (controlMode !== 'gyro' || !e.touches) return;
    wasdControls.moveState.forward = (e.touches.length === 1);
    wasdControls.moveState.back = (e.touches.length === 2);
    wasdControls.updateMovementVector();
  }
}
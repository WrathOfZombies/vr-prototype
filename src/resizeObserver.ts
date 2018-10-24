const ResizeObserver = cb => {
  if ((window as any).ResizeObserver) {
    console.log("Using browser resizeObserver");
    return new (window as any).ResizeObserver(cb);
  }

  let oldHeight: any = null;
  let _target: any = null;
  let stop = false;

  function resizeCheck() {
    if (stop) {
      return;
    }
    const newHeight = _target.getBoundingClientRect();
    if (oldHeight && oldHeight.height !== newHeight.height) {
      cb();
    }
    oldHeight = newHeight;
    requestAnimationFrame(resizeCheck);
  }

  return {
    observe(target) {
      _target = target;
      requestAnimationFrame(resizeCheck);
    },
    disconnect() {
      stop = true;
    }
  };
};

export default ResizeObserver;

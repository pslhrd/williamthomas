let device = null;
const checkDevice = () => {
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    device = "mobile";
  } else {
    device = "desktop";
  }
};

export default class Orientation {
  constructor() {
    this.tilt = {
      x: 0,
      y: 0,
    };

    checkDevice();

    // Orientation event
    window.addEventListener(
      "deviceorientation",
      this.getOrientation.bind(this)
    );
  }

  resize() {
    checkDevice();
  }

  getOrientation(event) {
    if (device == "mobile") {
      this.tilt.y = 1 + event.beta.toFixed(2) / 35;
      this.tilt.x = event.gamma.toFixed(2) / 35;
    }
  }
}

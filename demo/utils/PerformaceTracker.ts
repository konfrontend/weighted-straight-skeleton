export default class PerformanceTracker {
  startTime: number = 0
  endTime: number = 0
  durationRaw: number = 0

  constructor() {
  }

  start() {
    this.startTime = performance.now()
    this.endTime = 0
    this.durationRaw = 0
  }

  stop() {
    this.endTime = performance.now()
    this.durationRaw = performance.measure('command', { start: this.startTime, end: this.endTime }).duration
  }

  get duration() {
    return parseFloat(Number(this.durationRaw / 1000).toFixed(4))
  }
}
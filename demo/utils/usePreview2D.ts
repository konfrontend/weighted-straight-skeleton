import { Reactive, reactive, Ref } from 'vue';
import { Skeleton } from '../../src';

export function usePreview2D(canvasRef: Ref<HTMLCanvasElement | null>, skeletonBox: Reactive<{
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
}>) {

  function draw2d(skeleton: Skeleton) {
    const canvasElement = canvasRef.value!;


    resizeCanvas2d(canvasElement);
    render(canvasElement, skeleton);
  }

  function render(canvasElement: HTMLCanvasElement, skeleton: Skeleton) {
    const ctx = canvasElement.getContext('2d')!;
    ctx.fillStyle = '#eee';
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    const padding = 15 * window.devicePixelRatio;
    const scale = Math.min(
      (canvasElement.width - padding * 2) / (skeletonBox.maxX - skeletonBox.minX),
      (canvasElement.height - padding * 2) / (skeletonBox.maxY - skeletonBox.minY),
    );
    const offsetX = (canvasElement.width - (skeletonBox.maxX - skeletonBox.minX) * scale) / 2;
    const offsetY = (canvasElement.height - (skeletonBox.maxY - skeletonBox.minY) * scale) / 2;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = window.devicePixelRatio;
    ctx.fillStyle = '#ffb6e9';

    for (const polygon of skeleton.polygons) {
      ctx.beginPath();

      for (let i = 0; i < polygon.length; i++) {
        const vertex = skeleton.vertices[polygon[i]];
        const x = (vertex[0] - skeletonBox.minX) * scale + offsetX;
        const y = (vertex[1] - skeletonBox.minY) * scale + offsetY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
  }

  function resizeCanvas2d(canvasElement: HTMLCanvasElement) {
    canvasElement.width = canvasElement.clientWidth * window.devicePixelRatio;
    canvasElement.height = canvasElement.clientHeight * window.devicePixelRatio;
  }

  return {
    draw2d,
  };
}
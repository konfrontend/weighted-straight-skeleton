<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue';
  import { SkeletonBuilder, Skeleton } from '../src';

  import { usePreview3D } from './utils/usePreview3D';
  import { usePreview2D } from './utils/usePreview2D';
  import PerformanceTracker from './utils/PerformaceTracker';

  const testRoof = [
    [
      -7.668643659936184,
      -6.893428148118769,
    ],
    [
      4.408397985946804,
      -6.7713729215075,
    ],
    [
      4.306500975403689,
      3.311066594496151,
    ],
    [
      -10.670070422270111,
      3.159707605316379,
    ],
    [
      -10.606254962386874,
      -3.1546632582566723,
    ],
    [
      -7.706725210596072,
      -3.1253594956881585,
    ],
    [
      -7.668643659936184,
      -6.893428148118769,
    ],
  ];
  const testRect = [
    [
      0,
      0,
    ],
    [
      5,
      0,
    ],
    [
      5,
      5,
    ],

    [
      0,
      5,
    ],
    [
      0,
      0,
    ],
  ];

  const canvas2dRef = ref<HTMLCanvasElement | null>(null);
  const canvas3dRef = ref<HTMLCanvasElement | null>(null);
  const skeletonBox = reactive({
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  });
  const tracker = new PerformanceTracker();

  const { draw2d } = usePreview2D(canvas2dRef, skeletonBox);
  const { draw3d, initRenderer, animate } = usePreview3D(canvas3dRef, skeletonBox);

  onMounted(() => {
    initRenderer();
    animate();

    SkeletonBuilder.init().then(() => {
      build();
      // stressTest(10);
    });
  });

  function stressTest(maxFrames: 10) {
    let frameCount = 0;

    function frameLoop(timestamp: number) {
      build();

      if (++frameCount < maxFrames) {
        requestAnimationFrame(frameLoop); // schedule the next frame
      } else {
        console.log(`Finished ${maxFrames} frames.`);
      }
    }

    requestAnimationFrame(frameLoop);
  }

  function build() {
    tracker.start();

    /*
    * weights:
    * 1.0 ~ 45°
    * 3.732 ~ 15°
    * 0.577 ~ 60°
    * */

    const testRoofSet = {
      rings: [testRoof],
      weights: [[1.0, 0.8, 1.0, 0.8, 1.0, 1.0]],
      maxHeight: 2.0,
    };
    const testRectSet = {
      rings: [testRect],
      weights: [[1.0, 0.8, 1.0, 0.8]],
      maxHeight: 2.0,
    };
    const inputData = testRoofSet;
    // const inputData = testRectSet;

    const activeSkeleton = SkeletonBuilder.build(inputData);
    console.log(activeSkeleton);

    tracker.stop();
    console.log(`${tracker.duration}s`);

    updateSkeletonBox(activeSkeleton);
    draw2d(activeSkeleton);
    draw3d(activeSkeleton);
  }

  function updateSkeletonBox(skeleton: Skeleton) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const vertex of skeleton.vertices) {
      minX = Math.min(minX, vertex[0]);
      minY = Math.min(minY, vertex[1]);
      maxX = Math.max(maxX, vertex[0]);
      maxY = Math.max(maxY, vertex[1]);
    }

    Object.assign(skeletonBox, { minX, minY, maxX, maxY });
  }

  // function setEdgePitch(ring: number[][], edgeIx: number, deg: number) {
  //   const rad = deg * Math.PI / 180;
  //   ring[edgeIx][2] = Math.tan(rad);   // store the new weight
  // }

  function toWeight(degree: number) {
    return 1.0 / Math.cos(degree * Math.PI / 180.0);
  }

</script>
<template>
  <div class="container">
    <div class="controls">
      <p>GeoJSON Polygon input</p>
      <div class="btns">
        <button class="sample" data-sample="0">Sample polygon #1</button>
        <button class="sample" data-sample="1">Sample polygon #2</button>
        <button class="sample" data-sample="2">Sample polygon #3</button>
      </div>
      <textarea id="input"></textarea>
      <div class="btns-bottom">
        <span>Last update took <span id="time"></span></span>
        <button id="update">Update straight skeleton</button>
      </div>
    </div>
    <div class="preview">
      <p>2D preview</p>
      <canvas ref="canvas2dRef" id="canvas2d"></canvas>
      <p>3D preview</p>
      <canvas ref="canvas3dRef" id="canvas3d"></canvas>
    </div>
  </div>

</template>

<style></style>

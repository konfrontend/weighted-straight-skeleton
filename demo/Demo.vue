<script setup>

  import { SkeletonBuilder } from '../src/index.ts';

  console.log(SkeletonBuilder, 'test');

  let activeSkeleton = null;
  let skeletonBox = null;

  const updateSkeletonBox = () => {
    if (activeSkeleton === null) {
      skeletonBox = null;
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const vertex of activeSkeleton.vertices) {
      minX = Math.min(minX, vertex[0]);
      minY = Math.min(minY, vertex[1]);
      maxX = Math.max(maxX, vertex[0]);
      maxY = Math.max(maxY, vertex[1]);
    }

    skeletonBox = { minX, minY, maxX, maxY };
  };

  function main() {
    const canvas2d = document.getElementById('canvas2d');
    const ctx = canvas2d.getContext('2d');

    const draw2d = () => {
      ctx.fillStyle = '#eee';
      ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);

      console.log(activeSkeleton);
      if (activeSkeleton === null) {
        return;
      }

      const padding = 15 * window.devicePixelRatio;
      const scale = Math.min(
        (canvas2d.width - padding * 2) / (skeletonBox.maxX - skeletonBox.minX),
        (canvas2d.height - padding * 2) / (skeletonBox.maxY - skeletonBox.minY),
      );
      const offsetX = (canvas2d.width - (skeletonBox.maxX - skeletonBox.minX) * scale) / 2;
      const offsetY = (canvas2d.height - (skeletonBox.maxY - skeletonBox.minY) * scale) / 2;

      ctx.strokeStyle = '#000';
      ctx.lineWidth = window.devicePixelRatio;
      ctx.fillStyle = '#ffb6e9';

      for (const polygon of activeSkeleton.polygons) {
        ctx.beginPath();

        for (let i = 0; i < polygon.length; i++) {
          const vertex = activeSkeleton.vertices[polygon[i]];
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
    };

    const onCanvas2dResize = () => {
      canvas2d.width = canvas2d.clientWidth * window.devicePixelRatio;
      canvas2d.height = canvas2d.clientHeight * window.devicePixelRatio;
      draw2d();
    };

    updateSkeletonBox();

    new ResizeObserver(onCanvas2dResize).observe(canvas2d);

    // const updateButton = document.getElementById('update');
    // updateButton.addEventListener('click', () => {
    //   updateSkeletonBox();
    //   draw2d();
    // });

    // draw2d();
  }


  const roofPoints = [
    [
      -7.668643659936184,
      -6.893428148118769,
      1,
    ],
    [
      4.408397985946804,
      -6.7713729215075,
      1,
    ],
    [
      4.306500975403689,
      3.311066594496151,
      1,
    ],
    [
      -10.670070422270111,
      3.159707605316379,
      1,
    ],
    [
      -10.606254962386874,
      -3.1546632582566723,
      1,
    ],
    [
      -7.706725210596072,
      -3.1253594956881585,
      1,
    ],
    [
      -7.668643659936184,
      -6.893428148118769,
      1,
    ],
  ];
  const demoPoints = [
    [
      9.594226,
      47.525058,
    ],
    [
      8.522612,
      47.830828,
    ],
    [
      8.317301,
      47.61358,
    ],
    [
      7.466759,
      47.620582,
    ],
    [
      7.192202,
      47.449766,
    ],
    [
      6.736571,
      47.541801,
    ],
    [
      6.768714,
      47.287708,
    ],
    [
      6.037389,
      46.725779,
    ],
    [
      6.022609,
      46.27299,
    ],
    [
      6.5001,
      46.429673,
    ],
    [
      6.843593,
      45.991147,
    ],
    [
      7.273851,
      45.776948,
    ],
    [
      7.755992,
      45.82449,
    ],
    [
      8.31663,
      46.163642,
    ],
    [
      8.489952,
      46.005151,
    ],
    [
      8.966306,
      46.036932,
    ],
    [
      9.182882,
      46.440215,
    ],
    [
      9.922837,
      46.314899,
    ],
    [
      10.363378,
      46.483571,
    ],
    [
      10.442701,
      46.893546,
    ],
    [
      9.932448,
      46.920728,
    ],
    [
      9.47997,
      47.10281,
    ],
    [
      9.632932,
      47.347601,
    ],
    [
      9.594226,
      47.525058,
    ],
  ];

  function setEdgePitch(ring, edgeIx, deg) {
    const rad = deg * Math.PI / 180;
    ring[edgeIx][2] = Math.tan(rad);   // store the new weight
  }

  setEdgePitch(roofPoints, 1, 60);

  function toWeight(degree) {
    return 1.0 / Math.cos(degree * Math.PI / 180.0);
  }

  SkeletonBuilder.init().then(() => {
    function cll() {
      activeSkeleton = SkeletonBuilder.buildFromPolygon([roofPoints]);
    }

    cll();

    main();

    // Stress test
    // const MAX_FRAMES = 10;
    // let frameCount = 0;
    // const startTime = performance.now();
    //
    // function frameLoop(timestamp: number) {
    //   cll();
    //   console.log(`Frame #${frameCount}   t = ${(timestamp - startTime).toFixed(1)} ms`);
    //
    //   if (++frameCount < MAX_FRAMES) {
    //     requestAnimationFrame(frameLoop); // schedule the next frame
    //   } else {
    //     console.log('Finished 1 000 frames.');
    //   }
    // }
    // requestAnimationFrame(frameLoop);
  });
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
      <p>2D straight skeleton preview</p>
      <canvas id="canvas2d"></canvas>
      <p>3D straight skeleton preview</p>
      <canvas id="canvas3d"></canvas>
    </div>
  </div>

</template>

<style></style>

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
    const testHoles = [
      [
        [
          417.3775493093188,
          476.76830966240306
        ],
        [
          472.1682083499018,
          542.5693531832122
        ],
        [
          466.38309108063044,
          555.6698445478203
        ],
        [
          470.5259815121732,
          557.8345981066444
        ],
        [
          448.76647591226856,
          610.6471202745089
        ],
        [
          444.5116154690626,
          609.0795401112225
        ],
        [
          438.9131148858967,
          622.6652348597049
        ],
        [
          341.835114773801,
          597.9198622821119
        ],
        [
          340.3048579477357,
          597.8452156076697
        ],
        [
          340.4541512966201,
          596.4269287932677
        ],
        [
          337.8415176911427,
          586.4242744180115
        ],
        [
          337.02040427227837,
          585.9763943713582
        ],
        [
          335.63944079509747,
          580.0793070904235
        ],
        [
          334.1838306434744,
          578.3997569154737
        ],
        [
          332.24301710797687,
          571.1217061573582
        ],
        [
          332.4296337940824,
          568.3597792029964
        ],
        [
          330.86205363079597,
          562.9852186431572
        ],
        [
          331.23528700300704,
          561.9774885381873
        ],
        [
          328.47336004864525,
          551.6762474651622
        ],
        [
          327.6149232925598,
          550.7431640346346
        ],
        [
          328.51068338586634,
          550.1086673018758
        ],
        [
          380.16618209987655,
          498.60246193675005
        ],
        [
          417.3775493093188,
          476.76830966240306
        ]
      ],
      [
        [
          384.23442585697705,
          555.0726711522829
        ],
        [
          367.73751080524835,
          538.6504027749963
        ],
        [
          358.443999837193,
          547.719973719725
        ],
        [
          367.961450828575,
          584.3714908708507
        ],
        [
          380.6513854837509,
          587.2827111740969
        ],
        [
          386.8097361252333,
          563.9556254109059
        ],
        [
          385.83932935748453,
          562.3507219103983
        ],
        [
          384.6823059036303,
          560.2232916887953
        ],
        [
          384.30907253141925,
          556.6775746527902
        ],
        [
          384.23442585697705,
          555.0726711522829
        ]
      ],
      [
        [
          425.43939014907767,
          518.1225673033881
        ],
        [
          417.34022597209776,
          508.49314630034286
        ],
        [
          401.7763943508967,
          517.1894838728605
        ],
        [
          406.7403982013037,
          520.4366142110966
        ],
        [
          402.97074114197204,
          526.2590548175891
        ],
        [
          405.9192847824394,
          528.31183836475
        ],
        [
          400.134167513168,
          534.8434223784435
        ],
        [
          400.95528093203234,
          535.4405957739812
        ],
        [
          394.05046354612773,
          542.5320298459912
        ],
        [
          413.0107188544494,
          550.3699306624234
        ],
        [
          425.43939014907767,
          518.1225673033881
        ]
      ],
      [
        [
          434.88219446601727,
          582.2067373120265
        ],
        [
          450.48334942443944,
          544.9953701025842
        ],
        [
          441.1151917819419,
          541.3003597176947
        ],
        [
          423.05069656692683,
          584.9313409291672
        ],
        [
          411.0325819817308,
          579.930013741539
        ],
        [
          406.7030748640825,
          596.4642521304888
        ],
        [
          415.0635024016102,
          599.6367357942828
        ],
        [
          417.0416392743288,
          595.120611990529
        ],
        [
          424.39433670688663,
          598.1438023054386
        ],
        [
          425.924593532952,
          594.4114685833281
        ],
        [
          429.1344005339671,
          595.7177853860668
        ],
        [
          433.68784767494196,
          584.483460882514
        ],
        [
          432.0456208372133,
          583.774317475313
        ],
        [
          433.1279976166254,
          581.4602705676044
        ],
        [
          434.88219446601727,
          582.2067373120265
        ]
      ]
    ]

    const testHolesSet = {
      rings: testHoles,
      weights: testHoles.map((d) => d.map(x => 1.0)),
      maxHeight: 5.0,
    }

    const testRoofSet = {
      rings: [testRoof],
      weights: [[1.0, 0.8, 1.0, 0.8, 1.0, 1.0]],
      maxHeight: 2.0,
    };
    const testRectSet = {
      rings: [testRect],
      weights: [[1.0, 0.8, 1.0, 0.8]],
      maxHeight: 1.0,
    };
    // const activeSkeleton = SkeletonBuilder.build(testRectSet);
    // const activeSkeleton = SkeletonBuilder.build(testHolesSet);
    const activeSkeleton = SkeletonBuilder.build(testRoofSet);
    // console.log(activeSkeleton);


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

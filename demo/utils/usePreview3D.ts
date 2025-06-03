import { Reactive, Ref, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Skeleton } from '../../src';
import { Earcut } from 'three/src/extras/Earcut';
import { PerspectiveCamera, WebGLRenderer } from 'three';

export function usePreview3D (canvasRef: Ref<HTMLCanvasElement | null>, skeletonBox: Reactive<{ minX: number, minY: number, maxX: number, maxY: number}>) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  const parent = new THREE.Object3D();
  scene.add(parent);

  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(1, 1, -0.5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  let camera: PerspectiveCamera
  let renderer: WebGLRenderer
  let controls: OrbitControls

  function initRenderer () {
    const canvasElement = canvasRef.value!

    camera = new THREE.PerspectiveCamera(25, canvasElement.clientWidth / canvasElement.clientHeight, 0.01, 100);
    camera.position.set(1, 2, 1);

    renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true,
    });
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    resizeCanvas3d(canvasElement)
  }

  function animate () {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function draw3d(skeleton: Skeleton) {
    // parent.remove(...parent.children);

    const offset = new THREE.Vector3(
      -(skeletonBox.maxX + skeletonBox.minX) / 2,
      -(skeletonBox.maxY + skeletonBox.minY) / 2,
      0,
    );
    const scale = 1 / Math.max(skeletonBox.maxX - skeletonBox.minX, skeletonBox.maxY - skeletonBox.minY);

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffb6e9),
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];

    for (const polygon of skeleton.polygons) {
      const polygonVertices: number[] = [];

      for (let i = 0; i < polygon.length; i++) {
        const vertex = skeleton.vertices[polygon[i]];
        polygonVertices.push(
          (vertex[0] + offset.x) * scale,
          (vertex[1] + offset.y) * scale,
          (vertex[2] + offset.z) * scale,
        );
      }

      const triangles = Earcut.triangulate(polygonVertices, [], 3);

      for (let i = 0; i < triangles.length / 3; i++) {
        for (let j = 0; j < 3; j++) {
          const index = triangles[i * 3 + j];

          vertices.push(polygonVertices[index * 3], polygonVertices[index * 3 + 1], polygonVertices[index * 3 + 2]);
        }
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));

    material.wireframe = true;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    camera.position.set(1, 2, 1);
    controls.update();

  }

  function resizeCanvas3d(canvasElement: HTMLCanvasElement) {
    canvasElement.width = canvasElement.clientWidth * window.devicePixelRatio;
    canvasElement.height = canvasElement.clientHeight * window.devicePixelRatio;

    renderer.setViewport(0, 0, canvasElement.width, canvasElement.height);
    camera.aspect = canvasElement.clientWidth / canvasElement.clientHeight;
    camera.updateProjectionMatrix();
  }

  return {
    draw3d,
    initRenderer,
    animate
  }
}
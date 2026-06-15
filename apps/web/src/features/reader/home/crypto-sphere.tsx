"use client";

import type { Locale } from "@cmsauto/contracts";
import { BarChart3, Bolt, Newspaper, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const worldGeoJsonUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const cardPositions = [
  [0.16, 0.2],
  [0.82, 0.22],
  [0.84, 0.7],
  [0.14, 0.72]
] as const;

const globeCopy = {
  "vi-vn": {
    ariaLabel: "Quả cầu địa lý 3D, có thể kéo để xoay",
    dragHint: "Kéo để xoay 360°",
    cards: [
      { icon: Newspaper, title: "100+ nguồn tin", description: "Tin tức và dữ liệu thị trường được chọn lọc.", lat: 28, lon: -92 },
      { icon: BarChart3, title: "Toàn cảnh thị trường", description: "Theo dõi vĩ mô, ETF, DeFi và các hệ sinh thái.", lat: 38, lon: 82 },
      { icon: Radio, title: "Cập nhật 24/7", description: "Bám sát giá, dòng tiền và diễn biến đáng chú ý.", lat: -18, lon: -58 },
      { icon: Bolt, title: "Tín hiệu liên tục", description: "Kết nối dữ liệu với bối cảnh để đọc thị trường nhanh hơn.", lat: -25, lon: 135 }
    ]
  },
  "en-us": {
    ariaLabel: "Interactive 3D globe, drag to rotate",
    dragHint: "Drag to rotate 360°",
    cards: [
      { icon: Newspaper, title: "100+ sources", description: "Curated news and market data from across the industry.", lat: 28, lon: -92 },
      { icon: BarChart3, title: "Market-wide view", description: "Follow macro, ETFs, DeFi and major ecosystems.", lat: 38, lon: 82 },
      { icon: Radio, title: "Always current", description: "Track prices, capital flows and significant developments.", lat: -18, lon: -58 },
      { icon: Bolt, title: "Continuous signals", description: "Connect live data with context to read markets faster.", lat: -25, lon: 135 }
    ]
  }
} satisfies Record<Locale, {
  ariaLabel: string;
  dragHint: string;
  cards: Array<{ icon: typeof Newspaper; title: string; description: string; lat: number; lon: number }>;
}>;

type GeoCoordinate = [number, number];
type GeoRing = GeoCoordinate[];
type GeoPolygon = GeoRing[];
type PreparedPolygon = {
  rings: GeoPolygon;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

type WorldGeoJson = {
  features?: Array<{
    geometry?: {
      coordinates?: GeoPolygon | GeoPolygon[];
      type?: "Polygon" | "MultiPolygon";
    };
  }>;
};

function isInsideEllipse(lat: number, lon: number, centerLat: number, centerLon: number, latRadius: number, lonRadius: number) {
  const latScore = (lat - centerLat) / latRadius;
  const lonDelta = Math.abs(lon - centerLon);
  const wrappedLonDelta = Math.min(lonDelta, 360 - lonDelta);
  const lonScore = wrappedLonDelta / lonRadius;
  return latScore * latScore + lonScore * lonScore < 1;
}

function isLandPoint(lat: number, lon: number) {
  return (
    // North America, Mexico and Central America.
    isInsideEllipse(lat, lon, 53, -105, 28, 54) ||
    isInsideEllipse(lat, lon, 34, -94, 22, 36) ||
    isInsideEllipse(lat, lon, 17, -92, 10, 18) ||
    isInsideEllipse(lat, lon, 10, -80, 6, 20) ||
    // South America.
    isInsideEllipse(lat, lon, -10, -59, 34, 24) ||
    isInsideEllipse(lat, lon, -35, -64, 19, 12) ||
    isInsideEllipse(lat, lon, -18, -73, 27, 8) ||
    // Europe and Africa.
    isInsideEllipse(lat, lon, 54, 12, 15, 33) ||
    isInsideEllipse(lat, lon, 42, -4, 10, 15) ||
    isInsideEllipse(lat, lon, 8, 20, 40, 29) ||
    isInsideEllipse(lat, lon, -24, 24, 18, 18) ||
    isInsideEllipse(lat, lon, 32, 31, 10, 16) ||
    isInsideEllipse(lat, lon, -18, 47, 10, 7) ||
    // Asia, India, Southeast Asia and islands.
    isInsideEllipse(lat, lon, 55, 79, 24, 65) ||
    isInsideEllipse(lat, lon, 34, 102, 24, 49) ||
    isInsideEllipse(lat, lon, 22, 78, 16, 17) ||
    isInsideEllipse(lat, lon, 16, 105, 15, 25) ||
    isInsideEllipse(lat, lon, 2, 118, 10, 25) ||
    isInsideEllipse(lat, lon, 38, 138, 9, 8) ||
    // Oceania and polar land.
    isInsideEllipse(lat, lon, -25, 134, 14, 23) ||
    isInsideEllipse(lat, lon, -42, 172, 6, 8) ||
    isInsideEllipse(lat, lon, 72, -42, 11, 21)
  );
}

function isPointInRing(lat: number, lon: number, ring: GeoRing) {
  let inside = false;
  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index++) {
    const [currentLon, currentLat] = ring[index];
    const [previousLon, previousLat] = ring[previousIndex];
    const intersects = currentLat > lat !== previousLat > lat && lon < ((previousLon - currentLon) * (lat - currentLat)) / (previousLat - currentLat || 1) + currentLon;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function prepareWorldPolygons(geoJson: WorldGeoJson): PreparedPolygon[] {
  const polygons: GeoPolygon[] = [];

  geoJson.features?.forEach((feature) => {
    if (feature.geometry?.type === "Polygon") {
      polygons.push(feature.geometry.coordinates as GeoPolygon);
    }

    if (feature.geometry?.type === "MultiPolygon") {
      polygons.push(...(feature.geometry.coordinates as GeoPolygon[]));
    }
  });

  return polygons
    .filter((polygon) => polygon.length > 0)
    .map((rings) => {
      const allPoints = rings.flat();
      const lats = allPoints.map(([, lat]) => lat);
      const lons = allPoints.map(([lon]) => lon);

      return {
        rings,
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLon: Math.min(...lons),
        maxLon: Math.max(...lons)
      };
    });
}

function createGeoJsonLandPredicate(polygons: PreparedPolygon[]) {
  return (lat: number, lon: number) => {
    for (const polygon of polygons) {
      if (lat < polygon.minLat || lat > polygon.maxLat || lon < polygon.minLon || lon > polygon.maxLon) {
        continue;
      }

      if (!isPointInRing(lat, lon, polygon.rings[0])) {
        continue;
      }

      const insideHole = polygon.rings.slice(1).some((ring) => isPointInRing(lat, lon, ring));
      if (!insideHole) {
        return true;
      }
    }

    return false;
  };
}

async function fetchWorldLandPredicate() {
  const response = await fetch(worldGeoJsonUrl, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Cannot load world map.");
  }

  const geoJson = (await response.json()) as WorldGeoJson;
  const polygons = prepareWorldPolygons(geoJson);
  if (polygons.length === 0) {
    throw new Error("World map has no polygons.");
  }

  return createGeoJsonLandPredicate(polygons);
}

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function buildLandMassGeometry(isLand: (lat: number, lon: number) => boolean) {
  const positions: number[] = [];
  const indices: number[] = [];
  const radius = 1.505;
  let vertexIndex = 0;

  const pushPatch = (lat: number, lon: number, latSize: number, lonSize: number) => {
    const corners = [
      [lat - latSize, lon - lonSize],
      [lat - latSize, lon + lonSize],
      [lat + latSize, lon + lonSize],
      [lat + latSize, lon - lonSize]
    ];

    corners.forEach(([cornerLat, cornerLon]) => {
      const point = latLonToVector3(cornerLat, cornerLon, radius);
      positions.push(point.x, point.y, point.z);
    });

    indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
    vertexIndex += 4;
  };

  for (let lat = -60; lat <= 82; lat += 1.55) {
    const lonStep = Math.max(1.85, 2.75 / Math.max(0.4, Math.cos(THREE.MathUtils.degToRad(lat))));
    for (let lon = -180; lon <= 180; lon += lonStep) {
      if (isLand(lat, lon)) {
        const jitterLat = lat + Math.sin(lat * 4.1 + lon) * 0.1;
        const jitterLon = lon + Math.cos(lon * 3.7 + lat) * 0.12;
        pushPatch(jitterLat, jitterLon, 0.88, lonStep * 0.54);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function CryptoSphere({ locale }: { locale: Locale }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isHoveringRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const copy = globeCopy[locale];

  useEffect(() => {
    isHoveringRef.current = isHovering;
  }, [isHovering]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 5.75);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      preserveDrawingBuffer: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const group = new THREE.Group();
    group.rotation.set(-0.12, -0.48, 0.02);
    scene.add(group);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0xc8a227,
        opacity: 0,
        side: THREE.BackSide,
        transparent: true
      })
    );
    group.add(atmosphere);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.48, 128, 128),
      new THREE.MeshStandardMaterial({
        color: 0xf8f5eb,
        emissive: 0xc8a227,
        emissiveIntensity: 0.1,
        metalness: 0.08,
        opacity: 0.94,
        roughness: 0.7,
        transparent: true
      })
    );
    sphere.renderOrder = 0;
    group.add(sphere);

    const oceanGrid = new THREE.Mesh(
      new THREE.SphereGeometry(1.492, 48, 24),
      new THREE.MeshBasicMaterial({
        color: 0xc8a227,
        depthTest: true,
        depthWrite: false,
        opacity: 0.1,
        transparent: true,
        wireframe: true
      })
    );
    oceanGrid.renderOrder = 1;
    group.add(oceanGrid);

    let landGeometry = buildLandMassGeometry(isLandPoint);
    const landMaterial = new THREE.MeshBasicMaterial({
      color: 0x0f1115,
      depthTest: true,
      depthWrite: false,
      opacity: 0.76,
      side: THREE.DoubleSide,
      transparent: true
    });
    const land = new THREE.Mesh(landGeometry, landMaterial);
    land.renderOrder = 2;
    group.add(land);
    let disposed = false;

    void fetchWorldLandPredicate()
      .then((isWorldLand) => {
        if (disposed) {
          return;
        }

        const accurateLandGeometry = buildLandMassGeometry(isWorldLand);
        land.geometry.dispose();
        land.geometry = accurateLandGeometry;
        landGeometry = accurateLandGeometry;
      })
      .catch(() => {
        // Keep the local fallback geography if the external map dataset cannot be loaded.
      });

    const ringMaterialA = new THREE.MeshBasicMaterial({
      color: 0xc8a227,
      depthWrite: false,
      opacity: 0.52,
      transparent: true
    });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.74, 0.006, 8, 220), ringMaterialA);
    ringA.rotation.set(Math.PI / 2.42, 0.22, 0.38);
    group.add(ringA);

    const ringMaterialB = ringMaterialA.clone();
    ringMaterialB.opacity = 0.22;
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.0045, 8, 220), ringMaterialB);
    ringB.rotation.set(Math.PI / 2.08, -0.18, -0.82);
    group.add(ringB);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(2.4, 2.2, 3.6);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 1.75));

    const cardAnchors = copy.cards.map((card) => latLonToVector3(card.lat, card.lon, 1.68));
    const normalPoint = new THREE.Vector3();

    const dragState = {
      active: false,
      lastX: 0,
      lastY: 0,
      velocityX: 0
    };
    let frameId = 0;

    const updateCards = () => {
      const rect = canvas.getBoundingClientRect();
      const shouldShow = true;
      group.updateMatrixWorld();

      cardAnchors.forEach((anchor, index) => {
        const element = cardRefs.current[index];
        if (!element) {
          return;
        }

        normalPoint.copy(anchor).normalize().applyQuaternion(group.quaternion);

        const facing = normalPoint.z;
        const visible = shouldShow && facing > -0.55;
        const opacity = visible ? Math.min(1, Math.max(0, (facing + 0.55) / 0.7)) : 0;
        const defaultOpacity = index < 2 ? 1 : 0;
        const finalOpacity = Math.max(opacity, defaultOpacity);
        const [positionX, positionY] = cardPositions[index] ?? [0.5, 0.5];
        const cardX = positionX * rect.width;
        const cardY = positionY * rect.height;

        element.style.opacity = String(finalOpacity);
        element.style.transform = `translate(-50%, -50%) translate3d(${cardX}px, ${cardY}px, 0) scale(${finalOpacity > 0.15 ? 1 : 0.96})`;
        element.style.zIndex = String(20 + Math.round(facing * 10));
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      updateCards();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const startHover = () => {
      if (!isHoveringRef.current) {
        isHoveringRef.current = true;
        setIsHovering(true);
      }
    };

    const endHover = () => {
      if (isHoveringRef.current && !dragState.active) {
        isHoveringRef.current = false;
        setIsHovering(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      startHover();
      dragState.active = true;
      dragState.lastX = event.clientX;
      dragState.lastY = event.clientY;
      dragState.velocityX = 0;
      canvas.setPointerCapture(event.pointerId);
      setIsDragging(true);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.active) {
        return;
      }

      const dx = event.clientX - dragState.lastX;
      const dy = event.clientY - dragState.lastY;
      dragState.lastX = event.clientX;
      dragState.lastY = event.clientY;
      dragState.velocityX = dx * 0.002;
      group.rotation.y += dx * 0.007;
      group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + dy * 0.0038, -0.68, 0.68);
    };

    const endDrag = (event: PointerEvent) => {
      if (!dragState.active) {
        return;
      }

      dragState.active = false;
      canvas.releasePointerCapture(event.pointerId);
      setIsDragging(false);
    };

    canvas.addEventListener("pointerenter", startHover);
    canvas.addEventListener("pointerleave", endHover);
    canvas.addEventListener("mousemove", startHover);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    const animate = () => {
      if (!dragState.active) {
        group.rotation.y += 0.0034 + dragState.velocityX;
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -0.12, 0.008);
        dragState.velocityX *= 0.93;
      }

      ringA.rotation.z += 0.0016;
      ringB.rotation.z -= 0.0011;
      updateCards();
      renderer.render(scene, camera);
      canvas.dataset.rendered = "true";
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      disposed = true;
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      canvas.removeEventListener("pointerenter", startHover);
      canvas.removeEventListener("pointerleave", endHover);
      canvas.removeEventListener("mousemove", startHover);
      observer.disconnect();
      renderer.dispose();
      atmosphere.geometry.dispose();
      atmosphere.material.dispose();
      sphere.geometry.dispose();
      sphere.material.dispose();
      oceanGrid.geometry.dispose();
      oceanGrid.material.dispose();
      landGeometry.dispose();
      landMaterial.dispose();
      ringA.geometry.dispose();
      ringA.material.dispose();
      ringB.geometry.dispose();
      ringB.material.dispose();
    };
  }, [copy.cards]);

  return (
    <div
      className="relative h-full w-full"
      data-home-globe-scene="true"
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={() => setIsHovering(false)}
    >
      <canvas
        aria-label={copy.ariaLabel}
        className={`absolute inset-0 h-full w-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        data-engine="three.js r184"
        height={700}
        ref={canvasRef}
        style={{ background: "transparent", display: "block", touchAction: "none" }}
        width={700}
      />
      <div
        className={`pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-lg border border-[#C8A227]/30 bg-[#0F1115]/92 px-3 py-1 text-[11px] font-semibold text-[#F5E7B3] shadow-sm transition ${
          isDragging || isHovering ? "opacity-100" : "opacity-0"
        }`}
      >
        {copy.dragHint}
      </div>
      {copy.cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            className="pointer-events-none absolute left-0 top-0 hidden w-44 rounded-lg border border-[#E5E7EB] bg-white/96 px-3 py-2.5 shadow-[0_12px_30px_rgba(17,24,39,0.16)] backdrop-blur transition-[opacity,transform] duration-300 md:block"
            key={card.title}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            style={{ opacity: index < 2 ? 1 : 0 }}
          >
            <div className="flex gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#0F1115] text-[#F5E7B3]">
                <Icon size={16} />
              </span>
              <span>
                <strong className="block text-xs font-bold text-[#111827]">{card.title}</strong>
                <span className="mt-1 block text-[11px] leading-4 text-[#4B5563]">{card.description}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

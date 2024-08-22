import React, { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { StaticMap } from "react-map-gl";
import DeckGL, { ScatterplotLayer, COORDINATE_SYSTEM } from "deck.gl";
import * as arrow from "apache-arrow";
import { DataFilterExtension } from "@deck.gl/extensions";

const GEOARROW_POINT_DATA = "http://127.0.0.1:8080/data.parquet";

const INITIAL_VIEW_STATE = {
  latitude: 20,
  longitude: 0,
  zoom: 2,
  bearing: 0,
  pitch: 0,
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

function Root() {
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 1]);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [zoom, setZoom] = useState(2);
  const [layerData, setLayerData] = useState<any>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./dataWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case "DATA_LOADED":
          setTimeRange([payload.minTime, payload.minTime + 1]);
          break;
        case "FILTERED_DATA":
          const newTable = arrow.tableFromIPC(payload);
          const flatCoordinateArray = newTable.getChild("geometry")?.data[0].children[0].values;
          const colorAttribute = newTable.getChild("rgb_color")?.data[0].children[0].values;

          setLayerData({
            length: newTable.numRows,
            attributes: {
              getPosition: { value: flatCoordinateArray, size: 2 },
              getTime: { value: newTable.getChild("time")?.data[0].values, size: 1 },
              // getColor: { value: colorAttribute, size: 3 },
            }
          });
          break;
        case "ERROR":
          console.error(payload);
          break;
      }
    };

    workerRef.current.postMessage({
      type: "LOAD_DATA",
      payload: { url: GEOARROW_POINT_DATA },
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      setTimeRange(([start, end]) => {
        const newStart = start + animationSpeed;
        const newEnd = end + animationSpeed;
        return [newStart, newEnd];
      });
    };

    const id = setInterval(animate, 50 * animationSpeed);
    return () => clearInterval(id);
  }, [animationSpeed]);

  useEffect(() => {
    if (!layerData || layerData?.attributes?.getTime.value[layerData.attributes.getTime.value.length - 1] < timeRange[1]) {
      workerRef.current?.postMessage({
        type: "GET_FILTERED_DATA",
        payload: { timeRange, zoom },
      });
    }
  }, [timeRange, zoom]);


  const layer = layerData ? new ScatterplotLayer({
    id: "geoarrow-points",
    data: layerData,
    radiusScale: 1.1,
    radiusMinPixels: 2,
    radiusMaxPixels: 10,
    extensions: [new DataFilterExtension({ filterSize: 1 })],
    getFilterValue: (_, { index, data }) => [data.attributes.getTime.value[index]],
    filterRange: timeRange,
    coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
    pickable: true,
    opacity: 0.8,
    stroked: false,
    filled: true,
    getRadius: 1,
  }) : null;


  const onViewStateChange = useCallback(({ viewState }: any) => {
    const newSpeed = Math.max(0.1, 2 - viewState.zoom * 0.1);
    // setAnimationSpeed(newSpeed);
    setZoom(viewState.zoom);
  }, []);

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={layer ? [layer] : []}
      onViewStateChange={onViewStateChange}
    >
      <StaticMap mapStyle={MAP_STYLE} preventStyleDiffing={true} />
    </DeckGL>
  );
}

const container = document.body.appendChild(document.createElement("div"));
createRoot(container).render(<Root />);
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createRoot } from "react-dom/client";
import { StaticMap } from "react-map-gl";
import DeckGL, { ScatterplotLayer } from "deck.gl";
import { GeoArrowScatterplotLayer } from "@geoarrow/deck.gl-layers";
import * as arrow from "apache-arrow";
import { DataFilterExtension } from "@deck.gl/extensions";

const GEOARROW_POINT_DATA = "http://localhost:8080/data.parquet";

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
  const [filteredTable, setFilteredTable] = useState<arrow.Table | null>(null);
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
          setTimeRange([payload.minTime, payload.minTime + 5]);
          break;
        case "FILTERED_DATA":
            const newTable = arrow.tableFromIPC(payload);
           setFilteredTable(newTable);
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

    const id = setInterval(animate, 250 * animationSpeed);
    return () => clearInterval(id);
  }, [animationSpeed]);

  useEffect(() => {
    workerRef.current?.postMessage({
      type: "GET_FILTERED_DATA",
      payload: { timeRange, zoom },
    });
  }, [timeRange, zoom]);

  const layers = useMemo(() => {
    if (!filteredTable) return [];

    let flatCoordinateArray = filteredTable.getChild("geometry")?.data[0].children[0].values;
    let colorAttribute = filteredTable.getChild("rgb_color")?.data[0].children[0].values;

    let data = ({
        length: filteredTable.numRows,
        // Pregenerated attributes
        attributes: {
          // Flat coordinates array; this is a view onto the Arrow Table's memory and can be copied directly to the GPU
          // Refer to https://deck.gl/docs/developer-guide/performance#supply-binary-blobs-to-the-data-prop
          getPosition: { value: flatCoordinateArray, size: 2 },
          // Flat attributes array
          // Refer to https://deck.gl/docs/developer-guide/performance#supply-attributes-directly
          
        }
      })

    return [
      new ScatterplotLayer({
        id: "geoarrow-points",
        data: data,
        radiusScale: 1.1,
        radiusMinPixels: 2,
        radiusMaxPixels: 10,

        // TODO: Some combination of the web-worker + the GPU based getFilterValue is likely optimal

        extensions: [new DataFilterExtension({ filterSize: 1 })],
        getFilterValue: (_, { index }) =>
          filteredTable.getChild("time")?.at(index),
        
        // getFillColor: (_, { index }) => {
        //     const color = colorAttribute.slice(index * 3, index * 3 + 3);
        //     return [color[0], color[1], color[2], 255];
        // },
        filterRange: timeRange,
        updateTriggers: {
          getFilterValue: [timeRange],
          filterRange: timeRange,
        },
        wrapLongitude: false,
        _normalize: false,
      }),
    ];
  }, [timeRange]);

  const onViewStateChange = useCallback(({ viewState }: any) => {
    const newSpeed = Math.max(0.1, 2 - viewState.zoom * 0.1);
    setAnimationSpeed(newSpeed);
    setZoom(viewState.zoom);
  }, []);

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={layers}
      onViewStateChange={onViewStateChange}
    >
      <StaticMap mapStyle={MAP_STYLE} preventStyleDiffing={true} />
    </DeckGL>
  );
}

const container = document.body.appendChild(document.createElement("div"));
createRoot(container).render(<Root />);

// dataWorker.ts
import * as arrow from "apache-arrow";

let table: arrow.Table | null = null;
let timeColumn: arrow.Vector | null = null;
let lastTimeRange: number[] = [0, 0];

function binarySearch(
  arr: any,
  target: number,
  start: number,
  end: number
): number {
  if (start > end) return start;
  const mid = Math.floor((start + end) / 2);
  const value = arr.at(mid);
  if (value === target) return mid;
  if (value < target) return binarySearch(arr, target, mid + 1, end);
  return binarySearch(arr, target, start, mid - 1);
}

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case "LOAD_DATA":
      const response = await fetch(payload.url);
      const arrayBuffer = await response.arrayBuffer();
      const parquetWasm = await import(
        "https://unpkg.com/parquet-wasm@0.6.0/esm/parquet_wasm.js"
      );
      await parquetWasm.default();
      const { readParquet } = parquetWasm;
      const wasmTable = readParquet(new Uint8Array(arrayBuffer), {
        batchSize: Math.pow(2, 31),
      });
      table = arrow.tableFromIPC(wasmTable.intoIPCStream());
      timeColumn = table.getChild("time");
      self.postMessage({
        type: "DATA_LOADED",
        payload: {
          minTime: timeColumn?.at(0),
          maxTime: timeColumn?.at(timeColumn.length - 1),
        },
      });
      break;

    case "GET_FILTERED_DATA":
      // The goal of this is to load the data in chunks. 
      // Not sure if thats best way to get performance or not
      if (!table || !timeColumn) {
        self.postMessage({ type: "ERROR", payload: "Data not loaded" });
        return;
      }
      const { timeRange, zoom } = payload;
      
      // TODO: Make sure this logic is correct
      timeRange[1] += 120;

      // store the last time range
      // only return data if the time range is 30 sec away from the last time range
      if (
        Math.abs(lastTimeRange[0] - timeRange[0]) < 30 &&
        Math.abs(lastTimeRange[1] - timeRange[1]) < 30
      ) {
        return;
      }

      lastTimeRange = timeRange;

      const startIndex = binarySearch(
        timeColumn,
        timeRange[0],
        0,
        timeColumn.length - 1
      );
      const endIndex = binarySearch(
        timeColumn,
        timeRange[1],
        0,
        timeColumn.length - 1
      );

      const filteredTable = table.slice(startIndex, endIndex);
      const serializedTable = arrow.RecordBatchStreamWriter.writeAll(
        // if i don't do this, I get a BigInt error. No idea why lol
        // Need to use the filteredTable attributes themselves to get the columns
        filteredTable.select(["time", "x", "y", "speed", "geometry", ])
      ).toUint8Array(true);
      self.postMessage({ type: "FILTERED_DATA", payload: serializedTable }, [
        serializedTable.buffer,
      ]);
      break;
  }
};

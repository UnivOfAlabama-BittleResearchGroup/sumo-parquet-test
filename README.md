# Testing the Parquet File Format + SUMO

This repository contains the code to test the Parquet file format with SUMO. It also shows the power of Parquet + DeckGL


## Pre-requisites

- `docker` and `docker-compose` installed
- `sumo` installed (only using the Python tools)
- `python` installed
  - `pandas` and `polars` 
- `duckdb` for quick and dirty Parquet transformations

## GeoParquet-Enabled Replay

The app in `point_webworker` displays the power of using geoparquet as the intermediate format for SUMO.

It reads in the emission output from SUMO and replays the movement of all cars in Tuscaloosa on a second by second basis. 

An example of using it is:

```bash
# Convert parquet to geoparquet (w/ DuckDB)
bash ./scripts/parquet_2_geoparquet.sh ./SUMO_SIM/final_model_20240725/NEMA_tls_micro/emission.parquet ./SUMO_SIM/final_model_20240725/NEMA_tls_micro/emission.geoparquet

export PARQUET_FILE=/Users/max/Development/transcality/parquet-test/SUMO_SIM/final_model_20240725/NEMA_tls_micro/emission.geoparquet


cd docker/webapp
docker compose build
docker compose up

```


## SUMO Parquet vs. XML Speed Test

I wrote a quick script to demo the difference in SUMO -> Intermediate -> Python DataFrame speed using the emissions export when saving the intermediate as `.xml` vs `.parquet`

To run the tests, you must first build the docker images associated with SUMO w and w/o `parquet` (I seperate images to build once at SUMO HEAD and once at SUMO HEAD + Parquet support)

### Build the Docker Images

```bash
cd docker && docker-compose build
```

### Run the Tests

```bash
bash ./scipts/run_sim_docker.sh ./<PATH TO SIM DIR>

i.e.

bash ./scripts/run_sim_docker.sh ./SUMO_SIM/final_model_20240725/default_tls_micro
```

### Results

#### 1 Hour **Microscopic** Simulation of Tuscaloosa (from 3 simulation runs)

| Format | Sim Time (s) | Read Time (s) | Total Time (s) | File Size (MB) |
|--------|--------------|---------------|----------------| ---------------|
| XML    |  393.6       |  127.5        |  521.18        | 1200           |
| Parquet|  363.1       |  0.972        |  364.10        | 336            |



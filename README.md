# Testing the Parquet File Format + SUMO

This repository contains the code to test the Parquet file format with SUMO. It also shows the power of Parquet + DeckGL


## Pre-requisites

- `docker` and `docker-compose` installed
- `sumo` installed (only using the Python tools)
- `python` installed
  - `pandas` and `polars` 
- `duckdb` for quick Parquet transformations



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

#### Max - 1 Hour **Microscopic** Simulation of Tuscaloosa (from 3 simulation runs)

| Format | Sim Time (s) | Read Time (s) | Total Time (s) | File Size (MB) |
|--------|--------------|---------------|----------------| ---------------|
| XML    |  393.6       |  127.5        |  521.18        | 1200           |
| Parquet|  363.1       |  0.972        |  364.10        | 336            |

#### Josh - 1 Hour **Microscopic** Simulation of Tuscaloosa (from 3 simulation runs)

| Format | Sim Time (s) | Read Time (s) | Total Time (s) | File Size (MB) |
|--------|--------------|---------------|----------------| ---------------|
| XML    |  263.4       |  88.98        |  353.35        | 797            |
| Parquet|  216.9       |  0.415        |  217.33        | 318            |


## GeoParquet-Enabled Replay


https://github.com/user-attachments/assets/15a98604-6180-4b2c-b7e7-9833012e7f74


The app in `point_webworker` displays the power of using geoparquet as the intermediate format for SUMO.

It reads in the emission output from SUMO and replays the movement of all cars in Tuscaloosa on a second by second basis. 

An example of using it is:

```bash
# Convert parquet to geoparquet (w/ DuckDB)
bash ./scripts/parquet_2_geoparquet.sh ./SUMO_SIM/final_model_20240725/NEMA_tls_micro/emission.parquet ./SUMO_SIM/final_model_20240725/NEMA_tls_micro/emissions-geoparquet

# set this to a path to a geoparquet file (this can be generated from the above script)
export PARQUET_FILE="./SUMO_SIM/final_model_20240725/NEMA_tls_micro/emissions-geoparquet/time_group=2/data_0.parquet"
# set this to the path to the webworker app
export APP_DIR="./point_webworker" 

cd docker/webapp

# the docker compose I setup for this is annoying. Excuse my --no-cache
docker compose build --no-cache && docker compose up

```


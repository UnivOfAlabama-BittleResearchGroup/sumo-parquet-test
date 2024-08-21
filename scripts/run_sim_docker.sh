#!/bin/bash

# Check if a directory is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_simulation_directory>"
    exit 1
fi

# Get the absolute path of the provided directory
SIM_DIR=$(realpath "$1")

# Check if the directory exists
if [ ! -d "$SIM_DIR" ]; then
    echo "Error: Directory $SIM_DIR does not exist."
    exit 1
fi

# Check if sumo.sumocfg exists in the directory
if [ ! -f "$SIM_DIR/sumo.sumocfg" ]; then
    echo "Error: sumo.sumocfg not found in $SIM_DIR"
    exit 1
fi

# Run the SUMO simulation 5 times and time each run
echo "Parquet SUMO:"
for i in {1..3}; do
    echo "Run $i:"
    time docker run --rm -v "$SIM_DIR:/sim" parquet-image:latest sumo -c /sim/sumo.sumocfg --emission-output /sim/emission.parquet --emission-output.attributes="id,fuel,x,y,speed" --end=21600 --seed="${i}000"
    echo "------------------------------"
    exit 1
done

# run vanilla sumo
echo "Vanilla SUMO:"
for i in {1..3}; do
    echo "Run $i:"
    time docker run --rm -v "$SIM_DIR:/sim" parquet-image:latest sumo -c /sim/sumo.sumocfg --emission-output /sim/emission.xml --emission-output.attributes="id,fuel,x,y,speed" --end=21600 --seed="${i}000"
    echo "------------------------------"
done

# time the conversion to a polars table
echo "Conversion to pandas table:"
for i in {1..3}; do
    echo "Run $i:"
    time python -c "import polars as pl; pl.read_parquet('$SIM_DIR/emission.parquet')"
    echo "------------------------------"
done

# time the conversion to a polars table for the vanilla sumo output
echo "Conversion to pandas table (vanilla SUMO):"
for i in {1..3}; do
    echo "Run $i:"
    # convert xml to csv using the the sumo tool (this assumes that SUMO is also installed locally)
    time python $SUMO_HOME/tools/xml/xml2csv.py $SIM_DIR/emission.xml -o $SIM_DIR/emission.csv
    time python -c "import polars as pl; pl.read_csv('$SIM_DIR/emission.csv')"
    echo "------------------------------"
done









#!/bin/bash
# entrypoint.sh

# Check if both arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: docker run -v /path/to/local/dir:/app/src -v /path/to/parquet/file.parquet:/app/data.parquet image_name /path/to/src /app/data.parquet"
    exit 1
fi

SRC_DIR=$1
PARQUET_FILE=$2

# Check if the source directory exists
if [ ! -d "$SRC_DIR" ]; then
    echo "Error: Source directory $SRC_DIR does not exist"
    exit 1
fi

# Check if the Parquet file exists
if [ ! -f "$PARQUET_FILE" ]; then
    echo "Error: Parquet file $PARQUET_FILE does not exist"
    exit 1
fi

# Copy the contents of the source directory
cp -r $SRC_DIR/* /app/

# Install dependencies
cd /app
yarn install

# compile the react app
yarn build && cp /app/data.parquet /app/dist/data.parquet

# Start http-server in the background
cd dist &&  npx http-server --cors -p 8080



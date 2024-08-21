#!/bin/bash
set -x

# Check if input and output file paths are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <input_parquet_file> <output_geoparquet_file>"
    exit 1
fi

INPUT_FILE=$1
OUTPUT_FILE=$2

# Create a temporary SQL file
TMP_SQL=$(mktemp)

# Write the SQL commands to the temporary file
# cat << EOF > $TMP_SQL
# -- Load the spatial extension
# INSTALL spatial;
# LOAD spatial;

# -- Create a table from the Parquet file
# CREATE TABLE input_data AS SELECT * FROM parquet_scan('$INPUT_FILE');

# -- Create a new table with a geometry column
# CREATE TABLE geoparquet_data AS
# SELECT 
#     *,
#     ST_Point(x, y) AS geometry
# FROM input_data;

# -- Write the new table to a GeoParquet file
# COPY (
#     SELECT *  FROM geoparquet_data
# ) TO "$OUTPUT_FILE" (FORMAT 'PARQUET');
# EOF

cat << EOF > $TMP_SQL
CREATE TABLE input_data AS SELECT * FROM parquet_scan('$INPUT_FILE');

CREATE TABLE geoparquet_data AS
SELECT *
EXCLUDE 
    time,
    [x, y] AS geometry,
    CAST(time AS DOUBLE) AS time,
FROM input_data;

COPY (
    SELECT * FROM geoparquet_data
) TO "$OUTPUT_FILE" (FORMAT 'PARQUET', ROW_GROUP_SIZE 100_000);
EOF

# Run the SQL commands using DuckDB
duckdb < $TMP_SQL

# Remove the temporary SQL file
rm $TMP_SQL

# identify if we have gpq installed
# if ! command -v gpq &> /dev/null
# then
#     echo "gpq could not be found. Please install it using 'brew install planetlabs/tap/gpq'."
#     exit 1
# fi

# gpq convert tmp.parquet $OUTPUT_FILE --input-primary-column geometry

echo "Conversion complete. Output file: $OUTPUT_FILE"
# Use the base image we created earlier
FROM base-image:latest

# Set the working directory
WORKDIR /app

ENV GIT_SSL_NO_VERIFY=1

RUN apk add apache-arrow-dev

# Download the specific SUMO repository and branch zip file
RUN wget https://github.com/mschrader15/sumo/archive/refs/heads/parquet-debug.zip -O sumo.zip

# Unzip the downloaded file
RUN unzip sumo.zip && mv sumo-parquet-debug sumo && rm sumo.zip

# Change to the SUMO directory
WORKDIR /app/sumo
# Create a build directory and change to it, building minimal SUMO
RUN mkdir build && cd build && cmake -DWITH_PARQUET=ON -DCMAKE_C_COMPILER=/usr/bin/gcc -DCMAKE_CXX_COMPILER=/usr/bin/g++ .. && make -j4 sumo

# The entry point can be set to bash or a specific SUMO command
CMD ["/bin/bash"]
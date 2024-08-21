# Use the base image we created earlier
FROM base-image:latest

# Change to the SUMO directory
WORKDIR /app

# Clone the SUMO repository (parquet branch) using HTTPS
RUN wget https://github.com/eclipse-sumo/sumo/archive/refs/heads/main.zip -O sumo.zip
# Unzip the downloaded file
RUN unzip sumo.zip && mv sumo-main sumo && rm sumo.zip

WORKDIR /app/sumo
RUN mkdir build && cd build && cmake -DWITH_PARQUET=OFF -DCMAKE_C_COMPILER=/usr/bin/gcc -DCMAKE_CXX_COMPILER=/usr/bin/g++ .. && make -j6 sumo


CMD ["/bin/bash"]
#!/bin/bash

cd ..
mvn clean install -Pserver-fts

cd rest-server
java -jar target/rest-server.jar server config_demo.yml

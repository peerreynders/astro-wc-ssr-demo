#!/bin/bash
curl -X POST -b cookies.txt -F 'title=New Todo' http://localhost:4321/api/todos


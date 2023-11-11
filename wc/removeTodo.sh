#!/bin/bash
curl -i -X POST -b cookies.txt -F 'intent=remove' http://localhost:4321/api/todos/bdb592b7-2462-4875-bfd5-c6dbeeae9991


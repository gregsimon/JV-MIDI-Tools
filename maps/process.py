#!/bin/python

import sys
import json

with open(sys.argv[1], 'r') as f:
    x = f.readlines()

for line in x:
	line = line.strip('\n')
	line = line.strip('\t')
	line2 = line.split(":", 1)
	line2[0] = int(line2[0])
	line2 = json.dumps(line2)

	print(line2)
	# print json.dumps(line)



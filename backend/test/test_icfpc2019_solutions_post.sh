#!/bin/bash
set -xe
cd $(dirname $0)
WORK=$(mktemp -d $(pwd)/work/tmp.XXXXXX)
curl -v -X POST 'http://localhost:8000/api/v1/icfpc2019/solutions?task_id=1&solver=test' -F "file=@solution.txt;type=text/plain" | tee $WORK/response.json
FILE=$(jq --raw-output .file $WORK/response.json)
curl -L "http://localhost:8000/storage/$FILE" > $WORK/solution.out.txt
diff solution.txt $WORK/solution.out.txt
echo TEST PASSED
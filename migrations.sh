#!/bin/bash

set -e

FILE_NAME="${FILE_NAME:-01_initial_files}"
WORKSPACE_NAME="${WORKSPACE_NAME:-default}"
ADMIN_URL="${ADMIN_URL:-http://localhost:8001}"

ADMIN_URL=$ADMIN_URL portal wipe $WORKSPACE_NAME
ADMIN_URL=$ADMIN_URL portal deploy $WORKSPACE_NAME

curl "$ADMIN_URL/$WORKSPACE_NAME/files" -o "$FILE_NAME.json"

lua json_to_table.lua $FILE_NAME

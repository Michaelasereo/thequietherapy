#!/bin/bash

# This script will do a comprehensive rename from patient to client
# It's safer than manual find/replace

echo "Starting patient -> client rename process..."

# Step 1: Rename files and directories
echo "Step 1: Renaming files and directories..."

# Rename directories
find . -type d -name "*patient*" | while read dir; do
  newdir=$(echo "$dir" | sed 's/patient/client/g')
  if [ "$dir" != "$newdir" ]; then
    echo "Renaming directory: $dir -> $newdir"
    mv "$dir" "$newdir" 2>/dev/null || true
  fi
done

# Rename files
find . -type f -name "*patient*" | while read file; do
  newfile=$(echo "$file" | sed 's/patient/client/g')
  if [ "$file" != "$newfile" ]; then
    echo "Renaming file: $file -> $newfile"
    mv "$file" "$newfile" 2>/dev/null || true
  fi
done

echo "Step 1 complete!"

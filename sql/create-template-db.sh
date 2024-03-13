#!/bin/bash -e
pushd "$(dirname "$0")" || exit

theDbPath="clear-aligner-template.sqlite"

if [[ "$*" == *'-h'* || "$*" == *'--help'* ]]; then
  echo "Usage: ${0} [-h|--help] [--no-remove]"
  exit 0
elif [[ -f "${theDbPath}" && "$*" == *'--no-remove'* ]]; then
  echo "Template database already exists: '${theDbPath}' (not recreating)."
  exit 0
fi

echo "Creating template database: '${theDbPath}'..."

rm -fv "${theDbPath}"
python3 ./create-template-db.py

echo "...Template database created: '${theDbPath}'."
popd

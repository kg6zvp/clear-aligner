#!/bin/bash -e
pushd "$(dirname "$0")" || exit

theDbFile="clear-aligner-template.sqlite"
theDbPath=$(realpath "${theDbFile}")

if [[ "$*" == *'-h'* || "$*" == *'--help'* ]]; then
  echo "Usage: ${0} [-h|--help] [--no-remove]"
  exit 0
elif [[ -f "${theDbFile}" && "$*" == *'--no-remove'* ]]; then
  echo "Template database already exists: '${theDbPath}' (not recreating)."
  exit 0
fi

echo "Creating template database: '${theDbPath}'..."

rm -fv "${theDbPath}"
python3 ./create-template-db.py

echo "...Template database created: '${theDbPath}'."
popd

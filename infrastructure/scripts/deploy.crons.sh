#!/bin/bash
set -e
ENV=${1:-stg}

echo "Build du cron..."
cd code/crons
npm run build
npm run zip

echo "Deploy sur Lambda ($ENV)..."
aws lambda update-function-code \
  --function-name serverless-projet-cron-backup-$ENV \
  --zip-file fileb://backup.zip \
  --region eu-west-3

echo "Cron déployé !"
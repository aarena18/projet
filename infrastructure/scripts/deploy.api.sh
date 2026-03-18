#!/bin/bash
set -e
ENV=${1:-stg}

echo "Build de l'API..."
cd code/api/my-app
npm run build
npm run zip

echo "Deploy sur Lambda ($ENV)..."
aws lambda update-function-code \
  --function-name serverless-projet-api-$ENV \
  --zip-file fileb://lambda.zip \
  --region eu-west-3

echo "Deploy terminé !"
#!/bin/bash
set -e
ENV=${1:-stg}
FRONT=${2:-user}

if [ "$FRONT" = "user" ]; then
  BUCKET="serverless-projet-www-user-$ENV"
  CF_ID="E2ZO4QXW2I9QE7"
  DIR="code/serverless_projet_user"
elif [ "$FRONT" = "admin" ]; then
  BUCKET="serverless-projet-www-admin-$ENV"
  CF_ID="E25G9K1GCALBN6"
  DIR="code/serverless_projet_admin"
fi

echo "Build du front $FRONT..."
cd $DIR
npm run build
cd -

echo "Upload sur S3 ($BUCKET)..."
aws s3 sync $DIR/dist/ s3://$BUCKET --delete --region eu-west-3

echo "Invalidation CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id $CF_ID \
  --paths "/*"

echo "Deploy terminé ! https://$(aws cloudfront get-distribution --id $CF_ID --query 'Distribution.DomainName' --output text)"
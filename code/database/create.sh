#!/bin/bash
set -e

# Charge le fichier d'env selon l'environnement passé en argument
ENV=${1:-stg}

if [ "$ENV" = "stg" ]; then
  export $(cat environments/stg/.env.stg.deploy | grep -v '#' | xargs)
elif [ "$ENV" = "prd" ]; then
  export $(cat environments/prd/.env.prd.deploy | grep -v '#' | xargs)
fi

echo "Migration pour l'env : $ENV"
echo "Host : $DB_HOST"

for file in $(ls code/database/migration/*.sql | sort); do
  echo "  -> $file"
  psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME?sslmode=require" -f "$file"
done

echo "Migrations terminées !"
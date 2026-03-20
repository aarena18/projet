import boto3
import subprocess
import sys
import os
from pathlib import Path

def deploy_react(app_name, env):
    project_dir = Path(os.environ.get('CI_PROJECT_DIR', '.'))
    
    # Map app name vers dossier
    app_dirs = {
        'www-user': 'serverless_projet_user',
        'www-admin': 'serverless_projet_admin'
    }
    
    app_dir = project_dir / 'code' / app_dirs[app_name]
    bucket = f"serverless-projet-{app_name}-{env}"
    
    cf_ids = {
        'www-user-stg': 'E2ZO4QXW2I9QE7',
        'www-admin-stg': 'E25G9K1GCALBN6',
        'www-user-prd': 'CF_USER_PRD_ID',
        'www-admin-prd': 'CF_ADMIN_PRD_ID'
    }
    cf_id = cf_ids.get(f"{app_name}-{env}")
    
    print(f"Build de {app_name} pour {env}...")
    subprocess.run(['npm', 'ci'], cwd=app_dir, check=True)
    subprocess.run(['npm', 'run', 'build'], cwd=app_dir, check=True)
    
    print(f"Upload sur S3 {bucket}...")
    subprocess.run([
        'aws', 's3', 'sync',
        str(app_dir / 'dist') + '/',
        f's3://{bucket}',
        '--delete',
        '--region', 'eu-west-3'
    ], check=True)
    
    if cf_id and not cf_id.startswith('CF_'):
        print(f"Invalidation CloudFront {cf_id}...")
        subprocess.run([
            'aws', 'cloudfront', 'create-invalidation',
            '--distribution-id', cf_id,
            '--paths', '/*'
        ], check=True)
    
    print(f"Deploy {app_name} {env} terminé !")

if __name__ == '__main__':
    app_name = sys.argv[1]
    env = sys.argv[2]
    deploy_react(app_name, env)
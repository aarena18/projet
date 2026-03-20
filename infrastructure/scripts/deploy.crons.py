import subprocess
import sys
import os
from pathlib import Path

def deploy_cron(env):
    project_dir = Path(os.environ.get('CI_PROJECT_DIR', '.'))
    zip_path = project_dir / 'code' / 'crons' / 'backup.zip'
    
    print(f"Deploy Cron sur Lambda {env}...")
    subprocess.run([
        'aws', 'lambda', 'update-function-code',
        '--function-name', f'serverless-projet-cron-backup-{env}',
        '--zip-file', f'fileb://{zip_path}',
        '--region', 'eu-west-3'
    ], check=True)
    
    print(f"Deploy Cron {env} terminé !")

if __name__ == '__main__':
    env = sys.argv[1]
    deploy_cron(env)
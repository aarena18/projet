import subprocess
import sys
import os
from pathlib import Path

def deploy_api(env):
    project_dir = Path(os.environ.get('CI_PROJECT_DIR', '.'))
    zip_path = project_dir / 'code' / 'api' / 'my-app' / 'lambda.zip'
    
    print(f"Deploy API sur Lambda {env}...")
    subprocess.run([
        'aws', 'lambda', 'update-function-code',
        '--function-name', f'serverless-projet-api-{env}',
        '--zip-file', f'fileb://{zip_path}',
        '--region', 'eu-west-3'
    ], check=True)
    
    print(f"Deploy API {env} terminé !")

if __name__ == '__main__':
    env = sys.argv[1]
    deploy_api(env)
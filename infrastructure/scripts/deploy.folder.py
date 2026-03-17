import os
import sys
import json
import boto3
import mimetypes

FOLDERS = ["assets"]
folder = sys.argv[1]

if folder not in FOLDERS:
    print(f"Invalid folder: {folder}")
    exit(-1)

home_repo = os.getcwd()
home_code = f"{home_repo}/code"
home_env = f"{home_repo}/environments/stg"

with open(f"{home_env}/deploy.stg.json", "r") as config_file:
    config = json.load(config_file)

try:
    import dotenv

    dotenv.load_dotenv(f"{home_env}/.env.stg.deploy")
    print(f"loaded .env file")
except:
    print(f"No .env file found")


def upload_to_s3(bucket, folder):
    print(f"deploy {folder} to s3")
    try:
        client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
        )

        for root, dirs, files in os.walk(folder):
            for filename in files:
                try:
                    extension = os.path.splitext(filename)[-1]
                    content_type = mimetypes.types_map[extension]
                except Exception:
                    content_type = "text/plain"

                local_path = os.path.join(root, filename)
                relative_path = os.path.relpath(local_path, folder)
                client.upload_file(
                    local_path,
                    bucket,
                    relative_path,
                    ExtraArgs={"ContentType": content_type, "ACL": "public-read"},
                )

        print(f"Folder uploader to s3")
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        exit(-1)


upload_to_s3(f'{config["APP_NAME"]}-{folder}', f"{home_code}/{folder}")

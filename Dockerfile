FROM python:3.8

RUN apt-get update -y && pip3 install boto3 python-dotenv && apt-get install npm -y && npm install -g eslint

WORKDIR /app

COPY . /app

CMD ["tail", "-f", "/dev/null"]



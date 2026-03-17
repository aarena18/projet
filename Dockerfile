FROM node:18-alpine

RUN apt-get update -y && pip3 install boto3 python-dotenv && apt-get install npm -y && npm install --stg

WORKDIR /code

COPY package*.json ./

EXPOSE 3000

CMD ["node", "index.js"]



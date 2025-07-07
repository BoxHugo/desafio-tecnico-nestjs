<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


# Gerenciador de Usuários (API)

## Descrição

Uma API RESTful desenvolvida para o desafio técnico (Teste para Programador Backend Sênior). O objetivo dessa api é o gerenciamento de usuários.

## Tecnologias

<ul>
  <li>
    <a href="https://nodejs.org/">
      <img src="https://cdn.svgporn.com/logos/nodejs-icon.svg" alt="Node" width="20">
      Node 20.18.2 or higher
    </a>
  </li>
  <li>
    <a href="https://www.typescriptlang.org/">
      <img src="https://cdn.svgporn.com/logos/typescript-icon.svg" alt="TypeScript" width="20">
      TypeScript
    </a>
  </li>
  <li>
    <a href="https://nestjs.com/">
      <img src="https://cdn.svgporn.com/logos/nestjs.svg" alt="Nest" width="20">
      Nest
    </a>
  </li>
  <li>
    <a href="https://docs.docker.com/">
      <img src="https://cdn.svgporn.com/logos/docker-icon.svg" alt="Docker" width="20">
      Docker
    </a>
  </li>
  <li>
    <a href="https://jestjs.io">
      <img src="https://cdn.svgporn.com/logos/jest.svg" alt="Jest" width="20">
      Jest
    </a>
  </li>
  <li>
    <a href="https://eslint.org/docs/latest/">
      <img src="https://cdn.svgporn.com/logos/eslint.svg" alt="Eslint" width="20">
      Eslint
    </a>
  </li>
  <li>
    <a href="https://prettier.io/docs/en/options.html">
      <img src="https://cdn.svgporn.com/logos/prettier.svg" alt="Prettier" width="20">
      Prettier
    </a>
  </li>
  <li>
  <a href="https://mongoosejs.com/">
    <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mongoose.svg" alt="Mongoose" width="20">
    Mongoose
  </a>
</li>

</ul>

## Premissas

- NodeJs instalado (v20.18.2);
- docker engine;
- Nest cli;


## Setup inicial


### Baixe o projeto do git


```

$ git clone git@github.com:BoxHugo/desafio-tecnico-nestjs.git

$ cd desafio-tecnico-nestjs

```

### Instale as dependências do nodejs

```bash

$ npm install -g @nestjs/cli

$ npm install

```

### Baixe a imagem do docker com o MongoDB

```bash

$ docker run -d --name mongo-dev -p 27017:27017 -v mongo_data:/data/db mongo:6.0


```

## Execução Local

```bash

$ docker-compose up -d mongo

$ npm run start

```

## Execução Container

```bash

$ docker-compose down

$ docker-compose up -d --build

```


## Executa Testes


### Testes unitários

```bash

$ npm run test

```

### Testes de integração

```bash

$ npm run test:e2e

```

## Deploy AWS

#### Premissas

- *AWS CLI* instalada e configurada (`aws configure`).  
- *Conta AWS* com permissões para ECR, ECS e IAM.  
- *Docker* instalado na máquina local.  

#### Criar repositório no ECR

```bash
# Defina sua região e nome de repositório
export AWS_REGION=us-east-1
export ECR_REPO=api-user-manager

# Cria repositório (se ainda não existir)
aws ecr create-repository \
  --repository-name $ECR_REPO \
  --region $AWS_REGION
```

#### Fazer login no ECR e enviar a imagem

```
# Faça login no ECR (Docker)
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS \
                --password-stdin 123456789012.dkr.ecr.$AWS_REGION.amazonaws.com

# Construa e marque a imagem
docker build -t $ECR_REPO .
docker tag $ECR_REPO:latest 123456789012.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Envie para o ECR
docker push 123456789012.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

```

#### Criar cluster ECS

```
aws ecs create-cluster \
  --cluster-name api-user-manager-cluster \
  --region $AWS_REGION
```

#### Definir Task Definition (Fargate)

##### Crie um arquivo ecs-task-def.json:

```
{
  "family": "api-user-manager-task",
  "cpu": "256",
  "memory": "512",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/api-user-manager:latest",
      "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
      "environment": [
        { "name": "MONGO_URI", "value": "mongodb://mongo:27017/appdb" },
        { "name": "JWT_SECRET", "value": "seuSegredoMuitoSeguro" },
        { "name": "JWT_EXPIRES_IN", "value": "3600s" }
      ]
    }
  ]
}

```

##### Registre no ECS:

```
aws ecs register-task-definition \
  --region $AWS_REGION \
  --cli-input-json file://ecs-task-def.json

```


#### Criar Service no ECS

```
aws ecs create-service \
  --cluster api-user-manager-cluster \
  --service-name api-user-manager-service \
  --task-definition api-user-manager-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-abc123],securityGroups=[sg-abc123],assignPublicIp=ENABLED}" \
  --region $AWS_REGION

```

- Substitua subnet-abc123 e sg-abc123 pelos IDs da sua VPC.

- Faça o mesmo processo para o outro container.


## Endpoints

```mermaid
flowchart LR
  User((Usuário))
  Create((Criar Usuário))
  Login((Login))
  Logout((Logout))
  ListAll((Listar Usuários))
  GetById((Buscar Usuário))
  Update((Atualizar Usuário))
  Delete((Deletar Usuário))

  User --> Create

  User --> Login

  Login --> ListAll

  Login --> GetById

  Login --> Update

  Login --> Delete

  Login --> Logout


```

### [POST] - /v1/auth/login

Endpoint responsável por realizar o login do usuário caso ele já seja cadastrado.

```mermaid
sequenceDiagram
    participant Client
    participant AuthCtrl as AuthController
    participant AuthS as AuthService
    participant Repo as UserRepository
    participant JWT as JwtService

    Client->>AuthCtrl: POST /v1/auth/login {email, password}
    AuthCtrl->>JWT: sign({ sub, email })
    AuthCtrl->>AuthS: login(dto)
    AuthS->>Repo: findByEmail(email)
    Repo-->>AuthS: User
    AuthS->>AuthS: argon2.verify(hash, password)
    AuthS-->>AuthCtrl: user
    JWT-->>AuthCtrl: token
    AuthCtrl-->>Client: 201 { access_token: token }

```


#### cURL

```
curl --location 'http://localhost:3000/v1/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "email@claro.com.br",
    "password": "@senha123"
}'
```


#### Exemplo de Retorno - status code 201

```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNzFlZTk0Ny1jMGY4LTQ3OTUtYTMzZC1kYjMyMTBlY2UxYWIiLCJlbWFpbCI6ImZyYW5jaXNjby5yb3NhQGNsYXJvLmNvbS5iciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUxODM3NDk2LCJleHAiOjE3NTE4NDEwOTZ9.3sDYOsRdEsQpEE50zPKXCZsqhv81VT9GlW7R8w_hOOk"
}
```

### [POST] - /v1/auth/logout

Endpoint responsável por realizar o logout do usuário caso ele já esteja logado.

```mermaid
sequenceDiagram
    participant Client
    participant AuthCtrl as AuthController
    participant Blacklist as TokenBlacklistService

    Client->>AuthCtrl: POST /v1/auth/logout
    AuthCtrl->>Blacklist: revoke(token)
    AuthCtrl-->>Client: 200 { message: "Logout successful" }
```

#### cURL

```
curl --location --request POST 'http://localhost:3000/v1/auth/logout' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNzFlZTk0Ny1jMGY4LTQ3OTUtYTMzZC1kYjMyMTBlY2UxYWIiLCJlbWFpbCI6ImZyYW5jaXNjby5yb3NhQGNsYXJvLmNvbS5iciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUxODM3NDk2LCJleHAiOjE3NTE4NDEwOTZ9.3sDYOsRdEsQpEE50zPKXCZsqhv81VT9GlW7R8w_hOOk'
```

#### exemplo de retorno - status code 200

```json
{
    "message": "Logout successful"
}
```





### [POST] - /v1/users

Endpoint responsável por criar usuários. Não necessita estar logado. Sempre cria o usuario com a role **user**.

```mermaid
sequenceDiagram
    participant Client
    participant UsersCtrl as UsersController
    participant UsersS as UsersService
    participant Repo as UserRepository

    Client->>UsersCtrl: POST /v1/users {email, password}
    UsersCtrl->>UsersS: create(dto)
    UsersS->>UsersS: argon2.hash(password)
    UsersS->>Repo: create(new User)
    Repo-->>UsersS: createdUser
    UsersS-->>UsersCtrl: {userId, email, role}
    UsersCtrl-->>Client: 201 {userId, email, role}
```


#### cURL

```
curl --location 'http://localhost:3000/v1/users' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "teste@claro.com.br",
    "password": "Claro@10"
}'
```

#### exemplo de retorno - status code 201

```json
{
    "userId": "071ee947-c0f8-4795-a33d-db3210ece1ab",
    "email": "teste@claro.com.br",
    "role": "user"
}
```



### [GET] - /v1/users

Endpoint responsável por listar todos os usuários do banco de dados. Necessário estar logado.

```mermaid
sequenceDiagram
    participant Client
    participant UsersCtrl as UsersController
    participant UsersS as UsersService
    participant Repo as UserRepository

    Client->>UsersCtrl: GET /v1/users?page=X&limit=Y
    UsersCtrl->>UsersS: findAll(page, limit)
    UsersS->>Repo: findAll({page, limit})
    Repo-->>UsersS: {items, total, page, limit, ...}
    UsersS-->>UsersCtrl: PaginationResult
    UsersCtrl-->>Client: 200 PaginationResponse

```

#### cURL

Primeira busca

```
curl --location 'http://localhost:3000/v1/users' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWJkNGY5Ny02M2NkLTRjOTEtYWQ4Ni03NjZlOGJkMWRlZTciLCJlbWFpbCI6ImZyYW5jaXNjby5yb3NhQGNsYXJvLmNvbS5iciIsImlhdCI6MTc1MTgwNjcwOCwiZXhwIjoxNzUxODEwMzA4fQ.ULnLaLrlN33bDO4SjoJPPP2Pih6_i6J_-8ebWNPae-U'
```

Próxima busca com a paginação

```
curl --location 'http://localhost:3000/v1/users?page=2' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWJkNGY5Ny02M2NkLTRjOTEtYWQ4Ni03NjZlOGJkMWRlZTciLCJlbWFpbCI6ImZyYW5jaXNjby5yb3NhQGNsYXJvLmNvbS5iciIsImlhdCI6MTc1MTc1ODkxMCwiZXhwIjoxNzUxNzYyNTEwfQ.4THKIl0qy01wXXU5mtDZH6o3MSgqVJZJwYpsAm-a3zE'
```

#### exemplo de retorno - status code 200

```json
{
    "items": [
        {
            "userId": "12345678-abcd-z9x8-9999-a1b2c3d4e5f6",
            "email": "admin@admin.com",
            "role": "admin"
        },
        {
            "userId": "5c65ab35-00b8-4242-b8ea-bc5474e6b71a",
            "email": "m.rosa@gmail.com",
            "role": "user"
        },
        {
            "userId": "08958db8-d011-4da5-8152-5cb2e2ed86e2",
            "email": "gbox@gmail.com",
            "role": "user"
        },
        {
            "userId": "20b3d45a-edc0-4b91-aef3-db64ff0b4fba",
            "email": "hello_world@aws.com",
            "role": "user"
        },
        {
            "userId": "9dcb3ced-296a-41f7-a589-744f12e81742",
            "email": "trevor123@ig.com.us",
            "role": "user"
        },
        {
            "userId": "5db752ca-4d5f-483a-b911-1cc681f917d0",
            "email": "officce@bol.com.br",
            "role": "user"
        },
        {
            "userId": "8007d4d6-640c-4a76-9feb-409aef3612b9",
            "email": "deus.j.zinho@yahoo.com.br",
            "role": "user"
        },
        {
            "userId": "22b07994-8dfc-406a-ac95-a2f07006c03a",
            "email": "r.nata@hotmail.com.br",
            "role": "user"
        },
        {
            "userId": "d6c11f85-7311-429e-bd85-ab5d99ec9c39",
            "email": "goku@dragonball.com",
            "role": "user"
        },
        {
            "userId": "ed96ce7a-480a-49ed-bf8c-9ad39f3d4d92",
            "email": "naruto@gmail.com",
            "role": "user"
        }
    ],
    "total": 14,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNextPage": true,
    "nextPage": 2,
    "hasPrevPage": false,
    "prevPage": null

```



### [GET] - /v1/users/${userId}

Endpoint responsável por buscar um usuário por userId. Necessário estar logado.

```mermaid
sequenceDiagram
    participant Client
    participant UsersCtrl as UsersController
    participant UsersS as UsersService
    participant Repo as UserRepository

    Client->>UsersCtrl: GET /v1/users/:id
    UsersCtrl->>UsersS: findByUserId(id)
    UsersS->>Repo: findByUserId(id)
    Repo-->>UsersS: userRecord
    UsersS-->>UsersCtrl: {userId, email, role}
    UsersCtrl-->>Client: 200 {userId, email, role}

```

#### cURL

```
curl --location 'http://localhost:3000/v1/users/bedf6db1-7e4a-46a1-9664-7ba61c843f86' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZWRmNmRiMS03ZTRhLTQ2YTEtOTY2NC03YmE2MWM4NDNmODYiLCJlbWFpbCI6InRlc3RfdXNlckBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTE4MTgyOTIsImV4cCI6MTc1MTgyMTg5Mn0.NZDj0aDoSxiembSyGrUd6cIJKgX1xvHUc9s3gTxY-BY'
```

#### exemplo de retorno - status code 200

```json
{
    "userId": "bedf6db1-7e4a-46a1-9664-7ba61c843f86",
    "email": "goku@dragonball.com",
    "role": "user"
}
```


### [PATCH] - /v1/users/${userId}

Endpoint responsável por atualizar o usuário. Necessário estar logado.

O parametro userId é do solicitante. Se o usuário tiver o perfil 'user', ele só pode atualizar a si mesmo, no caso a senha, e não pode alterar a própria role e nem email.

Se o usuário tiver o perfil 'admin', ele pode atualizar a si mesmo e outros usuários. No caso a role e senha. A chave 'targetId' no body indica o usuário a ser atualizado.

```mermaid
sequenceDiagram
    participant Client
    participant UsersCtrl as UsersController
    participant UsersS as UsersService
    participant Repo as UserRepository
    participant Argon as argon2

    Client->>UsersCtrl: PATCH /v1/users/:id {targetId, ...fields}
    UsersCtrl->>UsersS: update(ownerId, dto)
    UsersS->>Repo: findByUserId(ownerId)
    Repo-->>UsersS: ownerRecord
    UsersS->>Repo: findByUserId(targetId)
    Repo-->>UsersS: targetRecord
    alt password mudou
      UsersS->>Argon: hash(newPassword)
      Argon-->>UsersS: hashedPwd
    end
    UsersS->>Repo: update(targetId, allowedFields)
    Repo-->>UsersS: updatedUser
    UsersS-->>UsersCtrl: {userId, email, role}
    UsersCtrl-->>Client: 200 {userId, email, role}

```


#### cURL
```
curl --location --request PATCH 'http://localhost:3000/v1/users/81bd4f97-63cd-4c91-ad86-766e8bd1dee7' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC1hYmNkLXo5eDgtOTk5OS1hMWIyYzNkNGU1ZjYiLCJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MTgxNTcwOCwiZXhwIjoxNzUxODE5MzA4fQ.7fKHgu1rYICD4fAsimU9_5dalNFgHYA0qpzYjWTzWjY' \
--header 'Content-Type: application/json' \
--data-raw '{
    "targetId": "81bd4f97-63cd-4c91-ad86-766e8bd1dee7",
    "password": "Claro@1",
    "role": "admin"
}'
```

#### exemplo de retorno - status code 200

```json
{
    "userId": "81bd4f97-63cd-4c91-ad86-766e8bd1dee7",
    "email": "teste@claro.com.br",
    "role": "admin"
}
```


### [DELETE] - /v1/users/${userId}

Endpoint responsável por excluir usuários. Usuários com perfil 'user' podem deletar a si mesmos. Usuários com perfil 'admin', podem excluir a si e outros usuários.


```mermaid
sequenceDiagram
    participant Client
    participant UsersCtrl as UsersController
    participant UsersS as UsersService
    participant Repo as UserRepository

    Client->>UsersCtrl: DELETE /v1/users/:id {targetId}
    UsersCtrl->>UsersS: remove(ownerId, dto)
    UsersS->>Repo: findByUserId(ownerId)
    Repo-->>UsersS: ownerRecord
    UsersS->>Repo: findByUserId(targetId)
    Repo-->>UsersS: targetRecord
    UsersS->>Repo: delete(targetId)
    Repo-->>UsersS: (void)
    UsersS-->>UsersCtrl: (void)
    UsersCtrl-->>Client: 204 No Content
```

#### cURL

```
curl --location --request DELETE 'http://localhost:3000/v1/users/bedf6db1-7e4a-46a1-9664-7ba61c843f86' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC1hYmNkLXo5eDgtOTk5OS1hMWIyYzNkNGU1ZjYiLCJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MTgxODE5NCwiZXhwIjoxNzUxODIxNzk0fQ.brgIqY_jrikDbzYD2NnuWC4MFgzZ6m7zTeXm-m7APP4' \
--header 'Content-Type: application/json' \
--data '{
    "targetId": "bedf6db1-7e4a-46a1-9664-7ba61c843f86"
}'
```

#### exemplo de retorno - status code 204
```
```

### [GET] - /v1/health/ready

Checa a status dos componentes da api

#### cURL

```
curl --location 'http://localhost:3000/v1/health/ready'
```

### Exemplo de retorno - status code 200

```json
{
    "status": "ok",
    "info": {
        "mongo": {
            "status": "up"
        }
    },
    "error": {},
    "details": {
        "mongo": {
            "status": "up"
        }
    }
}

```


### [GET] - /v1/health/live

Checa a status da api

#### cURL

```
curl --location 'http://localhost:3000/v1/health/live'
```

### Exemplo de retorno - status code 200

```json
{ "status": "up" }


```

## Observações

Para este desafio foi utilizado:

- **clean arquitecture**: Mantem o projeto organizado em camadas bem definidas. As vantagens são: 
  - Manutenibilidade;
  - testabalidade;
  - Organização;

- **Banco de dados MongoDB**: Para esse projeto o mongoDB é ideal porque não existe relacionamentos entre entidades, um banco flexível e utiliza bem json/Dto. Suporta bem caso o serviço cresça.

- **Padrões Repository e Services Pattern**: Boa prática de utilizar em projetos NestJS, pois isola toda logíca de acesso a dados e orquestra as regras de negócio.

## Troubleshooting DNS docker

```bash

$ nslookup auth.docker.io

$ ping 8.8.8.8

```

Se o nslookup falhar:

- No Docker Desktop (Windows);
- Abra Settings;
- Docker Engine;
- No JSON de configuração, adicione um campo dns;

```
{
  // suas outras configs...
  "dns": ["8.8.8.8", "1.1.1.1"]
}
```

- Clique em Apply & Restart;
- No Linux (ou se você editar o daemon.json direto);
- Edite (ou crie) /etc/docker/daemon.json;

```
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

- reinicie o serviço Docker:

```bash
$ sudo systemctl restart docker
```

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

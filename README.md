# Começando 

Este README descreve os passos necessários para execução da AirShuttle API

## 1.0 - Configurando o projeto ##

Está API requer que o [Node JS](https://nodejs.org/en/) e [Node Package Manager](https://www.npmjs.com/) (NPM). Caso ainda não tenha instalado siga os passos para instalação [aqui](https://nodejs.org/en/download/). Outro passo importante é ter o [MongoDB](https://www.mongodb.com/download-center#atlas) configurado em sua máquina.
> O NPM é instalado por padrão com o Node



### 1.1 - O arquivo .env ###

Com o ambiente configurado, o próximo passo é criar um arquivo `.env` no diretório `config` na raiz do projeto.
> Caso não exista o diretório, é necessário sua criação

O conteúdo do `.env` pode ser conseguido com os responsáveis pelo projeto.

## 2.0 - A execução do projeto ##



Para que o projeto seja executado é necessário instalar todas as dependências e executar o mongodb, para isso use os passos a seguir.

### 2.1 - Instalando dependências

```bash
npm install
```
As dependências serão instaladas no diretório `node_modules`.

### 2.2 - Inializando o banco de dados 

```bash
mongod
```
### 2.3 - Executando a API 

```bash
npm start
```

```bash
npm run production
```

## 3.0 - Responsáveis ##

Este repositório é de responsabilidade de:
 
* Renan Mateus <renanmateus09@gmail.com>
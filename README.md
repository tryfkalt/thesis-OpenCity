# OpenCity

OpenCity is an open-source platform aimed at enhancing community governance by leveraging blockchain technology. It integrates a frontend interface, a backend API, and a decentralized subgraph for efficient data indexing.

## Features

- **Decentralized Governance**: Propose, vote, and execute decisions using blockchain-based smart contracts.
- **Interactive Frontend**: User-friendly interface built with React and ethers.js for seamless interaction.
- **GraphQL Data Indexing**: Efficient querying of blockchain data using The Graph.
- **Secure Backend**: Node.js backend for API services and middleware support.

## Technologies Used

### Frontend

- **React.js**: For building the UI.
- **Ethers.js**: For interacting with Ethereum smart contracts.
- **web3uikit**: For Web3 integration.

### Backend

- **Node.js**: API and server-side functionality.
- **Express.js**: REST API framework.
- **dotenv**: Environment variable management.

### Subgraph

- **The Graph**: Subgraph for querying blockchain events.
- **GraphQL**: For efficient and flexible data retrieval.

### Smart Contracts

- **Solidity**: Smart contract programming.
- **Hardhat**: Development, testing, and deployment framework.

## Setup and Installation

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Hardhat (for contract deployment)
- The Graph CLI (for subgraph deployment)
- Docker and Docker Compose

### Installation

#### Clone the Repository:

```sh
git clone https://github.com/tryfkalt/thesis-OpenCity.git
cd thesis-OpenCity
```

#### Install Dependencies:

**Using npm:**

```sh
cd frontend && npm install && cd ../backend && npm install && cd ../thegraph-OpenCity/opencity && npm install
```

**Using yarn:**

```sh
cd frontend && yarn install && cd ../backend && yarn install && cd ../thegraph-OpenCity/opencity && yarn install
```

### Setup Environment Variables:

Ensure you have a `.env` file in each relevant directory. Use `.env.example` as a reference for required variables.

### Deploy Contracts:

Navigate to the smart contract directory and deploy to the desired network:

```sh
npx hardhat run scripts/deploy.js --network NETWORK_NAME
```

### Running the Application

For convenience, use the provided `start.sh` script to automate the setup process.

```sh
chmod +x start.sh
./start.sh
```

Alternatively, you can manually start each service:

**Backend:**

```sh
cd backend
npm start
```

or

```sh
cd backend
yarn start
```

**Frontend:**

```sh
cd frontend
npm run dev
```

or

```sh
cd frontend
yarn dev
```
### Running with Docker

You can also run the entire application using Docker and Docker Compose. Ensure Docker and Docker Compose are installed on your system.

#### Build and Start Containers:

To build the Docker images and start the containers for the frontend, backend, and subgraph services, run the following commands:

```sh
docker-compose up --build
```

Alternatively, you can build without using the cache and start the containers in detached mode:

```sh
docker compose build --no-cache
docker compose up -d
```

### Deploy Subgraph:

Configure `subgraph.yaml` and deploy:

```sh
graph deploy --node https://api.thegraph.com/deploy/ YOUR_SUBGRAPH_NAME
```

## Usage

### Connect Wallet:

Open the frontend and connect your Ethereum wallet (e.g., MetaMask).

### Create Proposals:

Submit proposals with geolocations and descriptions.

### Vote on Proposals:

Use your voting power to vote "Yes", "No", or "Abstain".

### Queue and Execute:

Queue and execute proposals that pass the voting threshold.

## Contribution Guidelines

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch:

    ```sh
    git checkout -b feature-name
    ```

3. Commit your changes:

    ```sh
    git commit -m "Description of changes"
    ```

4. Push to your branch:

    ```sh
    git push origin feature-name
    ```

5. Submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

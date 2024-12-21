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

### Installation

#### Clone the Repository:

```sh
git clone https://github.com/tryfkalt/thesis-OpenCity.git
cd thesis-OpenCity
```

#### Install Dependencies:

**Frontend:**

```sh
cd frontend
npm install
```

**Backend:**

```sh
cd backend
npm install
```

**Subgraph:**

```sh
cd thegraph-OpenCity/opencity
npm install
```

### Setup Environment Variables:

Create `.env` files in the respective directories. Use `.env.example` as a reference for required variables.

### Deploy Contracts:

Navigate to the smart contract directory and deploy to the desired network:

```sh
npx hardhat run scripts/deploy.js --network NETWORK_NAME
```

### Run the Backend:

```sh
cd backend
npm start
```

### Run the Frontend:

```sh
cd frontend
npm run dev
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